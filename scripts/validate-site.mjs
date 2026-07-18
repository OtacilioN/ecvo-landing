import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { modalities, site } from "../data/ecvo-content.mjs";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function read(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

function schemaBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, contents]) => JSON.parse(contents.trim()));
}

const home = await read("index.html");
for (const modality of modalities) {
  const relativePath = `${modality.slug}/index.html`;
  const html = await read(relativePath);
  const url = `${site.url}/${modality.slug}/`;
  const whatsappLinks = [...html.matchAll(/href="(https:\/\/wa\.me\/[^\"]+)"/g)].map(([, link]) => link);
  const schemas = schemaBlocks(html).flat();

  expect((html.match(/<h1[ >]/g) || []).length === 1, `${relativePath}: deve ter exatamente um H1`);
  expect(html.includes(`<title>${modality.title}</title>`), `${relativePath}: title incorreto`);
  expect(html.includes(`<link rel="canonical" href="${url}" />`), `${relativePath}: canonical incorreto`);
  expect(html.includes(`<meta property="og:url" content="${url}" />`), `${relativePath}: OG URL incorreta`);
  expect(html.includes('meta name="twitter:card"'), `${relativePath}: Twitter metadata ausente`);
  expect(!html.includes("noindex"), `${relativePath}: não pode ter noindex`);
  expect(html.includes('aria-label="Caminho de navegação"'), `${relativePath}: breadcrumb visível ausente`);
  expect((html.match(/<details>/g) || []).length === modality.faq.length, `${relativePath}: FAQ visível fora de sincronia`);
  expect(html.includes('data-track="whatsapp_click"'), `${relativePath}: evento de WhatsApp ausente`);
  expect(html.includes('data-track="schedule_view"'), `${relativePath}: evento de horários ausente`);
  expect(html.includes('data-track="map_click"'), `${relativePath}: evento de mapa ausente`);
  expect(whatsappLinks.length >= 3, `${relativePath}: CTAs de WhatsApp insuficientes`);
  expect(whatsappLinks.every((link) => decodeURIComponent(link).includes(`página de ${modality.name}`)), `${relativePath}: mensagem de WhatsApp não é específica`);
  expect(schemas.some((schema) => schema['@type'] === 'Service'), `${relativePath}: Service JSON-LD ausente`);
  expect(schemas.some((schema) => schema['@type'] === 'BreadcrumbList'), `${relativePath}: BreadcrumbList JSON-LD ausente`);
  const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
  expect(faqSchema?.mainEntity?.length === modality.faq.length, `${relativePath}: FAQPage JSON-LD fora de sincronia`);
  expect(home.includes(`href="/${modality.slug}/"`), `index.html: link para ${modality.slug} ausente`);
}

const sitemap = await read("sitemap.xml");
for (const modality of modalities) {
  expect(sitemap.includes(`${site.url}/${modality.slug}/`), `sitemap.xml: ${modality.slug} ausente`);
}
expect(sitemap.includes(`${site.url}/modalidades/`), "sitemap.xml: página agregadora ausente");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ${modalities.length} páginas de modalidades, schemas, CTAs e sitemap consistentes.`);
}

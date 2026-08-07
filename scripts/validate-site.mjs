import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { modalities, site } from "../data/ecvo-content.mjs";
import { originStory } from "../data/origin-story.mjs";
import { testimonials } from "../data/testimonials.mjs";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const activePages = [
  "index.html",
  "modalidades/index.html",
  ...modalities.map(({ slug }) => `${slug}/index.html`),
  "wellhub-joao-pessoa/index.html",
  "totalpass-joao-pessoa/index.html",
  "depoimentos-alunos/index.html",
  "historia-ecvo/index.html",
  "404.html",
];
const generatedSources = [
  "data/ecvo-content.mjs",
  "scripts/render-paused-page.mjs",
  "scripts/generate-paused-pages.mjs",
  "scripts/generate-modality-pages.mjs",
  "scripts/generate-testimonials.mjs",
  "scripts/generate-origin-story.mjs",
  "script.js",
  "CONTEXT.md",
  "README.md",
  "docs/instrucoes-google-perfil-empresa-ecvo.md",
];
const retiredRoutes = [
  "jiu-jitsu-joao-pessoa",
  "nogi-joao-pessoa",
  "mma-joao-pessoa",
  "muay-thai-joao-pessoa",
  "boxe-joao-pessoa",
];
const retiredAssets = [
  "profAnderson.jpeg",
  "profBarbosa.jpeg",
  "profDimitri.jpeg",
  "profOyama.jpeg",
  "profRodrigo.jpeg",
  "profSauro.jpeg",
  "file.enc",
];
const forbiddenContactOrLocation = /(?:whats?app|wa\.me|api\.whatsapp|83994212431|99421-2431|inspetora|emília mendonça|valentina|58064-360|maps\.app|google\.com\/maps|streetAddress|postalCode|addressLocality|addressRegion|areaServed|latitude|longitude|SportsActivityLocation|LocalBusiness|João Pessoa)/i;
const forbiddenAcquisitionCopy = /(?:agendar|quero começar|primeiro treino|consultar horários|ver horários|como chegar|falar com a equipe|confirmar meu plano|chamar no)/i;

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function read(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

function normalizedText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const relativePath of activePages) {
  const html = await read(relativePath);
  const text = normalizedText(html);
  const instagramLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)]
    .map(([, href]) => href)
    .filter((href) => href.includes("instagram.com"));

  expect((html.match(/<h1[ >]/g) || []).length === 1, `${relativePath}: deve ter exatamente um H1`);
  expect(text.includes(site.description), `${relativePath}: aviso temporário exato ausente do conteúdo visível`);
  expect(html.includes(`<title>${site.title}</title>`), `${relativePath}: title temporário incorreto`);
  expect(html.includes(`<meta name="description" content="${site.description}" />`), `${relativePath}: descrição temporária incorreta`);
  expect(html.includes(`<meta property="og:title" content="${site.title}" />`), `${relativePath}: OG title temporário incorreto`);
  expect(html.includes(`<meta property="og:description" content="${site.description}" />`), `${relativePath}: OG description temporária incorreta`);
  expect(html.includes(`<meta name="twitter:title" content="${site.title}" />`), `${relativePath}: Twitter title temporário incorreto`);
  expect(html.includes(`<meta name="twitter:description" content="${site.description}" />`), `${relativePath}: Twitter description temporária incorreta`);
  expect(html.includes(`<link rel="canonical" href="${site.url}/" />`), `${relativePath}: canonical deve apontar para a home temporária`);
  expect(html.includes(`<meta property="og:url" content="${site.url}/" />`), `${relativePath}: OG URL deve apontar para a home temporária`);
  expect(html.includes(site.fullName), `${relativePath}: nome institucional completo ausente`);
  expect(instagramLinks.length === 1 && instagramLinks[0] === site.instagram, `${relativePath}: deve existir somente o CTA oficial do Instagram`);
  expect(!html.includes('type="application/ld+json"'), `${relativePath}: JSON-LD deve permanecer removido durante a pausa`);
  expect(!forbiddenContactOrLocation.test(html), `${relativePath}: contém dado de contato ou localização retirado`);
  expect(!forbiddenAcquisitionCopy.test(text), `${relativePath}: contém chamada de aquisição incompatível com a lotação`);

  const robots = relativePath === "index.html" ? "index, follow" : "noindex, follow";
  expect(html.includes(`<meta name="robots" content="${robots}" />`), `${relativePath}: diretiva robots incorreta`);
}

for (const relativePath of generatedSources) {
  const contents = await read(relativePath);
  expect(!forbiddenContactOrLocation.test(contents), `${relativePath}: fonte ainda contém dado de contato ou localização retirado`);
}

expect(modalities.length === 2, "data/ecvo-content.mjs: rotas históricas de Kickboxing devem permanecer cobertas pelo aviso");
expect(testimonials.filter(({ featured }) => featured).length <= 3, "data/testimonials.mjs: a curadoria preservada deve manter no máximo três destaques");
expect(originStory.mentor.achievements.length === 5, "data/origin-story.mjs: a história preservada perdeu conquistas confirmadas");
for (const testimonial of testimonials) {
  await access(resolve(root, testimonial.image.slice(1))).catch(() => failures.push(`foto de ${testimonial.name} não encontrada: ${testimonial.image}`));
}

const sitemap = await read("sitemap.xml");
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, location]) => location);
expect(sitemapLocations.length === 1 && sitemapLocations[0] === `${site.url}/`, "sitemap.xml: durante a pausa somente a home deve ser promovida");
expect(!forbiddenContactOrLocation.test(sitemap), "sitemap.xml: contém dado de localização retirado");

for (const route of retiredRoutes) {
  await access(resolve(root, route, "index.html")).then(
    () => failures.push(`${route}/index.html: rota retirada ainda existe`),
    () => {},
  );
}

for (const asset of retiredAssets) {
  await access(resolve(root, "assets", asset)).then(
    () => failures.push(`assets/${asset}: ativo retirado ainda existe`),
    () => {},
  );
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ${activePages.length} páginas focadas no aviso de lotação, sem contato, localização ou JSON-LD local.`);
}

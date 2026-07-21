import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { modalities, site } from "../data/ecvo-content.mjs";
import { originStory } from "../data/origin-story.mjs";
import { testimonials } from "../data/testimonials.mjs";

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

const testimonialsPage = await read("depoimentos-alunos/index.html");
const testimonialSchemas = schemaBlocks(testimonialsPage).flat();
const featuredTestimonials = testimonials.filter((testimonial) => testimonial.featured);

expect((testimonialsPage.match(/<h1[ >]/g) || []).length === 1, "depoimentos-alunos/index.html: deve ter exatamente um H1");
expect(testimonialsPage.includes('<link rel="canonical" href="https://ecvo.com.br/depoimentos-alunos/" />'), "depoimentos-alunos/index.html: canonical incorreto");
expect(testimonialsPage.includes('<meta property="og:url" content="https://ecvo.com.br/depoimentos-alunos/" />'), "depoimentos-alunos/index.html: OG URL incorreta");
expect(testimonialSchemas.some((schema) => schema['@type'] === 'WebPage'), "depoimentos-alunos/index.html: WebPage JSON-LD ausente");
expect(testimonialSchemas.some((schema) => schema['@type'] === 'BreadcrumbList'), "depoimentos-alunos/index.html: BreadcrumbList JSON-LD ausente");
expect(sitemap.includes(`${site.url}/depoimentos-alunos/`), "sitemap.xml: página de depoimentos ausente");
expect(home.includes('href="/depoimentos-alunos/"'), "index.html: link para a página de depoimentos ausente");
expect(featuredTestimonials.length > 0 && featuredTestimonials.length <= 3, "data/testimonials.mjs: selecione entre um e três destaques para a homepage");
expect((home.match(/class="testimonial-home-card/g) || []).length === featuredTestimonials.length, "index.html: destaques de depoimentos fora de sincronia");

for (const testimonial of testimonials) {
  expect(testimonialsPage.includes(`id="${testimonial.slug}"`), `depoimentos-alunos/index.html: relato de ${testimonial.name} ausente`);
  expect(testimonialsPage.includes(`src="..${testimonial.image}"`), `depoimentos-alunos/index.html: foto de ${testimonial.name} ausente`);
  await access(resolve(root, testimonial.image.slice(1))).catch(() => {
    failures.push(`foto de ${testimonial.name} não encontrada: ${testimonial.image}`);
  });
}

const originPage = await read("historia-ecvo/index.html");
const originSchemas = schemaBlocks(originPage).flat();

expect((originPage.match(/<h1[ >]/g) || []).length === 1, "historia-ecvo/index.html: deve ter exatamente um H1");
expect(originPage.includes('<link rel="canonical" href="https://ecvo.com.br/historia-ecvo/" />'), "historia-ecvo/index.html: canonical incorreto");
expect(originPage.includes('<meta property="og:url" content="https://ecvo.com.br/historia-ecvo/" />'), "historia-ecvo/index.html: OG URL incorreta");
expect(originPage.includes('aria-label="Caminho de navegação"'), "historia-ecvo/index.html: breadcrumb visível ausente");
expect(originPage.includes('data-track="whatsapp_click"'), "historia-ecvo/index.html: evento de WhatsApp ausente");
expect(originPage.includes(originStory.mentor.name), "historia-ecvo/index.html: Marcelo Petino ausente");
expect(originPage.includes(originStory.vinicius.name), "historia-ecvo/index.html: Vinicius de Oliveira ausente");
expect((originPage.match(/<article>/g) || []).length === originStory.mentor.achievements.length, "historia-ecvo/index.html: conquistas fora de sincronia");
expect(originSchemas.some((schema) => schema['@type'] === 'AboutPage'), "historia-ecvo/index.html: AboutPage JSON-LD ausente");
expect(originSchemas.some((schema) => schema['@type'] === 'BreadcrumbList'), "historia-ecvo/index.html: BreadcrumbList JSON-LD ausente");
expect(sitemap.includes(`${site.url}/historia-ecvo/`), "sitemap.xml: página da história da ECVO ausente");
expect(home.includes('href="/historia-ecvo/"'), "index.html: link para a história da ECVO ausente");
expect((home.match(/<!-- origin:home:start -->/g) || []).length === 1, "index.html: início da chamada de origem deve ser único");
expect((home.match(/<!-- origin:home:end -->/g) || []).length === 1, "index.html: fim da chamada de origem deve ser único");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ${modalities.length} páginas de modalidades, ${testimonials.length} depoimentos, história da ECVO, schemas, CTAs e sitemap consistentes.`);
}

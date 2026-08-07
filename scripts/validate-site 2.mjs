import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { modalities, schedule, site, teachers } from "../data/ecvo-content.mjs";
import { originStory } from "../data/origin-story.mjs";
import { testimonials } from "../data/testimonials.mjs";

const root = resolve(import.meta.dirname, "..");
const failures = [];

const activePages = [
  "index.html",
  "modalidades/index.html",
  "kickboxing-joao-pessoa/index.html",
  "kickboxing-infantil-joao-pessoa/index.html",
  "wellhub-joao-pessoa/index.html",
  "totalpass-joao-pessoa/index.html",
  "depoimentos-alunos/index.html",
  "historia-ecvo/index.html",
  "404.html",
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

const retiredPublicTerms = /\b(?:Jiu-Jitsu|NoGi|MMA|Muay Thai|Boxe|Anderson|Barbosa|Dimitri|Oyama|Rodrigo|Sauro)\b/i;

function expect(condition, message) {
  if (!condition) failures.push(message);
}

async function read(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

function schemaBlocks(html, relativePath) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, contents], index) => {
      try {
        return JSON.parse(contents.trim());
      } catch (error) {
        failures.push(`${relativePath}: JSON-LD ${index + 1} inválido (${error.message})`);
        return [];
      }
    })
    .flat();
}

function metadataTitles(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
  return [
    head.match(/<title>([^<]+)<\/title>/)?.[1],
    head.match(/<meta property="og:title" content="([^"]+)"\s*\/?>/)?.[1],
    head.match(/<meta name="twitter:title" content="([^"]+)"\s*\/?>/)?.[1],
  ];
}

const pages = new Map();
for (const relativePath of activePages) {
  const html = await read(relativePath);
  pages.set(relativePath, html);
  expect((html.match(/<h1[ >]/g) || []).length === 1, `${relativePath}: deve ter exatamente um H1`);
  expect(!retiredPublicTerms.test(html), `${relativePath}: contém prática ou professor retirado da oferta pública`);
  expect(!retiredRoutes.some((route) => html.includes(`/${route}/`)), `${relativePath}: contém link para rota retirada`);
  expect(html.includes(site.fullName), `${relativePath}: nome institucional completo ausente`);
  schemaBlocks(html, relativePath);
}

const home = pages.get("index.html");
const homeSchemas = schemaBlocks(home, "index.html");
const homeBusiness = homeSchemas.find((schema) => (
  Array.isArray(schema["@type"])
    ? schema["@type"].includes("LocalBusiness")
    : schema["@type"] === "LocalBusiness"
));
const homeWebsite = homeSchemas.find((schema) => schema["@type"] === "WebSite");
const homeFaq = homeSchemas.find((schema) => schema["@type"] === "FAQPage");

expect(home.includes(`<title>${site.homeTitle}</title>`), "index.html: title deve usar o posicionamento de Kickboxing");
expect(home.includes(`<meta property="og:title" content="${site.homeTitle}" />`), "index.html: OG title incorreto");
expect(home.includes(`<meta name="twitter:title" content="${site.homeTitle}" />`), "index.html: Twitter title incorreto");
expect(home.includes('<h1 id="hero-title" data-reveal>Kickboxing em João Pessoa</h1>'), "index.html: H1 deve apresentar Kickboxing em João Pessoa");
expect(home.includes("Uma escola. Uma modalidade. Um professor."), "index.html: declaração central do novo posicionamento ausente");
expect(homeBusiness?.alternateName === site.fullName, "index.html: alternateName do negócio incorreto");
expect(homeBusiness?.description?.includes("exclusivamente ao Kickboxing"), "index.html: LocalBusiness não declara foco exclusivo em Kickboxing");
expect(homeBusiness?.employee?.name === "Vinícius Oliveira", "index.html: professor no LocalBusiness incorreto");
expect(homeBusiness?.employee?.jobTitle === "Professor de Kickboxing", "index.html: cargo do professor no LocalBusiness incorreto");
expect(homeBusiness?.makesOffer?.length === 2, "index.html: LocalBusiness deve conter somente duas ofertas de Kickboxing");
expect(homeBusiness?.makesOffer?.every((offer) => offer.itemOffered?.serviceType?.startsWith("Kickboxing")), "index.html: LocalBusiness contém oferta fora do Kickboxing");
expect(homeWebsite?.["@id"] === `${site.url}/#website`, "index.html: WebSite JSON-LD ausente ou incorreto");
expect(homeFaq?.mainEntity?.length === (home.match(/<details/g) || []).length, "index.html: FAQPage JSON-LD fora de sincronia com a FAQ visível");
expect((home.match(/class="professor-profile/g) || []).length === 1, "index.html: deve haver exatamente um perfil de professor");
expect((home.match(/class="aula"/g) || []).length === schedule.reduce((total, day) => total + day.classes.length, 0), "index.html: grade visível fora de sincronia");

expect(Object.keys(teachers).length === 1 && teachers.vinicius, "data/ecvo-content.mjs: somente Vinícius deve permanecer em teachers");
expect(teachers.vinicius.name === "Prof. Vinícius Oliveira", "data/ecvo-content.mjs: nome público do professor incorreto");
expect(modalities.length === 2, "data/ecvo-content.mjs: devem existir apenas as páginas de Kickboxing adulto e infantil");
expect(modalities.every((item) => item.name.startsWith("Kickboxing")), "data/ecvo-content.mjs: oferta fora do Kickboxing");
expect(modalities.every((item) => item.teacherIds.length === 1 && item.teacherIds[0] === "vinicius"), "data/ecvo-content.mjs: turma associada a professor diferente de Vinícius");
expect(schedule.length === 3, "data/ecvo-content.mjs: a grade pública deve conter somente os três dias confirmados de Kickboxing");
expect(schedule.every(({ classes }) => classes.every(([, , name, teacher]) => name.startsWith("Kickboxing") && teacher === "Prof. Vinícius Oliveira")), "data/ecvo-content.mjs: grade contém prática ou professor inválido");

for (const modality of modalities) {
  const relativePath = `${modality.slug}/index.html`;
  const html = pages.get(relativePath);
  const url = `${site.url}/${modality.slug}/`;
  const whatsappLinks = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(([, link]) => link);
  const schemas = schemaBlocks(html, relativePath);

  expect(html.includes(`<title>${modality.title}</title>`), `${relativePath}: title incorreto`);
  expect(html.includes(`<link rel="canonical" href="${url}" />`), `${relativePath}: canonical incorreto`);
  expect(html.includes(`<meta property="og:url" content="${url}" />`), `${relativePath}: OG URL incorreta`);
  expect(!html.includes("noindex"), `${relativePath}: não pode ter noindex`);
  expect(html.includes('aria-label="Caminho de navegação"'), `${relativePath}: breadcrumb visível ausente`);
  expect((html.match(/<details>/g) || []).length === modality.faq.length, `${relativePath}: FAQ visível fora de sincronia`);
  expect(whatsappLinks.length >= 3, `${relativePath}: CTAs de WhatsApp insuficientes`);
  expect(whatsappLinks.every((link) => decodeURIComponent(link).includes(`página de ${modality.name}`)), `${relativePath}: mensagem de WhatsApp não é específica`);
  expect(schemas.some((schema) => schema["@type"] === "Service"), `${relativePath}: Service JSON-LD ausente`);
  expect(schemas.some((schema) => schema["@type"] === "BreadcrumbList"), `${relativePath}: BreadcrumbList JSON-LD ausente`);
  expect(schemas.find((schema) => schema["@type"] === "FAQPage")?.mainEntity?.length === modality.faq.length, `${relativePath}: FAQPage JSON-LD fora de sincronia`);
  expect(home.includes(`href="/${modality.slug}/"`), `index.html: link para ${modality.slug} ausente`);
}

const hub = pages.get("modalidades/index.html");
expect(hub.includes(`<title>${site.trainingTitle}</title>`), "modalidades/index.html: title incorreto");
expect((hub.match(/class="modalities-directory"/g) || []).length === 1, "modalidades/index.html: diretório de treinos ausente");
expect(modalities.every((item) => hub.includes(`/${item.slug}/`)), "modalidades/index.html: turma de Kickboxing ausente");

for (const relativePath of ["wellhub-joao-pessoa/index.html", "totalpass-joao-pessoa/index.html"]) {
  const html = pages.get(relativePath);
  const titles = metadataTitles(html);
  const schemas = schemaBlocks(html, relativePath);
  expect(titles.every(Boolean) && new Set(titles).size === 1, `${relativePath}: title, OG title e Twitter title devem ser iguais`);
  expect(titles.every((title) => title.includes("Kickboxing")), `${relativePath}: metadados devem destacar Kickboxing`);
  expect(schemas.find((schema) => schema["@type"] === "Service")?.serviceType?.includes("Kickboxing"), `${relativePath}: Service deve representar Kickboxing`);
  const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
  expect(faqSchema?.mainEntity?.length === (html.match(/<details>/g) || []).length, `${relativePath}: FAQ visível e FAQPage fora de sincronia`);
}

const sitemap = await read("sitemap.xml");
for (const modality of modalities) {
  expect(sitemap.includes(`${site.url}/${modality.slug}/`), `sitemap.xml: ${modality.slug} ausente`);
}
for (const route of retiredRoutes) {
  expect(!sitemap.includes(`/${route}/`), `sitemap.xml: rota retirada ${route} ainda presente`);
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

const testimonialsPage = pages.get("depoimentos-alunos/index.html");
const testimonialSchemas = schemaBlocks(testimonialsPage, "depoimentos-alunos/index.html");
const featuredTestimonials = testimonials.filter((testimonial) => testimonial.featured);

expect(testimonialSchemas.some((schema) => schema["@type"] === "WebPage"), "depoimentos-alunos/index.html: WebPage JSON-LD ausente");
expect(testimonialSchemas.some((schema) => schema["@type"] === "BreadcrumbList"), "depoimentos-alunos/index.html: BreadcrumbList JSON-LD ausente");
expect(featuredTestimonials.length > 0 && featuredTestimonials.length <= 3, "data/testimonials.mjs: selecione entre um e três destaques para a homepage");
expect((home.match(/class="testimonial-home-card/g) || []).length === featuredTestimonials.length, "index.html: destaques de depoimentos fora de sincronia");
for (const testimonial of testimonials) {
  expect(testimonialsPage.includes(`id="${testimonial.slug}"`), `depoimentos-alunos/index.html: relato de ${testimonial.name} ausente`);
  await access(resolve(root, testimonial.image.slice(1))).catch(() => failures.push(`foto de ${testimonial.name} não encontrada: ${testimonial.image}`));
}

const originPage = pages.get("historia-ecvo/index.html");
const originSchemas = schemaBlocks(originPage, "historia-ecvo/index.html");
expect(originPage.includes(originStory.mentor.name), "historia-ecvo/index.html: mentor histórico ausente");
expect(originPage.includes(originStory.vinicius.name), "historia-ecvo/index.html: Vinícius Oliveira ausente");
expect(originPage.includes("único professor da ECVO"), "historia-ecvo/index.html: papel atual de Vinícius não está explícito");
expect((originPage.match(/<article>/g) || []).length === originStory.mentor.achievements.length, "historia-ecvo/index.html: conquistas fora de sincronia");
expect(originSchemas.some((schema) => schema["@type"] === "AboutPage"), "historia-ecvo/index.html: AboutPage JSON-LD ausente");
expect(originSchemas.some((schema) => schema["@type"] === "BreadcrumbList"), "historia-ecvo/index.html: BreadcrumbList JSON-LD ausente");

expect(sitemap.includes(`${site.url}/modalidades/`), "sitemap.xml: hub de treinos ausente");
expect(sitemap.includes(`${site.url}/depoimentos-alunos/`), "sitemap.xml: página de depoimentos ausente");
expect(sitemap.includes(`${site.url}/historia-ecvo/`), "sitemap.xml: página da história ausente");
expect((home.match(/<!-- origin:home:start -->/g) || []).length === 1, "index.html: marcador inicial da origem deve ser único");
expect((home.match(/<!-- origin:home:end -->/g) || []).length === 1, "index.html: marcador final da origem deve ser único");
expect((home.match(/<!-- testimonials:home:start -->/g) || []).length === 1, "index.html: marcador inicial dos depoimentos deve ser único");
expect((home.match(/<!-- testimonials:home:end -->/g) || []).length === 1, "index.html: marcador final dos depoimentos deve ser único");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ECVO exclusiva em Kickboxing, ${modalities.length} páginas de treino, 1 professor, ${testimonials.length} depoimentos e rotas retiradas.`);
}

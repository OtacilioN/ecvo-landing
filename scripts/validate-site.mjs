import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { blogPosts, featuredBlogPost } from "../data/blog-posts.mjs";
import { modalities, schedule, site, teachers } from "../data/ecvo-content.mjs";
import { originStory } from "../data/origin-story.mjs";
import { testimonials } from "../data/testimonials.mjs";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const retiredReferencePattern = new RegExp("d[ií]namos?\\s+suplementos", "i");
const activeTeacherNames = ["Prof. Vinicius", "Prof. Oyama", "Sensei Adriano"];
const teachersOnHold = ["Prof. Anderson", "Prof. Dimitri", "Prof. Rodrigo", "Prof. Sauro"];
const modalitiesWithoutPublishedSchedule = [
  "jiu-jitsu-joao-pessoa",
  "nogi-joao-pessoa",
  "boxe-joao-pessoa",
  "kickboxing-funcional-aeroboxe-joao-pessoa",
  "karate-joao-pessoa",
  "krav-maga-joao-pessoa",
  "judo-turma-kids-joao-pessoa",
  "mma-joao-pessoa",
];

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
const homeHead = home.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const homeSchemas = schemaBlocks(home).flat();
const homeBusiness = homeSchemas.find((schema) => (
  Array.isArray(schema["@type"])
    ? schema["@type"].includes("LocalBusiness")
    : schema["@type"] === "LocalBusiness"
));

expect(home.includes(`<title>${site.homeTitle}</title>`), "index.html: title deve usar o posicionamento geral da ECVO");
expect(home.includes(`<meta property="og:title" content="${site.homeTitle}" />`), "index.html: OG title deve ser igual ao title geral");
expect(home.includes(`<meta name="twitter:title" content="${site.homeTitle}" />`), "index.html: Twitter title deve ser igual ao title geral");
expect(home.includes(`<h1 id="hero-title">${site.positioning}</h1>`), "index.html: H1 deve apresentar a ECVO como escola de lutas e artes marciais sem animação que atrase o LCP");
expect(!home.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0].includes("data-reveal"), "index.html: conteúdo inicial do hero não pode ficar oculto por animação");
expect(homeHead.includes('rel="preload" as="style" href="styles.css?v=19"'), "index.html: CSS principal deve ser carregado sem bloquear a renderização");
expect(homeBusiness?.description?.startsWith(site.positioning), "index.html: LocalBusiness deve começar pelo posicionamento geral da ECVO");
expect(homeBusiness?.address?.streetAddress === site.address, "index.html: streetAddress deve usar o endereço canônico");
expect(homeBusiness?.address?.postalCode === site.postalCode, "index.html: postalCode deve usar o CEP canônico");
expect(homeBusiness?.hasMap === site.mapUrl, "index.html: hasMap deve usar a localização canônica");
expect(modalities.length === 12, "data/ecvo-content.mjs: o catálogo deve manter doze modalidades");
expect(home.includes("<dt>12</dt>"), "index.html: contador público deve informar doze modalidades");
const offeredServiceNames = (homeBusiness?.makesOffer ?? []).map((offer) => offer?.itemOffered?.name);
expect(offeredServiceNames.length === modalities.length, "index.html: makesOffer deve representar as doze modalidades");
for (const modality of modalities) {
  expect(offeredServiceNames.includes(`Aulas de ${modality.name} em João Pessoa`), `index.html: makesOffer de ${modality.name} ausente`);
}
expect(home.includes(site.reference), "index.html: ponto de referência ausente");
expect(!/Academia de Jiu-Jitsu/i.test(homeHead), "index.html: metadados gerais não podem definir a ECVO como academia de Jiu-Jitsu");

const publicTeacherSection = home.match(/<section class="section professores"[\s\S]*?<\/section>/)?.[0] ?? "";
const publicHomeSchedule = home.match(/<!-- schedule:start -->([\s\S]*?)<!-- schedule:end -->/)?.[1] ?? "";
const publishedClasses = schedule.flatMap(({ classes }) => classes);

expect(Object.keys(teachers).length === 3, "data/ecvo-content.mjs: deve manter três professores ativos");
expect((publicTeacherSection.match(/class="professor-profile(?:\s|\")/g) || []).length === 3, "index.html: deve exibir exatamente três professores");
for (const teacherName of activeTeacherNames) {
  expect(publicTeacherSection.includes(teacherName), `index.html: ${teacherName} deve permanecer na seção de professores`);
}
for (const teacher of Object.values(teachers)) {
  await access(resolve(root, teacher.image.slice(1))).catch(() => {
    failures.push(`data/ecvo-content.mjs: foto de ${teacher.name} não encontrada: ${teacher.image}`);
  });
}
for (const teacherName of teachersOnHold) {
  expect(!home.includes(teacherName), `index.html: ${teacherName} não deve aparecer publicamente`);
}
expect(publishedClasses.length === 19, "data/ecvo-content.mjs: a grade confirmada deve conter 19 aulas");
expect(publishedClasses.every((entry) => entry.length === 3), "data/ecvo-content.mjs: horários públicos não devem armazenar nome de professor");
expect((publicHomeSchedule.match(/class="aula"/g) || []).length === publishedClasses.length, "index.html: grade pública fora de sincronia com a fonte");
expect((publicHomeSchedule.match(/class="dia"/g) || []).length === schedule.length, "index.html: quantidade de dias da grade fora de sincronia");
expect(!publicHomeSchedule.includes("aula-prof"), "index.html: grade não deve exibir nome de professor");
expect(!modalitiesWithoutPublishedSchedule.some((slug) => publishedClasses.some(([, slugs]) => slugs.split(" ").includes(slug))), "data/ecvo-content.mjs: modalidade sem grade confirmada não pode ter horário publicado");
const karateKidsClasses = publishedClasses.filter(([, slugs]) => slugs.split(" ").includes("karate-turma-kids-joao-pessoa"));
expect(karateKidsClasses.length === 4, "data/ecvo-content.mjs: Karatê - Turma Kids deve ter quatro aulas publicadas");
expect(karateKidsClasses.filter(([time]) => time === "10:00").length === 2, "data/ecvo-content.mjs: Karatê - Turma Kids deve ter duas aulas às 10:00");
expect(karateKidsClasses.filter(([time]) => time === "15:00").length === 2, "data/ecvo-content.mjs: Karatê - Turma Kids deve ter duas aulas às 15:00");
for (const day of ["Terça", "Quinta"]) {
  const dayClasses = schedule.find((item) => item.day === day)?.classes ?? [];
  expect(dayClasses.some(([time, slug]) => time === "10:00" && slug === "karate-turma-kids-joao-pessoa"), `data/ecvo-content.mjs: Karatê - Turma Kids deve ter aula na ${day} às 10:00`);
  expect(dayClasses.some(([time, slug]) => time === "15:00" && slug === "karate-turma-kids-joao-pessoa"), `data/ecvo-content.mjs: Karatê - Turma Kids deve ter aula na ${day} às 15:00`);
}
for (const slug of ["karate-joao-pessoa", "karate-turma-kids-joao-pessoa", "krav-maga-joao-pessoa"]) {
  const modality = modalities.find((item) => item.slug === slug);
  expect(JSON.stringify(modality?.teacherIds) === JSON.stringify(["adriano"]), `data/ecvo-content.mjs: ${slug} deve estar associado somente ao Sensei Adriano`);
}

const generalistPages = [
  "index.html",
  "modalidades/index.html",
  "depoimentos-alunos/index.html",
  "historia-ecvo/index.html",
  "wellhub-joao-pessoa/index.html",
  "totalpass-joao-pessoa/index.html",
  "blog/index.html",
];

for (const relativePath of generalistPages) {
  const html = relativePath === "index.html" ? home : await read(relativePath);
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
  const titleSignals = [
    head.match(/<title>([^<]+)<\/title>/)?.[1],
    head.match(/<meta property="og:title" content="([^"]+)"\s*\/?>/)?.[1],
    head.match(/<meta name="twitter:title" content="([^"]+)"\s*\/?>/)?.[1],
  ];

  expect(titleSignals.every(Boolean), `${relativePath}: title, OG title e Twitter title devem estar completos`);
  expect(new Set(titleSignals).size === 1, `${relativePath}: title, OG title e Twitter title devem ser iguais`);
  expect(
    titleSignals.every((title) => !/(?:Jiu-Jitsu|NoGi)/i.test(title ?? "")),
    `${relativePath}: títulos generalistas não podem posicionar a ECVO como Jiu-Jitsu ou NoGi`,
  );
}

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
  expect(/class="whatsapp-float"[^>]*><svg/.test(html), `${relativePath}: botão flutuante deve usar o ícone do WhatsApp`);
  expect(html.includes(site.address), `${relativePath}: endereço canônico ausente`);
  expect(html.includes(site.postalCode), `${relativePath}: CEP canônico ausente`);
  expect(html.includes(site.reference), `${relativePath}: ponto de referência ausente`);
  expect(whatsappLinks.length >= 3, `${relativePath}: CTAs de WhatsApp insuficientes`);
  expect(whatsappLinks.every((link) => decodeURIComponent(link).includes(`página de ${modality.name}`)), `${relativePath}: mensagem de WhatsApp não é específica`);
  expect(schemas.some((schema) => schema['@type'] === 'Service'), `${relativePath}: Service JSON-LD ausente`);
  expect(schemas.some((schema) => schema['@type'] === 'BreadcrumbList'), `${relativePath}: BreadcrumbList JSON-LD ausente`);
  const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
  expect(faqSchema?.mainEntity?.length === modality.faq.length, `${relativePath}: FAQPage JSON-LD fora de sincronia`);
  expect(home.includes(`href="/${modality.slug}/"`), `index.html: link para ${modality.slug} ausente`);
  if (modality.heroImage) {
    expect(html.includes('class="modality-hero has-photo"'), `${relativePath}: hero deve apresentar a foto canônica da turma`);
    expect(html.includes(`<meta property="og:image" content="${site.url}${modality.heroImage.src}" />`), `${relativePath}: OG image deve usar a foto canônica da turma`);
    expect(html.includes('<meta name="twitter:card" content="summary_large_image" />'), `${relativePath}: Twitter card deve destacar a foto da turma`);
    await access(resolve(root, modality.heroImage.src.slice(1))).catch(() => {
      failures.push(`${relativePath}: foto canônica não encontrada: ${modality.heroImage.src}`);
    });
    for (const source of modality.heroImage.srcSet.split(", ")) {
      const imagePath = source.replace(/\s+\d+w$/, "");
      await access(resolve(root, imagePath.slice(1))).catch(() => {
        failures.push(`${relativePath}: variação responsiva não encontrada: ${imagePath}`);
      });
    }
  }
  const teacherIds = modality.teacherIds ?? [];
  if (teacherIds.length) {
    expect(html.includes("modality-teachers"), `${relativePath}: professor da modalidade deve ser apresentado`);
    for (const teacherId of teacherIds) {
      expect(Boolean(teachers[teacherId]), `${relativePath}: professor ${teacherId} não existe na fonte canônica`);
      expect(html.includes(teachers[teacherId]?.name ?? ""), `${relativePath}: professor ${teacherId} ausente`);
    }
  } else {
    expect(!html.includes("modality-teachers"), `${relativePath}: não deve associar professor sem confirmação na fonte canônica`);
    expect(!/Prof\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/u.test(html), `${relativePath}: conteúdo não deve exibir professor sem associação canônica`);
  }

  if (modalitiesWithoutPublishedSchedule.includes(modality.slug)) {
    expect(html.includes(modality.scheduleTitle ?? "Horários ainda não disponíveis."), `${relativePath}: deve informar objetivamente que não há horários publicados`);
  }
}

const sitemap = await read("sitemap.xml");
for (const modality of modalities) {
  expect(sitemap.includes(`${site.url}/${modality.slug}/`), `sitemap.xml: ${modality.slug} ausente`);
}
expect(sitemap.includes(`${site.url}/modalidades/`), "sitemap.xml: página agregadora ausente");

const modalitiesDirectory = await read("modalidades/index.html");
expect((modalitiesDirectory.match(/<a(?=[^>]*href="\/[^"]+-joao-pessoa\/")[^>]*>/g) || []).length === modalities.length, "modalidades/index.html: deve manter todas as modalidades no hall");
for (const modality of modalities.filter((item) => item.heroImage)) {
  expect(modalitiesDirectory.includes(`alt="${modality.heroImage.alt}"`), `modalidades/index.html: foto de ${modality.name} deve ter texto alternativo`);
}
expect(!home.replaceAll("kickboxing-infantil-joao-pessoa", "").includes("Kickboxing Infantil"), "index.html: o nome anterior do Kickboxing Kids não deve aparecer publicamente");

const archivedTeachers = await read("_internal/professores-em-reestruturacao.md");
for (const teacherName of teachersOnHold) {
  expect(archivedTeachers.includes(teacherName), `_internal/professores-em-reestruturacao.md: informações de ${teacherName} ausentes`);
}

const publicHtmlPaths = [
  ...generalistPages,
  ...modalities.map((modality) => `${modality.slug}/index.html`),
  ...blogPosts.map((post) => `blog/${post.slug}/index.html`),
];

for (const relativePath of publicHtmlPaths) {
  const html = relativePath === "index.html" ? home : await read(relativePath);
  expect(!html.includes("Kickboxing Infantil"), `${relativePath}: o nome anterior do Kickboxing Kids não deve aparecer publicamente`);
  expect(html.includes("archivo-black-latin.woff2"), `${relativePath}: fonte crítica local deve ser pré-carregada`);
  expect(!html.includes("family=Archivo+Black"), `${relativePath}: Archivo Black não pode depender do Google Fonts`);
  expect(!html.includes('script async src="https://www.googletagmanager.com/gtag/js'), `${relativePath}: Analytics não pode bloquear o carregamento inicial`);
  expect(html.includes("script.js?v=4"), `${relativePath}: carregador adiado do Analytics deve usar script.js v4`);
  for (const teacherName of teachersOnHold) {
    expect(!html.includes(teacherName), `${relativePath}: ${teacherName} não deve aparecer no HTML público`);
  }
}

const locationSurfaces = [
  "index.html",
  ...modalities.map((modality) => `${modality.slug}/index.html`),
  "wellhub-joao-pessoa/index.html",
  "totalpass-joao-pessoa/index.html",
  "docs/instrucoes-google-perfil-empresa-ecvo.md",
];

for (const relativePath of locationSurfaces) {
  const contents = relativePath === "index.html" ? home : await read(relativePath);
  expect(contents.includes(site.address), `${relativePath}: endereço canônico ausente`);
  expect(contents.includes(site.postalCode), `${relativePath}: CEP canônico ausente`);
  expect(contents.includes(site.reference), `${relativePath}: ponto de referência ausente`);
  expect(!retiredReferencePattern.test(contents), `${relativePath}: referência comercial anterior deve ser removida`);
}

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

const blogIndex = await read("blog/index.html");
expect((blogIndex.match(/<h1[ >]/g) || []).length === 1, "blog/index.html: deve ter exatamente um H1");
expect(blogIndex.includes('<link rel="canonical" href="https://ecvo.com.br/blog/" />'), "blog/index.html: canonical incorreto");
expect(blogIndex.includes('"@type":"CollectionPage"'), "blog/index.html: CollectionPage JSON-LD ausente");
expect(sitemap.includes(`${site.url}/blog/`), "sitemap.xml: índice do blog ausente");
expect((home.match(/<!-- blog:home:start -->/g) || []).length === 1, "index.html: início da chamada do blog deve ser único");
expect((home.match(/<!-- blog:home:end -->/g) || []).length === 1, "index.html: fim da chamada do blog deve ser único");
expect(home.includes(`href="/blog/${featuredBlogPost.slug}/"`), "index.html: conteúdo em destaque do blog ausente");

for (const post of blogPosts) {
  const relativePath = `blog/${post.slug}/index.html`;
  const html = await read(relativePath);
  const url = `${site.url}/blog/${post.slug}/`;
  const schemas = schemaBlocks(html).flat();

  expect((html.match(/<h1[ >]/g) || []).length === 1, `${relativePath}: deve ter exatamente um H1`);
  expect(html.includes(`<title>${post.title} | ECVO</title>`), `${relativePath}: title incorreto`);
  expect(html.includes(`<link rel="canonical" href="${url}" />`), `${relativePath}: canonical incorreto`);
  expect(html.includes('<meta property="og:type" content="article" />'), `${relativePath}: OG type deve ser article`);
  expect(schemas.some((schema) => schema['@type'] === 'BlogPosting'), `${relativePath}: BlogPosting JSON-LD ausente`);
  expect(schemas.some((schema) => schema['@type'] === 'BreadcrumbList'), `${relativePath}: BreadcrumbList JSON-LD ausente`);
  expect(post.references.every((reference) => html.includes(reference.url)), `${relativePath}: referências científicas incompletas`);
  expect(blogIndex.includes(`href="/blog/${post.slug}/"`), `blog/index.html: link para ${post.slug} ausente`);
  expect(sitemap.includes(url), `sitemap.xml: ${post.slug} ausente`);
  await access(resolve(root, post.image.webp.slice(1))).catch(() => failures.push(`${relativePath}: imagem WebP ausente`));
  await access(resolve(root, post.image.social.slice(1))).catch(() => failures.push(`${relativePath}: imagem social ausente`));
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ${modalities.length} páginas de modalidades, ${testimonials.length} depoimentos, ${blogPosts.length} conteúdo de blog, história da ECVO, schemas, CTAs e sitemap consistentes.`);
}

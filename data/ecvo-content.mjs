/**
 * Fonte única para a comunicação pública temporária da ECVO.
 * Enquanto as turmas estiverem completas, nenhuma página pública deve exibir
 * oferta, horários, dados de contato ou dados de localização.
 */
export const site = {
  name: "ECVO",
  fullName: "Escola de Combate Vinícius Oliveira",
  title: "ECVO | Sem vagas no momento",
  description: "No momento estamos sem vagas na equipe da ECVO, siga nosso instagram para ficar por dentro de novidades",
  url: "https://ecvo.com.br",
  instagram: "https://www.instagram.com/ecvo.jp/",
  instagramHandle: "@ecvo.jp",
  logo: "/assets/ecvo-logo.png",
};

// As rotas históricas permanecem acessíveis, mas exibem somente o aviso temporário.
export const modalities = [
  { slug: "kickboxing-joao-pessoa", name: "Kickboxing" },
  { slug: "kickboxing-infantil-joao-pessoa", name: "Kickboxing Infantil" },
];

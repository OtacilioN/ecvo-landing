/**
 * Fonte única para as páginas de Kickboxing e para a grade de horários.
 * As páginas públicas são geradas estaticamente por scripts/generate-modality-pages.mjs.
 */
export const site = {
  name: "ECVO",
  fullName: "Escola de Combate Vinícius Oliveira",
  positioning: "Escola de Kickboxing em João Pessoa",
  homeTitle: "Kickboxing em João Pessoa | ECVO — Escola de Combate Vinícius Oliveira",
  trainingTitle: "Treinos de Kickboxing em João Pessoa | ECVO",
  url: "https://ecvo.com.br",
  phone: "+55 83 99421-2431",
  whatsapp: "5583994212431",
  address: "R. Inspetora Emília Mendonça Gomes, 195 - Valentina",
  locality: "João Pessoa",
  region: "PB",
  postalCode: "58064-360",
  mapUrl: "https://maps.app.goo.gl/3aVDa9RmmNumnbJN8",
  instagram: "https://www.instagram.com/ecvo.jp/",
  logo: "/assets/ecvo-logo.png",
};

export const teachers = {
  vinicius: {
    name: "Prof. Vinícius Oliveira",
    area: "Kickboxing · Professor responsável",
    image: "/assets/profVinicius.jpeg",
    alt: "Professor Vinícius Oliveira, único professor da ECVO",
    summary: "Vinícius Oliveira é o único professor da ECVO e conduz todas as turmas de Kickboxing com técnica, disciplina e acompanhamento próximo.",
  },
};

// Permanecem apenas os horários que já eram confirmados como Kickboxing.
export const schedule = [
  { day: "Segunda", classes: [
    ["09:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
    ["17:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
    ["18:00", "kickboxing-infantil-joao-pessoa", "Kickboxing Infantil", "Prof. Vinícius Oliveira"],
    ["20:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
  ] },
  { day: "Quarta", classes: [
    ["09:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
    ["17:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
    ["18:00", "kickboxing-infantil-joao-pessoa", "Kickboxing Infantil", "Prof. Vinícius Oliveira"],
    ["20:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
  ] },
  { day: "Sexta", classes: [
    ["09:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
    ["17:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
    ["18:00", "kickboxing-infantil-joao-pessoa", "Kickboxing Infantil", "Prof. Vinícius Oliveira"],
    ["20:00", "kickboxing-joao-pessoa", "Kickboxing", "Prof. Vinícius Oliveira"],
  ] },
];

const firstTraining = [
  "Escolha uma turma e um horário que combinem com a sua rotina.",
  "Agende pelo WhatsApp e conte se é a sua primeira experiência com Kickboxing.",
  "Receba a orientação sobre roupas e equipamentos antes da aula.",
  "Participe do treino com acompanhamento do professor Vinícius Oliveira.",
];

export const modalities = [
  {
    slug: "kickboxing-joao-pessoa",
    name: "Kickboxing",
    title: "Kickboxing em João Pessoa | ECVO",
    description: "Treine Kickboxing no Valentina, em João Pessoa, na escola dedicada exclusivamente à modalidade e conduzida pelo professor Vinícius Oliveira.",
    hero: "Uma escola dedicada exclusivamente ao Kickboxing, com técnica de socos e chutes, condicionamento e acompanhamento do professor Vinícius Oliveira.",
    audiences: [
      "Pessoas iniciantes que querem aprender socos, chutes e movimentação com orientação.",
      "Quem busca uma rotina de treino que combine técnica e condicionamento.",
      "Praticantes que desejam aprimorar combinações, distância e coordenação.",
      "Alunos interessados em evolução esportiva dentro do Kickboxing.",
    ],
    benefits: [
      ["Técnica completa", "Base, postura, socos, chutes e combinações são desenvolvidos com atenção aos fundamentos."],
      ["Coordenação e distância", "Deslocamentos e sequências ajudam a organizar ritmo, espaço e tempo de reação."],
      ["Condicionamento", "O treino desafia o corpo com consistência, respeitando o nível e o momento de cada aluno."],
    ],
    teacherIds: ["vinicius"],
    scheduleSlugs: ["kickboxing-joao-pessoa"],
    method: "Toda a ECVO está organizada em torno do Kickboxing. As turmas são conduzidas pelo professor Vinícius Oliveira, com progressão técnica e acompanhamento para diferentes níveis.",
    related: ["kickboxing-infantil-joao-pessoa"],
    faq: [
      ["Preciso ter luvas no primeiro treino?", "Fale com a equipe antes de ir. Ela orienta sobre roupas e equipamentos para o primeiro treino."],
      ["Kickboxing é indicado para iniciantes?", "A ECVO recebe alunos em diferentes níveis. Confirme pelo WhatsApp qual horário é mais adequado para começar."],
      ["A ECVO oferece somente Kickboxing?", "Sim. A ECVO é uma escola dedicada exclusivamente ao Kickboxing, com turmas para adultos e uma turma infantil."],
      ["Quem conduz as aulas?", "Todas as turmas são conduzidas pelo professor Vinícius Oliveira, único professor da ECVO."],
      ["O treino envolve contato desde a primeira aula?", "A organização do treino é orientada pelo professor. Confirme com a equipe como funciona a aula para iniciantes."],
    ],
    firstTraining,
  },
  {
    slug: "kickboxing-infantil-joao-pessoa",
    name: "Kickboxing Infantil",
    title: "Kickboxing Infantil em João Pessoa | ECVO",
    description: "Kickboxing Infantil no Valentina, em João Pessoa, com técnica, coordenação, disciplina e acompanhamento do professor Vinícius Oliveira.",
    hero: "Fundamentos de Kickboxing apresentados de forma orientada, com atenção à técnica, à coordenação, à convivência e à segurança.",
    audiences: [
      "Crianças que querem conhecer o Kickboxing com acompanhamento.",
      "Responsáveis que buscam uma prática de movimento, disciplina e convivência.",
      "Crianças iniciantes, respeitando o ritmo e a orientação da turma.",
      "Famílias que desejam confirmar a faixa etária e a disponibilidade diretamente com a equipe.",
    ],
    benefits: [
      ["Desenvolvimento motor", "Movimentos, deslocamentos e fundamentos adaptados estimulam coordenação e consciência corporal."],
      ["Disciplina e convivência", "A turma trabalha escuta, respeito ao professor, aos colegas e aos combinados do treino."],
      ["Técnica com acompanhamento", "Os fundamentos são apresentados de forma gradual e apropriada para o contexto da turma."],
    ],
    teacherIds: ["vinicius"],
    scheduleSlugs: ["kickboxing-infantil-joao-pessoa"],
    method: "A turma infantil apresenta os fundamentos do Kickboxing de forma gradual. O professor Vinícius Oliveira acompanha o desenvolvimento técnico e orienta cada etapa do treino.",
    related: ["kickboxing-joao-pessoa"],
    faq: [
      ["Para qual idade é a turma de Kickboxing Infantil?", "Confirme diretamente com a ECVO a faixa etária atendida e a disponibilidade atual da turma."],
      ["A criança precisa ter experiência?", "Não. A equipe pode orientar responsáveis sobre como a criança pode começar."],
      ["A aula ensina a criança a brigar?", "Não. A proposta trabalha técnica, movimento, disciplina, respeito e convivência dentro de uma prática orientada."],
      ["Quando é a turma infantil?", "A grade atual indica aulas às segundas, quartas e sextas, às 18h. Confirme a disponibilidade antes de ir."],
      ["Quem conduz a turma infantil?", "A turma é conduzida pelo professor Vinícius Oliveira, único professor da ECVO."],
      ["O que a criança deve levar?", "A equipe informa os itens adequados, roupas e equipamentos antes da primeira aula."],
    ],
    firstTraining,
  },
];

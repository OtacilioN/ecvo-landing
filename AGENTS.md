# Diretrizes para agentes — ECVO Landing

## Depoimentos de alunos

- A fonte única dos relatos é `data/testimonials.mjs`. Não edite diretamente os cards gerados em `index.html` nem `depoimentos-alunos/index.html`.
- Ao inserir um novo depoimento, preserve os fatos e a voz do aluno. São permitidos apenas ajustes leves de pontuação, clareza, concisão e adequação ao contexto público; não invente resultados, modalidades, datas ou vínculos.
- Confirme que existe autorização para publicar o nome, o relato e a foto. Otimize a imagem para WebP, remova metadados e use texto alternativo descritivo e sóbrio.
- Todo novo relato deve ser incluído na página completa e também deve provocar uma nova análise da curadoria da homepage.
- A homepage deve manter no máximo três relatos. Avalie: especificidade e prova concreta, capacidade de quebrar objeções, força emocional, clareza em leitura curta, qualidade da imagem e diversidade de motivações/resultados.
- Evite destaques redundantes. Se o novo relato for mais convincente ou cobrir melhor uma motivação já representada, retire da homepage o relato mais fraco ou repetitivo; ele deve continuar na página completa.
- Registre em `featuredReason` por que cada história entra ou não na homepage. Use `featured` e `featuredOrder` para controlar a seleção e a hierarquia.
- Depois de alterar os dados, execute `node scripts/generate-testimonials.mjs` e valide com `node scripts/generate-testimonials.mjs --check`, `node scripts/validate-site.mjs`, `node --check scripts/generate-testimonials.mjs` e `git diff --check`.
- Não publique, faça commit ou push sem autorização explícita do usuário.

## Origem e legado

- A fonte única da página “Como tudo começou” é `data/origin-story.mjs`. Não edite diretamente a chamada gerada em `index.html` nem `historia-ecvo/index.html`.
- Preserve a separação entre a trajetória de Marcelo Petino e o depoimento de Vinicius. Não transforme títulos, graduações ou o número aproximado de lutas em promessa comercial.
- Depois de alterar essa história, execute `node scripts/generate-origin-story.mjs` e `node scripts/generate-origin-story.mjs --check`, além das validações gerais do site.

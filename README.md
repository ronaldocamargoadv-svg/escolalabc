# Escola LaBC de Inovação

Versão funcional demonstrativa da plataforma para gestão de cursos, turmas,
inscrições, frequência, materiais, agenda, certificados, fórum e relatórios do
Laboratório de Inovação de Balneário Camboriú.

## Stack proposta

- Next.js App Router
- React
- TypeScript
- PostgreSQL
- Prisma
- CSS próprio

## Documentação do projeto

A documentação da Escola LaBC foi organizada em `docs/escola-labc`, separando
produto, gestão, técnica, qualidade, segurança e operação.

- [Índice da documentação](docs/escola-labc/README.md)
- [Linguagens e stack](docs/escola-labc/linguagens-e-stack.md)
- [Arquitetura funcional](docs/escola-labc/arquitetura-funcional.md)
- [Segurança e LGPD](docs/escola-labc/seguranca-lgpd.md)
- [Runbook operacional](docs/escola-labc/runbook-operacional.md)

## Design System / Interface

A interface foi redesenhada para posicionar a Escola LaBC como uma plataforma
pública de educação, inovação e governo digital, preservando os fluxos de
autenticação, RBAC, cursos, turmas, inscrições, frequência, fórum, materiais,
certificados e relatórios.

### Identidade Visual da Escola LaBC

- **Arquivo oficial utilizado:** `public/brand/logo-escola-labc-inovacao.png`,
  cópia íntegra da arte fornecida, mantida em proporção quadrada e com
  `object-fit: contain`. A aplicação utiliza a variante otimizada
  `public/brand/logo-escola-labc-inovacao-web.png` para carregamento e geração
  dos certificados, preservando a arte original como referência.
- **Paleta adotada:** azul institucional `#003B7A`, azul profundo `#002B5C`,
  ciano tecnológico `#0087CA`, verde LaBC `#C6D900`, fundo `#F5F8FA`,
  linhas `#D5E1E9` e texto secundário `#5C6670`.
- **Tipografia:** pilha principal `Montserrat, Inter, Avenir Next, system-ui`,
  com títulos fortes, espaçamento neutro e leitura confortável em formulários
  e tabelas.
- **Linguagem gráfica:** pontos conectados, linhas finas e detalhes de cards
  inspirados na rede da marca; as superfícies permanecem claras e sóbrias.
- **Aplicação da logo:** tela de login, menu lateral de todas as personas,
  inscrições públicas, validação pública de certificados e PDF de certificado
  emitido. Assim, dashboards, catálogo, cursos, fóruns e certificados
  autenticados exibem a marca por meio do shell principal.
- **Componentes ajustados:** `BrandLogo`, `PublicBrand`, navegação lateral,
  heroes, botões, cards, badges, indicadores, tabelas, campos e padrões
  responsivos.

Para manter o padrão em novas telas, use exclusivamente os tokens definidos em
`src/app/globals.css`, reutilize `BrandLogo` ou `PublicBrand` e evite criar
cores avulsas, sombras pesadas ou elementos gráficos não derivados da rede
azul/ciano/verde. A microcopy institucional deve priorizar os conceitos
“Do conhecimento à ação”, “Aprender para transformar” e “Conectar para
inovar”.

### Revisão de interface, responsividade e textos

- A linguagem visível das jornadas principais foi revisada em português
  brasileiro, com padronização de termos como `Catálogo`, `Frequência`,
  `Certificação`, `Fórum`, `Usuários` e `Permissões`.
- Botões e links de ação passam a quebrar linha em telas estreitas; cards e
  painéis respeitam a largura disponível.
- Em tablet e celular, o menu lateral é substituído por uma navegação
  recolhível, preservando a marca sem empurrar o conteúdo principal para baixo.
- Os perfis exibidos na interface usam nomes legíveis (`Administrador`,
  `Instrutor` e `Aluno`), enquanto os códigos RBAC permanecem inalterados.
- Tabelas operacionais extensas permanecem roláveis dentro do próprio painel
  em celular, evitando rolagem horizontal de toda a página.
- Na tela de `Frequência`, a tabela de registros ocupa a largura principal e
  o formulário vem em seguida, preservando a leitura das colunas em notebook.
- A hierarquia tipográfica usa tamanhos estáveis por faixa de tela, e a
  navegação mantém foco visível e redução de movimento conforme a preferência
  do usuário.
- Para conferir responsividade, valide as telas de cada perfil em notebook,
  tablet e celular, observando especialmente tabelas de gestão e ações de
  aprendizagem.
- As telas foram verificadas em `1920`, `1440`, `1366`, `1024`, `768`, `430`
  e `390` pixels. Tabelas extensas usam rolagem somente no painel da tabela;
  a página principal não deve apresentar rolagem horizontal.
- A escala tipográfica central usa títulos de página entre `28px` e `32px`,
  títulos de seção entre `18px` e `22px`, texto padrão de `14px` a `16px` e
  badges com `12px`, mantendo legibilidade em celular.
- Os containers principais ficam limitados a `1480px` e campos, botões, cards
  e painéis respeitam a largura disponível.
- A logo existente foi preservada pelos componentes `BrandLogo` e
  `PublicBrand`, com proporção controlada e redução responsiva.
- No login, a marca usa uma área institucional compacta: logo limitada a
  `220px` em desktop, `188px` em tablet e `142px` em celular, sempre com
  proporção preservada e `object-fit: contain`; no tablet, marca e mensagem
  são organizadas lado a lado para evitar espaço vazio excessivo.

### Direção visual

- Paleta institucional com azul profundo, ciano tecnológico, verde LaBC e
  superfícies claras.
- Uso moderado de superfícies translúcidas, sombras suaves, geometria de rede
  e microinterações discretas.
- Layout com destaques institucionais, cards de métricas, linha de jornada,
  filtros no catálogo, badges de status/modalidade e hierarquia visual clara.
- Contraste, foco visível, botões com estados claros e responsividade para
  desktop, tablet e mobile.

### Telas redesenhadas

- `/login`: entrada institucional com marca Escola LaBC de Inovação, mensagem
  de valor, seleção rápida de perfil de demonstração e credenciais visíveis.
- `/`: painel estratégico para administrador e painel operacional para
  instrutor, mantendo escopo de dados por permissão.
- `/minha-area`: experiência de aprendizagem do aluno com jornada, progresso,
  encontros, materiais e certificados.
- `/catalogo`: catálogo moderno com filtros por modalidade, status e carga
  horária, cards de curso e indicador de ocupação.
- `/catalogo/{turmaId}`: página de curso com destaque, dados essenciais, linha
  de aulas, materiais e ação de inscrição/continuidade.
- `/certificados`: tela institucional de emissão, validação e consulta.
- `/forum`: debates organizados como comunidade de prática por turma.

### Componentes e classes visuais

- `hero-surface`: bloco institucional de destaque para telas principais.
- `metric-grid` e `metric`: indicadores estratégicos e operacionais.
- `insight-strip`: atalhos narrativos para jornadas, governança e comunidade.
- `journey-map` e `journey-step`: linha de aprendizagem do aluno.
- `filter-bar`: filtros do catálogo sem alterar APIs existentes.
- `course-facts`: dados essenciais de uma oferta formativa.
- `card-heading-row`: cabeçalhos compactos com título e badge.
- `persona-action-grid` e `persona-action-card`: atalhos essenciais por
  perfil, sem misturar jornada de aluno com gestão institucional.

### Como testar visualmente

1. Acesse `http://localhost:3000/login`.
2. Use os botões de perfil demonstrativo para entrar como Administrador,
   Instrutor ou Aluno.
3. Como Administrador, valide `/`, `/cursos`, `/turmas`, `/certificados`,
   `/usuarios`, `/perfis` e `/auditoria`.
4. Como Instrutor, valide o painel, aulas, frequência, materiais e fórum dentro
   do escopo permitido.
5. Como Aluno, valide `/minha-area`, `/catalogo`, detalhe de curso, inscrição,
   fórum e certificados.
6. Reduza a largura da janela para conferir a responsividade do menu, cards,
   tabelas e filtros.

## Experiência por persona

A navegação principal e os cards de ação são filtrados por RBAC para evitar
excesso de botões e reduzir confusão entre perfis.

### Administrador

Prioriza gestão, controle e auditoria. A tela inicial exibe atalhos para:

- Gerenciar cursos;
- Gerenciar turmas;
- Acompanhamento dos alunos;
- Gerenciar certificados;
- Gerenciar usuários;
- Exportar relatório.

Rotas principais: `/`, `/cursos`, `/turmas`, `/usuarios`, `/perfis`,
`/engajamento`, `/presencas`, `/certificados`, `/forum`, `/configuracoes` e
`/auditoria`.

### Instrutor

Prioriza condução pedagógica dentro das turmas vinculadas ao instrutor. A tela
inicial exibe atalhos para:

- Meus cursos;
- Meus alunos;
- Acompanhar progresso;
- Registrar frequência;
- Publicar material;
- Fórum da turma.

O instrutor não visualiza gestão de usuários, perfis, permissões,
configurações globais ou auditoria institucional. O menu dele fica concentrado
em cursos/turmas vinculados, alunos, progresso, frequência, materiais e fórum.

### Aluno

Prioriza aprendizagem, progresso, participação e certificação. A área
`/minha-area` exibe atalhos para:

- Continuar curso;
- Catálogo de cursos;
- Meu progresso;
- Meus certificados;
- Fórum.

O aluno visualiza apenas a própria jornada, seus cursos, sua frequência, seus
materiais, seus debates e seus certificados. Itens de gestão, configurações,
usuários, perfis e relatórios ficam ocultos no menu e bloqueados por rota.

## Rodando localmente

1. Instale dependências:

```bash
pnpm install
```

2. Copie as variaveis de ambiente:

```bash
cp .env.example .env
```

3. Configure `DATABASE_URL`.

4. Suba o banco local.

Opcao com Docker, se disponível:

```bash
docker compose up -d
```

Opcao sem Docker, usando Postgres.app:

```bash
pnpm db:start
```

5. Aplique o schema no banco:

```bash
pnpm prisma:migrate
```

6. Gere o client Prisma:

```bash
pnpm prisma:generate
```

7. Carregue dados fictícios de demonstração:

```bash
pnpm db:seed
```

O seed recria a massa local de demonstração. Não use esse comando em banco com dados reais.

8. Inicie o servidor:

```bash
pnpm dev
```

Acesse `http://localhost:3000`.

Para validar em modo similar à produção:

```bash
pnpm build
pnpm start
```

## Rotas iniciais

- `/` dashboard inicial
- `/cursos` gestão de cursos
- `/minha-area` área do aluno com inscrições, frequência, materiais e certificados
- `/catalogo` catálogo de turmas disponíveis com autoinscrição
- `/catalogo/{turmaId}` detalhes da oferta, aulas/encontros, materiais e inscrição
- `/inscricao/{turmaId}` cadastro público de aluno por link gerado na turma
- `/perfil` dados da conta e alteração de senha
- `/turmas` gestão de turmas
- `/inscricoes` inscrições em turmas
- `/encontros` agenda de encontros
- `/agenda` agenda pessoal, institucional e de cursos com exportação `.ics`
- `/convites` gestão administrativa de links seguros para cadastro de usuários
- `/cadastro/convite/{token}` cadastro público mediante convite válido
- `/presencas` registro de frequência
- `/engajamento` acompanhamento de progresso, acessos e participação dos alunos
- `/forum` fórum simples por turma
- `/transcricoes` módulo administrativo de transcrição inteligente, restrito a usuários com `audit.view`
- `/certificados` emissão de certificados
- `/materiais` gestão de materiais de apoio vinculados às aulas
- `/auditoria` eventos de auditoria
- `/usuarios` gestão de usuários
- `/perfis` gestão RBAC de perfis e permissões
- `/certificados/validar` validação pública
- `/api/health` health check
- `/api/auth/me` usuário autenticado demonstrativo
- `/api/cursos`, `/api/turmas`, `/api/inscricoes`, `/api/encontros`, `/api/presencas`, `/api/certificados`, `/api/materiais`, `/api/forum`, `/api/minha-area`, `/api/minha-area/inscricoes`, `/api/catalogo`, `/api/catalogo/inscricoes`, `/api/perfil/senha`, `/api/auditoria`, `/api/usuarios`
- `/api/validar-certificado/{código}` API demonstrativa de validação
- `/api/agenda/ics` exportação segura dos eventos visíveis em formato iCalendar
- `/api/transcricoes`, `/api/transcricoes/{id}`, `/api/transcricoes/{id}/export`, `/api/glossario` (restritas a `audit.view`)

## MVP de transcrição inteligente

### Análise da stack atual

O projeto usa Next.js App Router, React, TypeScript, PostgreSQL, Prisma para schema/migrations, CSS próprio, rotas API em `src/app/api`, autenticação por sessão e auditoria em `logs_auditoria`. Por isso, o MVP de transcrição foi implementado dentro da mesma aplicação, com tela autenticada, endpoints REST e persistência no banco.

### Proposta técnica do MVP

- Interface administrativa em `/transcricoes` para upload, histórico, revisão de falantes, revisão de trechos, glossário e exportação, protegida por `audit.view`.
- Upload local de arquivos `.mp3`, `.wav`, `.m4a`, `.mp4` e `.webm` em `.uploads/transcricoes`, servido apenas por rota autenticada e autorizada.
- Estados de processamento: `pendente`, `processando`, `aguardando_revisao`, `revisado`, `aprovado` e `exportado`.
- Serviço abstrato em `src/lib/transcription-service.ts` com implementação mockada. O ponto de extensão para Whisper, OpenAI, AssemblyAI, Deepgram ou outro provedor fica em `getTranscriptionService()`.
- Separação entre texto bruto, texto revisado e texto final.
- Exportação editável em `.docx`, `.md` e `.txt`.
- Logs básicos das ações relevantes por `writeAuditLog`.

### Modelagem básica de dados

- `transcricao_reunioes`: metadados da reunião, status, arquivo original, caminho do áudio, texto bruto, texto revisado e texto final.
- `transcricao_trechos`: blocos temporizados, falante técnico (`falante_1`, `falante_2`), nome atribuído, assunto, texto bruto e texto revisado.
- `transcricao_glossario`: termos cadastrados por categoria (`pessoa`, `empresa`, `orgao`, `sigla`, `termo_tecnico`) e forma preferida.

### Componentes principais

- `TranscricoesClient`: experiência interativa de upload, histórico, player, falantes, trechos, glossário e exportação.
- APIs:
  - `GET/POST /api/transcricoes`
  - `GET/PATCH /api/transcricoes/{id}`
  - `GET /api/transcricoes/{id}/export?format=docx|md|txt`
  - `GET/POST /api/glossario`
- Bibliotecas:
  - `src/lib/transcricoes.ts`: persistência, reconstrução do texto final, aplicação de glossário e alteração de status.
  - `src/lib/transcription-service.ts`: contrato do serviço de transcrição e mock.
  - `src/lib/docx.ts`: geração simples de DOCX editável sem dependência externa.

### Plano de implementação em etapas

1. Criar tabelas e endpoints de upload, processamento e histórico.
2. Implementar mock de transcrição com falantes, trechos temporizados, assuntos e texto revisado.
3. Criar revisão manual de falantes com reaplicação automática por chave de falante.
4. Criar glossário e aplicação contextual sobre trechos revisados.
5. Gerar texto final por subtítulos de assunto, parágrafos e agrupamento de falas consecutivas.
6. Exportar em `.docx`, `.md` e `.txt`.
7. Validar build/lint e roteiro manual de teste.

### Roteiro de teste da transcrição

1. Entrar com `admin@labc.local` / `admin123`, perfil autorizado para auditoria.
2. Abrir `/transcricoes`.
3. Subir um áudio de exemplo em `.mp3`, `.wav`, `.m4a`, `.mp4` ou `.webm`. O conteúdo real do áudio não é usado no MVP; a transcrição é mockada para permitir teste sem dados reais.
4. Visualizar a transcrição bruta no painel `Texto bruto`.
5. Usar `Ouvir trecho` em um falante ou em um bloco de fala.
6. Atribuir um nome a `Falante 1` e clicar em `Aplicar nome`.
7. Atribuir um nome a `Falante 2` e clicar em `Aplicar nome`.
8. Confirmar que os nomes foram reaplicados a todos os blocos correspondentes.
9. Editar um trecho revisado e sair do campo para salvar.
10. Confirmar que o texto final foi reorganizado em parágrafos e agrupou falas consecutivas da mesma pessoa.
11. Cadastrar um termo no glossário, por exemplo `Open IA` -> `OpenAI`.
12. Clicar em `Aplicar glossário` para corrigir termos nos trechos revisados.
13. Clicar em `Aprovar final`.
14. Exportar em `DOCX`, `MD` ou `TXT`.
15. Voltar ao painel `Histórico` e reabrir a reunião processada.

O mock está explicitamente localizado em `src/lib/transcription-service.ts`. Para integrar IA real futuramente, implemente outra classe que cumpra o contrato `TranscriptionService` e substitua o retorno de `getTranscriptionService()`.

Também existe um smoke test por API para repetir o fluxo principal com áudio `.wav` gerado temporariamente:

```bash
pnpm test:transcricoes
```

Execute esse comando com o servidor local já iniciado em `pnpm dev`. Para apontar para outra URL ou usuário, use `APP_URL`, `TEST_EMAIL` e `TEST_PASSWORD`.

## Usuários de teste

- Administrador: `admin@labc.local` / `admin123`
- Gestor: `gestor@labc.local` / `gestor123`
- Instrutor: `instrutor@labc.local` / `instrutor123`
- Aluno: `aluno@labc.local` / `aluno123`
- Aluna/servidora: `servidora@labc.local` / `aluno123`
- Alunos extras: `aluno02@labc.local` ate `aluno10@labc.local` / `aluno123`

As mesmas credenciais aparecem na tela `/login` para facilitar a avaliação local do MVP. Essas senhas são apenas para demonstração local; em produção, políticas de senha forte e MFA devem ser obrigatórias.

## Massa de demonstração

O seed cria somente dados fictícios:

- cursos publicados: Design de Serviços Públicos, Dados para Gestão Municipal e Facilitação de Oficinas de Inovação;
- curso em preparação: Compras Públicas Inovadoras;
- turmas on-line, presenciais e híbridas;
- uma turma encerrada com frequência integral e certificado emitido;
- inscrições em andamento e concluídas;
- materiais de apoio vinculados às aulas, incluindo publicados, rascunho e oculto;
- encontros/aulas com status `previsto` e `realizado`;
- eventos da Agenda: aula futura, evento institucional, prazo de turma,
  compromisso pessoal privado e evento cancelado;
- configuração de Agenda desativada para administrador, `.ics` para aluno e
  Google Calendar explicitamente simulado para instrutor;
- fórum com tópico e comentário;
- registros de auditoria e relatórios básicos.
- matriz RBAC com perfis de sistema e perfis personalizados iniciais: coordenador de curso, moderador de fórum, gestor de certificados, apoio administrativo e avaliador.

## Acompanhamento de engajamento

O acompanhamento pedagógico registra eventos de aprendizagem e consolida o
progresso por inscrição/turma. A estrutura foi criada para migrar com segurança
para regras mais sofisticadas de certificação.

### Modelo criado

- `progresso_cursos`: status do aluno no curso, primeiro/último acesso,
  percentual de progresso, aulas acessadas e aulas concluídas.
- `acessos_aulas`: primeira abertura da aula, último acesso, quantidade de
  acessos e conclusão.
- `eventos_aprendizagem`: linha do tempo com `course_opened`,
  `course_started`, `lesson_opened`, `lesson_completed`, `material_opened` e
  `forum_posted`.

### Permissões de engajamento

- Administrador: `progress.view_all`, `progress.export`,
  `learning_events.view` e `learning_events.manage`.
- Instrutor: `progress.view_courses_managed` e
  `learning_events.view`, limitado às turmas em que está vinculado.
- Aluno: `progress.view_own`, limitado ao próprio progresso.

### Roteiro de teste

Como Administrador:

1. Entrar com `admin@labc.local` / `admin123`.
2. Abrir `/engajamento`.
3. Filtrar por curso, turma, aluno ou status.
4. Conferir alunos não iniciados, em andamento, concluídos e sem acesso recente.
5. Clicar em `Ver detalhes` para abrir aulas acessadas, eventos e pendências.
6. Quando houver curso concluído sem certificado, abrir `/certificados` e usar
   `Aprovar e emitir certificado`; a inscrição vira apta e o certificado é
   emitido automaticamente.

Como Instrutor:

1. Entrar com `instrutor@labc.local` / `instrutor123`.
2. Abrir `/engajamento` pelo menu `Acompanhamento dos alunos`.
3. Confirmar que aparecem apenas turmas vinculadas ao instrutor.
4. Abrir o detalhe de um aluno e conferir acessos, conclusões e linha do tempo.

Como Aluno:

1. Entrar com `aluno@labc.local` / `aluno123`.
2. Abrir `/minha-area` e clicar em `Iniciar curso`.
3. Abrir uma aula por `Abrir aula`; o acesso é registrado automaticamente.
4. Clicar em `Marcar aula como concluída`.
5. Voltar para `/minha-area` e confirmar a atualização do progresso.
6. Sair e entrar novamente para confirmar persistência no banco local.

O seed inclui cenários demonstrativos: aluno ainda não iniciado, aluno com uma
aula acessada, aluno com 50% de progresso, aluno concluído e aluno sem acesso
nos últimos 7 dias.

Conclusões com progresso `100%` e sem certificado aparecem como alerta para
perfis com `certificates.issue` no painel inicial e em `/certificados`. A
aprovação administrativa gera auditoria e emite o certificado automaticamente
em nome do aluno.

## Agenda

O módulo `/agenda` organiza compromissos pessoais e obrigações formativas sem
expor informações privadas. Eventos pessoais são privados por padrão; aulas
cadastradas em `encontros` aparecem automaticamente somente para a
administração autorizada, o instrutor vinculado e alunos inscritos na turma.
Alterar ou cancelar um encontro reflete imediatamente na Agenda, sem cópia
desatualizada de dados.

### Modelo e permissões

- `eventos_agenda`: compromissos pessoais, eventos de turma e eventos
  institucionais criados na Agenda.
- `configuracoes_integracao_agenda`: opção individual de integração, provedor
  escolhido e preferências preparadas para sincronização futura.
- Aulas agendadas são projetadas de `encontros` como eventos automáticos,
  somente leitura para o aluno.
- Permissões adicionadas: `calendar.view_own`, `calendar.create_own`,
  `calendar.edit_own`, `calendar.delete_own`, `calendar.view_course`,
  `calendar.view_class`, `calendar.create_class_event`,
  `calendar.edit_class_event`, `calendar.view_institutional`,
  `calendar.create_institutional`, `calendar.edit_institutional`,
  `calendar.delete_institutional`, `calendar.export`,
  `calendar.integration_configure`, `calendar.integration_enable` e
  `calendar.integration_disable`.

### Integração externa

- A exportação `.ics` é funcional por `/api/agenda/ics` e contém apenas
  eventos visíveis ao usuário autenticado.
- Apple Calendar e outros calendários compatíveis podem importar o arquivo
  `.ics`.
- Google Calendar e Outlook/Microsoft 365 aparecem como preparação simulada
  no MVP. Não há OAuth configurado, tokens armazenados nem envio de dados a
  provedores externos.
- A integração é opcional e pode ser desativada na própria tela. Variáveis
  futuras estão documentadas em `.env.example`, sem chaves reais.
- O download `.ics` é iniciado manualmente pelos botões de exportação e
  respeita os filtros visíveis; as preferências de sincronização não executam
  envio automático no MVP.

### Roteiro de teste da Agenda

Como Administrador:

1. Entrar com `admin@labc.local` / `admin123` e abrir `/agenda`.
2. Visualizar `Agenda Institucional`, aulas e eventos institucionais.
3. Criar um evento com visibilidade `Institucional`.
4. Filtrar por turma ou mês e exportar a agenda em `.ics`.
5. Salvar a própria configuração de integração e confirmar que compromissos
   pessoais de outros usuários não são exibidos.

Como Instrutor:

1. Entrar com `instrutor@labc.local` / `instrutor123` e abrir `Minha Agenda`.
2. Conferir aulas e o prazo somente das turmas vinculadas.
3. Criar compromisso privado ou evento para uma turma sob responsabilidade.
4. Exportar um evento em `.ics`.
5. Conferir o aviso de que Google Calendar está simulado e não envia dados.

Como Aluno:

1. Entrar com `aluno@labc.local` / `aluno123` e abrir `Minha Agenda`.
2. Conferir a aula automática da turma inscrita e o compromisso privado.
3. Criar, editar e excluir um compromisso pessoal com lembrete.
4. Verificar que uma aula automática não oferece ação de edição.
5. Exportar a agenda em `.ics` e configurar a opção de exportação.
6. Confirmar que eventos pessoais de terceiros não aparecem.

## RBAC e permissões

A plataforma usa RBAC com usuários vinculados a um ou mais perfis. Cada perfil possui permissões objetivas, como `users.view`, `roles.create`, `permissions.manage`, `courses.publish`, `attendance.manage`, `certificates.issue`, `forums.moderate`, `reports.export` e `audit.view`.

- Administrador: possui todas as permissões.
- Instrutor: acessa cursos/turmas vinculados, aulas, materiais, frequência, fórum e relatórios simples do seu escopo.
- Aluno: acessa catálogo, própria área, aulas/conteúdos das inscrições, própria frequência, fórum das turmas e seus certificados.

As permissões são verificadas no menu, nas telas, nas Server Actions e nas APIs. Usuário sem permissão recebe redirecionamento ou resposta `403` com mensagem amigável; o simples acesso direto à rota não libera a operação.

## Links de Cadastro

O módulo `/convites` permite que o Administrador gere convites para cadastro
de `Aluno`, `Instrutor` ou `Administrador`. O usuário convidado abre
`/cadastro/convite/{token}`, informa seus dados básicos e escolhe sua própria
senha; o perfil é atribuído pelo convite no servidor e não é editável no
formulário público.

### Segurança e modelo de dados

- `convites_cadastro` guarda perfil, validade, limites, revogação e uma cópia
  cifrada do token; a validação pública usa somente o hash SHA-256 do token.
- `usos_convites_cadastro` registra o usuário criado, data, IP e agente do
  navegador quando disponíveis.
- Tokens são gerados com aleatoriedade criptográfica, podem expirar ou ser
  revogados e respeitam o limite de usos dentro de transação no banco.
- Convites para `Administrador` exigem `invite.create_admin`, confirmação
  explícita, uso único e validade máxima de 24 horas.
- A criação comum em `/usuarios` e `/api/usuarios` não oferece nem aceita o
  perfil `Administrador`; novos administradores devem passar pelo convite
  administrativo válido.
- A senha do convidado exige ao menos oito caracteres, uma letra e um número e
  é persistida somente como hash `bcrypt`.
- Ações sensíveis são registradas em auditoria: criação, criação
  administrativa, revogação, uso, tentativa bloqueada e criação de usuário.

Permissões do módulo: `invite.view`, `invite.create_student`,
`invite.create_instructor`, `invite.create_admin`, `invite.revoke` e
`invite.manage`. O Administrador possui todas; o Gestor LaBC possui somente
visualização e criação de links para aluno/instrutor; Instrutor e Aluno não
acessam o módulo por padrão.

O seed prepara convites ativos para os três perfis e casos de link expirado,
revogado, usado, múltiplo com saldo e múltiplo com limite atingido. Como os
tokens são protegidos, copie os links ativos diretamente da tela `/convites`.

### Roteiro de teste de convites

1. Entre como `admin@labc.local` / `admin123` e abra `Links de Cadastro`.
2. Gere um link de `Aluno`, copie o link e abra-o em janela anônima.
3. Cadastre um novo aluno com senha que contenha letra e número; confirme que
   a área do aluno é aberta e que o uso aparece no convite.
4. Repita a validação para `Instrutor`; o novo usuário deve abrir o painel de
   instrutor.
5. Selecione `Administrador`, marque a confirmação de risco e gere o convite;
   verifique que ele é forçado a uso único e validade de no máximo 24 horas.
6. Revogue um link ativo e confirme, em janela anônima, a mensagem
   `Este link foi revogado.`
7. Abra os casos semeados expirado e já utilizado para confirmar os bloqueios.
8. Entre como Instrutor ou Aluno e acesse `/convites` diretamente; o sistema
   deve apresentar a tela de permissão insuficiente.

## Currículo Lattes

O perfil do usuário possui o campo opcional `Link do Currículo Lattes`. O MVP
aceita somente links públicos oficiais no formato
`https://lattes.cnpq.br/0000000000000000` ou a variante `http://`, que é
normalizada para HTTPS ao salvar. Texto arbitrário, scripts, parâmetros,
fragmentos ou domínios diferentes são rejeitados.

### Onde aparece

- Em `/perfil`, cada usuário pode cadastrar ou remover seu próprio link na
  seção `Dados acadêmicos e profissionais` e abrir o currículo em nova aba.
- Em `/usuarios`, o Administrador com `users.edit` pode editar o Lattes de um
  usuário; a tabela exibe somente `Ver Lattes` ou `Não informado`, sem URLs
  extensas que prejudiquem o layout.
- Em `/cadastro/convite/{token}`, o convidado pode informar o Lattes
  opcionalmente; para o perfil Instrutor o formulário indica que esse dado é
  recomendado.
- Em `/catalogo/{turmaId}` e no ambiente da turma do aluno, o botão
  `Currículo Lattes` é exibido quando o instrutor responsável o informou.

O seed registra `instrutor@labc.local` com o Lattes
`https://lattes.cnpq.br/1234567890123456` e mantém
`instrutora@labc.local` sem link para validar o estado vazio.

### Roteiro de teste do Lattes

1. Entre como `instrutor@labc.local` / `instrutor123`, abra `Meu perfil`,
   altere o link e confirme a mensagem de sucesso e o botão
   `Abrir Currículo Lattes`.
2. Informe `https://exemplo.com/perfil` e confirme a mensagem de validação da
   Plataforma Lattes.
3. Entre como `admin@labc.local` / `admin123`, abra `Usuários`, expanda
   `Editar Lattes` e salve o link de um usuário.
4. Entre como `aluno@labc.local` / `aluno123`, abra uma oferta/turma cujo
   instrutor seja `Instrutor LaBC` e confirme o botão `Currículo Lattes`.
5. Gere um link em `/convites`, abra a página pública e confirme o campo
   opcional `Link do Currículo Lattes`.

## Vínculos de Instrutoria por Turma

O perfil `Instrutor` identifica a capacidade da pessoa na plataforma, mas não
concede atuação permanente. A autorização operacional é determinada por um
`VinculoInstrutoria` associado a uma turma e a um período:

- `agendado`: turma futura ou ainda não publicada;
- `ativo`: turma publicada dentro do período de atuação;
- `concluido`: encerrado quando a turma é concluída;
- `cancelado`, `expirado` ou `removido`: vínculos sem atuação, preservados
  apenas para histórico e auditoria.

A gestão é feita em `Turmas > Vínculos de Instrutores`. Vincular um usuário
ativo cria o vínculo específico e atribui a capacidade de Instrutor quando
necessário. Ao encerrar ou cancelar a turma, vínculos abertos são encerrados
sem excluir o usuário, materiais, registros de frequência ou debates.

O cadastro administrativo e os convites com perfil `Instrutor` exigem a
seleção de uma turma. O convite público informa a turma antes da criação da
conta. Materiais, aulas, frequência, progresso, agenda e fórum verificam o
vínculo ativo na camada de serviço, além dos controles visuais.

### Dados de demonstração da instrutoria

- `instrutor@labc.local` / `instrutor123`: possui uma turma ativa e uma
  instrutoria agendada.
- `instrutora@labc.local` / `instrutor123`: possui apenas histórico de turma
  concluída e deve ver a mensagem de ausência de turma ativa.
- A massa de demonstração inclui registro de encerramento automático na
  auditoria.

### Roteiro de teste de instrutoria

Como Administrador:

1. Entre como `admin@labc.local` / `admin123` e abra `Turmas`.
2. Na tabela, escolha um usuário e use `Vincular`; confirme o registro em
   `Vínculos de Instrutores`.
3. Abra `Usuários`, selecione o perfil `Instrutor` no cadastro sem escolher
   turma e confirme o bloqueio.
4. Cadastre um Instrutor com turma selecionada e confirme o vínculo criado.
5. Em `Links de Cadastro`, selecione `Instrutor`: sem turma o convite é
   bloqueado; com turma, o link identifica o vínculo.
6. Encerre uma turma vinculada e confirme que o status do vínculo passa para
   `Concluído` e permanece no histórico.
7. Abra `Logs e auditoria` e verifique criação, encerramento ou tentativa
   negada sem vínculo ativo.

Como Instrutor com turma ativa:

1. Entre como `instrutor@labc.local` / `instrutor123`.
2. Valide o painel e `Minhas turmas como Instrutor`.
3. Acesse aulas, materiais, frequência e acompanhamento somente da turma
   ativa.

Como Instrutor sem turma ativa:

1. Entre como `instrutora@labc.local` / `instrutor123`.
2. Confirme a mensagem `Nenhuma turma ativa vinculada`.
3. Abra o histórico e confirme que a turma concluída está disponível apenas
   para consulta, sem ações de atuação.

## Materiais de apoio por aula

Os materiais passam a ser vinculados a uma aula (`Encontro`) de uma turma. O
registro armazena título, descrição, tipo, link seguro, ordem, situação de
publicação, autoria e trilha de atualização. Nesta fase do MVP, o conteúdo é
cadastrado por URL `http` ou `https`; upload direto de arquivos permanece
planejado para uma etapa com antivírus, armazenamento privado e controle de
download.

Situações disponíveis:

- `Rascunho`: visível apenas à gestão e ao Instrutor responsável;
- `Publicado`: visível ao aluno inscrito na turma;
- `Oculto`: preservado para gestão e Instrutor, sem exibição ao aluno.

Permissões específicas:

- Administrador: `materials.manage_all`;
- Instrutor: `materials.view_own_class`, `materials.create_own_class`,
  `materials.edit_own_class`, `materials.delete_own_class` e
  `materials.publish_own_class`, sempre limitadas à turma com vínculo ativo;
- Aluno: `materials.view`, limitado a materiais publicados de suas turmas.

Ao acessar um material publicado, o aluno gera o evento pedagógico
`material_opened`, associado à aula. Materiais excluídos são ocultados
logicamente para preservar auditoria.

### Roteiro de teste de materiais

Como Administrador:

1. Entre como `admin@labc.local` / `admin123` e abra `Materiais`.
2. Selecione uma aula, adicione um material e publique-o.
3. Edite a descrição ou situação, oculte e exclua um item.
4. Abra `Logs e auditoria` e verifique os eventos do material.

Como Instrutor com turma ativa:

1. Entre como `instrutor@labc.local` / `instrutor123`.
2. Abra `Minhas turmas como Instrutor` e acesse `Materiais`.
3. Selecione aula da turma ativa, salve um item como rascunho e depois publique.
4. Confirme que somente aulas com vínculo ativo estão disponíveis no formulário.

Como Instrutor com turma concluída:

1. Entre como `instrutora@labc.local` / `instrutor123` e abra o histórico.
2. Confirme que materiais publicados permanecem consultáveis sem controles de edição.

Como Aluno:

1. Entre como `aluno@labc.local` / `aluno123` e abra um curso inscrito.
2. Abra a aula e consulte `Materiais de apoio`.
3. Confirme que aparecem os materiais publicados, mas não rascunhos nem itens ocultos.
4. Use `Acessar material`; o redirecionamento registra automaticamente o
   evento no acompanhamento pedagógico.

## Fluxos para validar

### Fluxo do aluno

1. Entrar com `aluno@labc.local` / `aluno123`.
2. Abrir `/catalogo` e visualizar cursos disponíveis.
3. Entrar em uma oferta por `Ver detalhes`.
4. Inscrever-se em uma turma com vaga.
5. Abrir `/minha-area` para consultar progresso, encontros/aulas e materiais.
6. Abrir o fórum da turma por `/forum` ou pelo botão da inscrição.
7. Consultar o certificado já emitido da turma encerrada e baixar o PDF.
8. Validar o código `LABC-2026-A1B2C3D4` em `/certificados/validar`.

### Fluxo do administrador

1. Entrar com `admin@labc.local` / `admin123`.
2. Usar `/cursos` para criar/publicar/arquivar cursos.
3. Usar `/turmas` para criar turmas, vincular instrutor e mudar status.
4. Em `/turmas`, usar `Abrir inscrição` ou `Copiar link` para gerar o link público de cadastro e inscrição de alunos.
5. Usar `/perfis` para criar um perfil personalizado, marcar permissões e salvar a matriz.
6. Usar `/usuarios` para cadastrar/editar usuário e vincular um ou mais perfis.
7. Usar `/encontros` para cadastrar aulas/encontros.
8. Usar `/inscricoes` para consultar inscritos e reativar/cancelar inscrições.
9. Usar `/presencas` para registrar frequência.
10. Usar `/certificados` para emitir, cancelar ou reemitir certificados.
11. Usar `/auditoria` e os CSVs do dashboard para relatórios básicos.
12. Usar `/convites` para gerar, copiar e revogar links de cadastro.
13. Confirmar o bloqueio: entre como aluno e tente abrir `/usuarios`, `/perfis` ou `/convites`; a aplicação direciona para aviso de permissão.

### Fluxo do instrutor

1. Entrar com `instrutor@labc.local` / `instrutor123`.
2. Abrir o dashboard para ver apenas turmas sob sua responsabilidade.
3. Usar `/encontros` para consultar/cadastrar encontros das suas turmas.
4. Usar `/presencas` para acompanhar alunos e registrar frequência.
5. Usar `/materiais` para adicionar e publicar material em aulas de turma com vínculo ativo.
6. Usar `/forum` para postar mensagens e acompanhar debates.
7. Confirmar o bloqueio: tente abrir `/turmas` e `/perfis`; o instrutor não acessa gestão administrativa de turmas, perfis e permissões.

## O que ainda está simplificado no MVP

- Links de aulas e materiais apontam para URLs fictícias `https://labc.local/...`.
- Não há envio de e-mail nem integrações externas.
- Não há pagamento.
- Certificados são gerados localmente em PDF usando o modelo institucional
  `public/certificados/modelo-certificado-escola-labc.pdf`, com nome do aluno,
  curso, carga horária, modalidade, código de validação e QR Code preenchidos
  dinamicamente.
- Links públicos de inscrição ficam em `/inscricao/{turmaId}` e criam uma conta de aluno com senha definida pelo próprio aluno.
- Links de cadastro em `/cadastro/convite/{token}` criam contas com perfil
  controlado por convite; não enviam e-mail automaticamente nesta etapa.
- O controle de presença e a liberação de certificado usam regras locais no banco PostgreSQL.

As APIs internas exigem sessão autenticada e permissão RBAC específica. Operações administrativas de usuários exigem `users.*`; perfis exigem `roles.*` e `permissions.manage`; auditoria exige `audit.view`; operações educacionais usam permissões como `courses.*`, `classes.*`, `enrollments.*`, `attendance.*`, `certificates.*`, `forums.*` e `reports.*`.

A validação pública de certificados aceita somente códigos no formato `LABC-AAAA-XXXXXXXX` e limita requisições sequenciais para reduzir enumeração automatizada.

Auditoria pode ser consultada em JSON por `/api/auditoria` ou exportada em CSV por `/api/relatorios/auditoria.csv`. Ambos aceitam filtros opcionais `acao`, `entidade`, `usuarioId`, `dataInicio` e `dataFim`; a API JSON também aceita `limit` de 1 a 500.

As listagens `/api/certificados` e `/api/inscricoes` respeitam o escopo do usuário: a administração vê tudo, instrutores veem turmas vinculadas e alunos consultam seus próprios dados por `/api/minha-area`.

A gestão de materiais em `/materiais` e `/api/materiais` exige permissões
`materials.*`. Instrutores visualizam o histórico de suas turmas, mas só
criam, editam, publicam ou excluem materiais em aulas de turmas com vínculo
ativo. Administradores usam `materials.manage_all`.

Materiais novos são associados a uma aula específica. Alunos visualizam
somente itens `publicado` das turmas em que estão inscritos; `rascunho`,
`oculto` e itens excluídos não são expostos. Links são validados para aceitar
apenas `http` ou `https` e abrem com proteção contra acesso ao contexto da
janela de origem.

O fórum simples em `/forum` e `/api/forum` fica disponível para alunos inscritos em turmas publicadas, instrutores vinculados à turma e perfis de administração/moderação. Usuários com `forums.post` podem criar tópicos e comentários; usuários com `forums.moderate` podem ocultar ou republicar conteúdos.

As telas/APIs administrativas de cursos e turmas exigem permissões institucionais como `courses.publish` ou `enrollments.manage`. Encontros e frequência exigem `classes.*` e `attendance.*`, mantendo escopo por turma para instrutores.

Em encontros e frequência, perfis institucionais visualizam todas as turmas; instrutores visualizam e operam apenas turmas em que estejam vinculados como instrutor; alunos visualizam somente a própria frequência.

Encontros podem ser marcados como `previsto`, `realizado` ou `cancelado` pela tela `/encontros` ou por `PATCH /api/encontros`. Encontros cancelados bloqueiam novos registros de presença.

Novos encontros exigem horário final posterior ao horário inicial e não podem sobrepor outro encontro ativo da mesma turma no mesmo dia. Conflitos de agenda retornam `MEETING_SCHEDULE_CONFLICT`.

O cancelamento de encontro é bloqueado quando a turma possui certificado válido, evitando recálculo retroativo de frequência que invalide certificados já emitidos. Nesses casos, a API retorna `VALID_CERTIFICATES_EXIST`.

Pelo mesmo motivo, turmas com certificado válido também não aceitam novos encontros. Alterações de agenda depois da certificação devem ser tratadas com cancelamento/reemissão explícita de certificados.

O dashboard operacional `/` e `/api/relatorios/dashboard` exige `reports.view`; alunos são direcionados para `/minha-area`.

No dashboard, perfis com `reports.export` visualizam indicadores institucionais; instrutores visualizam apenas cursos, turmas, inscrições, frequência e certificados relacionados às turmas em que estejam vinculados.

Administradores podem ativar e inativar usuários pela tela `/usuarios` ou por `PATCH /api/usuarios`. Usuários inativos não conseguem autenticar, e o sistema impede que um administrador inative a própria conta autenticada ou o último Administrador ativo. Também não é permitido remover o próprio perfil Administrador nem remover esse perfil do último Administrador ativo.

Criação de usuários valida perfil existente e bloqueia duplicidade de e-mail ou CPF com respostas `EMAIL_ALREADY_EXISTS` e `CPF_ALREADY_EXISTS`.

O cadastro normaliza e-mails para minúsculas e CPFs para 11 dígitos numéricos antes de validar duplicidade.

O login também normaliza e-mail, aceitando maiúsculas/minúsculas e espaços acidentais.

Tentativas de login passam por limite de 5 tentativas por janela de 15 minutos, tanto pela API quanto pelo formulário.

Troca de senha pelo perfil retorna erros específicos para senha atual inválida (`CURRENT_PASSWORD_INVALID`) e reutilização da mesma senha (`PASSWORD_REUSE_NOT_ALLOWED`).

Usuários criados e senhas redefinidas por administradores recebem senha temporária aleatória, retornada apenas no momento da operação pela API administrativa. A redefinição fica registrada em auditoria com dados sensíveis mascarados.

As respostas de `/api/usuarios` não retornam CPF em claro; quando necessário, expõem apenas `cpfMascarado`. APIs recebem `Cache-Control: no-store` e a aplicação envia cabeçalhos de segurança contra clickjacking, sniffing de conteúdo e permissões de dispositivo indevidas.

Os endpoints de mutação aceitam somente `application/json`, rejeitam JSON inválido, limitam o tamanho do corpo da requisição e aplicam validações de tamanho/formato nos principais campos textuais. Tokens de sessão possuem expiração, assinatura HMAC, limite de tamanho e validação de estrutura antes de qualquer leitura do payload.

O cadastro público por link de inscrição cria usuário, perfil e inscrição na mesma transação. Se a turma estiver indisponível, sem vagas ou a inscrição falhar, a conta não fica criada parcialmente.

A validação pública de certificados não expõe nome completo do aluno; exibe apenas o primeiro nome e iniciais dos demais nomes para reduzir vazamento de dados pessoais em consultas públicas.

Certificados emitidos podem ser cancelados pela tela `/certificados` ou por `PATCH /api/certificados` informando motivo. A validação pública passa a exibir `cancelado`, data e motivo do cancelamento.

PDFs de certificados cancelados exibem uma marcação de `CANCELADO`, incluem data/motivo do cancelamento e usam sufixo `-cancelado` no nome do arquivo.

O download de PDF por `/api/certificados/[id]/pdf` exige autenticação: perfis com emissão/cancelamento de certificado podem baixar certificados administrativos, enquanto alunos acessam apenas certificados vinculados ao próprio usuário.

Certificados cancelados podem ser reemitidos para inscrições ainda aptas. A reemissão gera novo código de validação, limpa os campos de cancelamento e registra `certificado.reemitido` em auditoria.

Certificados não podem ser emitidos para inscrições canceladas, mesmo quando chamados diretamente por API. A API retorna `ENROLLMENT_CANCELED`.

Gestores e administradores podem exportar o resumo executivo em CSV por `/api/relatorios/executivo.csv` ou pelo botão "Exportar CSV" no dashboard.

Perfis com `reports.export` podem exportar frequência em CSV por `/api/relatorios/presencas.csv`, com filtro opcional `?turmaId=...`, ou pelos botões da tela `/presencas`. Para usuários sem escopo institucional, a exportação deve ser concedida explicitamente por perfil personalizado.

Registros de presença validam a integridade entre inscrição e encontro: inscrições canceladas, encontros cancelados ou pares de turmas diferentes são bloqueados antes de recalcular frequência.

Encontros só podem ser criados para turmas `publicada` de cursos `publicado`; tentativas em turma rascunho/cancelada/encerrada retornam `CLASS_UNAVAILABLE`.

Usuários com `audit.view` podem exportar a auditoria por `/api/relatorios/auditoria.csv` ou pelo botão da tela `/auditoria`.

Gestores e administradores podem consultar inscrições por `/api/inscricoes` e exportar por `/api/relatorios/inscricoes.csv` ou pelo botão da tela `/inscricoes`. Ambos aceitam `?status=ativo`, `?status=cancelado` ou `?status=todos`.

Inscrições administrativas e autoinscrições usam a mesma regra transacional de vagas, com bloqueio da turma durante a verificação de capacidade. Repetir uma inscrição já ativa retorna a inscrição existente; reativar inscrição cancelada ainda respeita vagas disponíveis.

Gestores e administradores podem cancelar ou reativar inscrições pela tela `/inscricoes` ou por `PATCH /api/inscricoes`. Cancelamentos bloqueiam inscrições com certificado válido; reativações validam usuário ativo, curso publicado, turma publicada e vagas disponíveis.

Cursos podem ser movidos entre `rascunho`, `publicado` e `arquivado` pela tela `/cursos` ou por `PATCH /api/cursos`, com registro em auditoria.

Cursos com certificado válido em qualquer turma não podem voltar para `rascunho` nem ser `arquivado`; o sistema retorna `VALID_CERTIFICATES_EXIST`.

Turmas só podem ser criadas para cursos com status `publicado`; tentativas via API para cursos em `rascunho` ou `arquivado` retornam `COURSE_UNAVAILABLE`.

Turmas também só podem ser publicadas quando o curso vinculado está `publicado`. O catálogo e a autoinscrição filtram simultaneamente turma `publicada` e curso `publicado`.

Gestores e administradores podem vincular ou remover um usuário ativo como Instrutor de uma turma pela tela `/turmas` ou por `PATCH /api/turmas` usando `instrutorId`. O vínculo cria a capacidade de Instrutor, mas a atuação só é autorizada enquanto houver vínculo ativo com a turma correspondente.

Turmas com certificado válido também bloqueiam alteração ou remoção de instrutor, preservando o histórico operacional da oferta certificada.

Turmas com certificado válido não podem voltar para `rascunho` nem ser `cancelada`; o sistema retorna `VALID_CERTIFICATES_EXIST`. O status `encerrada` permanece permitido para fechamento regular da oferta.

Links on-line informados em turmas, encontros e Agenda são aceitos apenas quando usam os protocolos `http://` ou `https://`, com verificação também na camada de serviço. Links de materiais e do Currículo Lattes seguem validação própria equivalente.

## Auditoria Pré-Apresentação - 27/05/2026

A auditoria técnica prévia à demonstração revisou autenticação, RBAC, convites, instrutoria por turma, materiais, certificados, Agenda, fórum, Currículo Lattes, rotas administrativas, identidade visual e responsividade.

### Correções aplicadas

- proteção transacional contra inativação ou retirada do perfil do último Administrador ativo;
- bloqueio explícito do módulo de transcrições e de seu glossário para Alunos e Instrutores sem `audit.view`;
- validação de links externos de turmas, encontros e Agenda limitada a `http` e `https`, inclusive no serviço;
- retorno visível e pontual de credenciais temporárias ao Administrador ao criar usuário ou redefinir senha pela interface;
- alinhamento do atalho `Publicar material` à permissão específica de materiais;
- correções de acentuação em mensagens de certificado, vagas, autenticação, validação e auditoria de perfis;
- atualização forçada de `postcss` para `8.5.10`, removendo vulnerabilidade moderada reportada em dependência transitiva.

### Roteiro seguro para demonstração

1. Entrar como Administrador e mostrar dashboard, cursos, turmas, vínculo de Instrutor, acompanhamento, certificados, Agenda, convites e auditoria.
2. Entrar como Instrutor e mostrar turma vinculada, aulas, materiais, frequência, acompanhamento e fórum.
3. Entrar como Aluno e mostrar catálogo, continuar curso, material publicado, progresso, certificado, fórum e Minha Agenda.
4. Para evidenciar segurança, tentar abrir `/usuarios`, `/perfis` ou `/convites` com o perfil Aluno e observar o bloqueio amigável.
5. Apresentar transcrições somente no contexto administrativo, pois o conteúdo pode conter informação institucional sensível.

### Verificações executadas

- `pnpm lint`;
- `pnpm build`;
- `pnpm audit --audit-level=moderate`;
- testes controlados por API para login, logout, permissões, transcrições, materiais, certificado, fórum, Agenda e rejeição de link inseguro;
- auditoria visual automatizada das rotas centrais nas larguras `1920`, `1440`, `1366`, `1024`, `768`, `430` e `390` pixels.

O relatório detalhado está em [AUDIT_REPORT.md](AUDIT_REPORT.md).

## Auditoria Máxima de Segurança - 31/05/2026

Foi realizada uma nova rodada crítica pré-testes com usuários, cobrindo autenticação, autorização, RBAC, APIs administrativas, certificados, uploads, dados pessoais, convites, materiais, fórum, Agenda e validações de entrada.

Correções aplicadas nesta rodada:

- login com rate limit por IP e por e-mail, reduzindo bypass por alteração de `X-Forwarded-For`;
- schemas críticos de API com `.strict()`, rejeitando campos extras em payloads administrativos;
- upload de transcrição com bloqueio por `Content-Length` antes do parse de `multipart/form-data`;
- sanitização reforçada do nome de arquivo servido em áudio privado;
- correção textual de mensagem de payload grande;
- criação do teste automatizado `pnpm test:security`.

Teste de segurança automatizado:

```bash
pnpm test:security
```

Esse teste valida login dos três perfis, bloqueio de APIs administrativas para Aluno/Instrutor, rejeição de payload com campo extra, bloqueio de emissão indevida de certificado, bloqueio de download de certificado de terceiro e rate limit contra brute force lógico.

Resultado da rodada:

- `pnpm lint`: aprovado;
- `pnpm build`: aprovado;
- `pnpm audit --audit-level=moderate`: sem vulnerabilidades conhecidas;
- `pnpm test:security`: aprovado.

Conclusão: a solução está apta para testes controlados com usuários como MVP/homologação. Para produção real, ainda são necessários MFA, política formal de senhas, sessões revogáveis, hardening de upload com storage gerenciado, revisão LGPD formal, remoção de credenciais demonstrativas e operação segura com backup/monitoramento.

## Avaliações e Certificação

O módulo `/avaliacoes` consolida a avaliação da turma, a avaliação do aluno pelo Instrutor, questionários objetivos e requisitos de certificação em uma única lógica de conclusão.

Diagnóstico técnico reaproveitado:

- usuários, perfis e permissões continuam em `usuarios`, `perfis`, `permissoes` e `usuario_perfis`;
- cursos, turmas e aulas continuam em `cursos`, `turmas` e `encontros`;
- frequência continua em `presencas` e `inscricoes.percentual_frequencia`;
- progresso continua em `progresso_cursos`, `acessos_aulas` e `eventos_aprendizagem`;
- certificados continuam em `certificados`, com emissão por `src/lib/certificates.ts`;
- vínculos de Instrutor por turma continuam em `vinculos_instrutoria`;
- a elegibilidade de certificado agora é calculada por `src/lib/evaluations.ts`, evitando regras paralelas.

Novas estruturas:

- `requisitos_certificacao`: configura frequência mínima, progresso mínimo, avaliação da turma, questionário, avaliação do Instrutor, liberação automática e liberação manual;
- `avaliacoes_turma_aluno`: registra a avaliação da qualidade da turma pelo Aluno, incluindo NPS e perguntas abertas;
- `avaliacoes_aluno_instrutor`: registra avaliação individual do aluno pelo Instrutor;
- `questionarios`, `questoes_questionario`, `opcoes_questionario`, `tentativas_questionario` e `respostas_questionario`: registram questionários objetivos e tentativas do Aluno.

Permissões principais:

- Administrador: `evaluations.manage_all`, `evaluations.view_all`, `evaluations.configure_certification`, `quizzes.manage_all`, `student_assessments.view_all` e `certificates.override_release`;
- Instrutor: `evaluations.view_own_class`, `student_assessments.create_own_class`, `quizzes.create_own_class`, `quizzes.publish_own_class` e `quizzes.view_results_own_class`;
- Aluno: `evaluations.respond_course_feedback`, `quizzes.respond`, `evaluations.view_own_results` e `certification.view_own_requirements`.

Roteiro de teste:

1. Como Administrador, acesse `/avaliacoes`, configure os requisitos de certificação da turma, veja pendências por aluno e acompanhe NPS, avaliações e questionários.
2. Como Instrutor, acesse `/avaliacoes`, crie um questionário para turma vinculada e registre a avaliação individual de um aluno.
3. Como Aluno, acesse `/avaliacoes`, responda a avaliação da turma e o questionário publicado, depois confira as pendências de certificado.
4. Para validar segurança, tente acessar `/avaliacoes` como Aluno não inscrito em turma ou tente responder questionário de turma não vinculada. A ação deve ser bloqueada.
5. Para validar certificação, conclua requisitos de frequência, progresso, avaliação e questionário. O campo `apto_certificado` passa a refletir a elegibilidade consolidada.

Limitações atuais:

- o questionário objetivo do MVP trabalha com uma questão simples de múltipla escolha por criação rápida na interface;
- relatórios exportáveis de avaliação ainda devem ser amadurecidos para produção;
- a emissão automática é suportada pela regra de elegibilidade, mas deve ser homologada institucionalmente antes de uso em produção real.

## Artefatos de planejamento

Os documentos de descoberta, arquitetura, backlog, Fase 0, Sprint 1 e homologação estão neste workspace em arquivos Markdown e YAML/SQL.

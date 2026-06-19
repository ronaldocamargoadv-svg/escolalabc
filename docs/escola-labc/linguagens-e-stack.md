# Linguagens, Stack e Responsabilidades

## Resumo da stack

A Escola LaBC e uma aplicacao web full stack baseada em Next.js App Router,
React, TypeScript, Prisma e PostgreSQL. A interface usa CSS proprio em
`src/app/globals.css`, sem dependencia de biblioteca visual externa.

## Linguagens e formatos

| Linguagem/Formato | Uso no projeto | Locais principais |
| --- | --- | --- |
| TypeScript | Regras de negocio, componentes, rotas e APIs | `src/app`, `src/lib`, `src/components` |
| TSX/React | Interfaces, paginas e componentes reutilizaveis | `src/app/**/*.tsx`, `src/components` |
| CSS | Design system, layout, responsividade e estados visuais | `src/app/globals.css` |
| Prisma Schema | Modelagem ORM e relacoes do banco | `prisma/schema.prisma` |
| SQL | Migrations e modelo inicial de referencia | `prisma/migrations`, `docs/escola-labc/tecnico` |
| JavaScript/MJS | Scripts auxiliares e seed de dados | `prisma/seed.mjs`, `scripts` |
| Markdown | Documentacao funcional e tecnica | `README.md`, `docs/escola-labc` |
| YAML | Contrato inicial OpenAPI | `docs/escola-labc/tecnico/api-openapi-inicial-escola-labc.yaml` |

## Frameworks e bibliotecas

- Next.js 16 com App Router.
- React 19.
- TypeScript 5.
- Prisma 5.
- PostgreSQL.
- `bcryptjs` para hash de senha.
- `zod` para validacoes de entrada.
- `pdf-lib` para certificados em PDF.
- `qrcode` para validacao de certificados.

## Organizacao do codigo

- `src/app`: rotas, paginas, server actions e APIs.
- `src/lib`: autenticacao, permissoes, acesso a dados, relatorios e regras de negocio.
- `src/components`: componentes reutilizaveis da interface.
- `prisma`: schema, migrations e seed.
- `public`: marca, arquivos estaticos e uploads locais demonstrativos.
- `docs/escola-labc`: documentacao do projeto.

## Padroes tecnicos adotados

- Autenticacao por sessao.
- RBAC com perfis e permissoes.
- Verificacao de permissao no frontend e na camada de acao/API.
- Dados ficticios para demonstracao e homologacao.
- Rotas server-rendered por padrao.
- APIs locais para integracao futura.
- Auditoria basica para acoes administrativas.

## Comandos principais

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
pnpm dev
pnpm lint
pnpm build
pnpm start
```


# Runbook Operacional Local

## Pre-requisitos

- Node.js compativel com Next.js 16.
- PNPM.
- PostgreSQL local, Docker ou Postgres.app.
- Arquivo `.env` configurado a partir de `.env.example`.

## Primeira execucao

```bash
pnpm install
cp .env.example .env
pnpm db:start
pnpm prisma:migrate
pnpm prisma:generate
pnpm db:seed
pnpm dev
```

Acesso local:

```text
http://localhost:3000
```

## Credenciais demonstrativas

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@labc.local` | `admin123` |
| Instrutor | `instrutor@labc.local` | `instrutor123` |
| Aluno | `aluno@labc.local` | `aluno123` |

## Validacao tecnica

```bash
pnpm lint
pnpm build
pnpm start
```

Health check:

```bash
curl -i http://localhost:3000/api/health
```

Banco local demonstrativo:

```text
postgresql://labc@127.0.0.1:5434/escola_labc?schema=public
```

## Rotina apos alteracao de schema

```bash
pnpm prisma:migrate
pnpm prisma:generate
pnpm db:seed
pnpm lint
pnpm build
```

## Rotina de demonstracao

1. Entrar como Administrador.
2. Criar ou editar curso.
3. Criar turma para o curso.
4. Vincular instrutor.
5. Publicar material por curso ou turma.
6. Entrar como Aluno.
7. Inscrever-se em uma turma.
8. Abrir `Minha jornada`.
9. Clicar em `Iniciar curso`.
10. Validar dados, informes, encontros e materiais da turma.

## Problemas comuns

### Porta 3000 ocupada

Identifique o processo:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Finalize apenas o processo correto:

```bash
kill <PID>
```

### Build antigo em execucao

Quando usar `pnpm start`, gere o build antes:

```bash
pnpm build
pnpm start
```

### Banco sem dados demonstrativos

Recarregue o seed local:

```bash
pnpm db:seed
```

Nao execute seed em banco com dados reais.

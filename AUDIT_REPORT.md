# Auditoria Pré-Apresentação - Escola LaBC de Inovação

**Data:** 27/05/2026  
**Objetivo:** verificar a estabilidade e a segurança do MVP demonstrável antes de apresentação institucional.

## Escopo Revisado

Foram avaliados stack e build, autenticação e sessão, RBAC, convites de cadastro, usuários, vínculo de Instrutor por turma, cursos/turmas/aulas, materiais, acompanhamento, certificados, Agenda, fórum, Currículo Lattes, auditoria, identidade visual, responsividade, textos e dependências.

## Achados Corrigidos

| Prioridade | Achado | Correção |
| --- | --- | --- |
| Alta | A camada de dados permitia inativar o último Administrador ou retirar seu perfil por chamada administrativa. | Regras transacionais bloqueiam auto-inativação, auto-remoção do perfil e perda do último Administrador ativo. |
| Alta | O módulo residual de transcrição aceitava qualquer sessão autenticada na API, expondo conteúdo de reuniões a perfis sem necessidade funcional. | Página, áudio, exportação, edição e glossário exigem `audit.view`. |
| Alta | Links on-line de turma, encontro e Agenda não possuíam garantia de protocolo seguro em todas as camadas. | Validação `http/https` nos formulários/API e nos serviços de domínio. |
| Média | `postcss@8.4.31`, transitivo do Next.js, possuía aviso moderado de XSS. | Resolução do workspace para `postcss@8.5.10`; auditoria repetida. |
| Média | Criação e redefinição de usuário pela tela administrativa alteravam a senha sem expor a credencial temporária ao operador autorizado. | Componentes de formulário exibem a senha temporária apenas no retorno imediato, com orientação de compartilhamento seguro. |
| Baixa | Atalho de material usava permissão genérica de edição de aula. | Atalho passou a consultar permissão específica `materials.view_own_class`. |
| Baixa | Mensagens pontuais sem acentuação adequada. | Correções de português em respostas e auditoria exibidas ao usuário. |

## Controles Confirmados

- Sessão assinada, cookie `HttpOnly`, expiração e cabeçalhos de segurança ativos.
- Convites usam token aleatório, armazenamento com hash para validação, cifra para cópia administrativa, validade, limite de uso e revogação.
- Convite para Administrador exige confirmação, uso único e validade limitada; o perfil não é escolhido pelo convidado.
- Cadastro de Instrutor exige turma vinculada; atuação depende de vínculo ativo e histórico é preservado ao encerramento.
- Aluno acessa apenas seus cursos, progresso, certificados e agenda; materiais não publicados não são expostos.
- Currículo Lattes aceita somente URL pública válida do domínio `lattes.cnpq.br`.
- Certificados exigem autenticação para download e a validação pública reduz dados pessoais.

## Verificações Executadas

- Compilação e tipagem: `pnpm lint` e `pnpm build`.
- Dependências: `pnpm audit --audit-level=moderate`.
- Teste API controlado: autenticação, encerramento de sessão, escopo por perfil, transcrições, materiais, Agenda, fórum, certificados e links on-line inseguros.
- Rotas por persona: páginas centrais de Administrador, Instrutor e Aluno.
- Interface: rotas representativas em `1920`, `1440`, `1366`, `1024`, `768`, `430` e `390` pixels, verificando overflow, logo e erro interno.

## Limitações do MVP

- Integrações com Google Calendar e Outlook são simuladas; exportação `.ics` é o mecanismo real disponível.
- Transcrição é demonstrativa/mockada e deve ser apresentada somente como recurso administrativo experimental.
- O ambiente local utiliza credenciais fictícias visíveis na tela de login; não são apropriadas para publicação.
- Para produção real ainda são recomendados MFA, recuperação segura de senha, armazenamento gerenciado de arquivos, monitoramento, backup, política LGPD formal e testes automatizados permanentes.

## Recomendação para a Apresentação

O MVP está preparado para demonstração funcional local com dados fictícios. Apresente os fluxos dos três perfis, ressaltando RBAC, vínculo de Instrutor por turma, materiais publicados, acompanhamento, certificado, Agenda e convites. Não caracterize integrações externas ou transcrição mockada como integrações produtivas.

## Segunda Rodada de Auditoria Severa - 28/05/2026

**Postura adotada:** avaliador externo severo, tentando quebrar RBAC, acessar dados indevidos e validar estabilidade visual antes de apresentação institucional.

### Testes Hostis Executados

- Aluno tentando acessar `/usuarios`, `/convites`, `/perfis`, `/auditoria` e APIs administrativas.
- Aluno tentando consultar acompanhamento de outro aluno.
- Aluno tentando criar Administrador via API.
- Administrador tentando criar outro Administrador pela API comum de usuários, sem convite administrativo.
- Instrutor tentando acessar telas administrativas.
- Instrutor tentando cadastrar material em turma sem vínculo ativo.
- Convites expirados, revogados, usados e com limite atingido acessados pela rota pública.
- Login dos três perfis e saúde da aplicação.
- Varredura visual via Chrome headless/CDP em `/login`, `/usuarios`, `/turmas`, `/engajamento`, `/minha-area`, `/catalogo`, `/agenda` e `/forum`, nas larguras `1366`, `1024`, `768`, `430` e `390` pixels.
- Busca por `Lorem Ipsum`, textos genéricos críticos, `console.log` em código de aplicação, uso de `dangerouslySetInnerHTML`, links externos sem `noopener noreferrer`, segredos óbvios e rotas sem proteção.

### Resultado Objetivo

- Auditoria HTTP/RBAC severa: **26/26 verificações aprovadas**.
- Auditoria visual/responsiva com Chrome headless: **37/37 verificações aprovadas**.
- `pnpm lint`: **aprovado**.
- `pnpm build`: **aprovado**.
- `pnpm audit --audit-level=moderate`: **sem vulnerabilidades conhecidas**.

### Constatações de Segurança

- Aluno não acessou áreas administrativas nem APIs administrativas testadas.
- Aluno não acessou acompanhamento de outro aluno.
- Instrutor não acessou gestão de usuários, perfis ou convites.
- Instrutor não conseguiu cadastrar material em turma sem vínculo ativo.
- Criação de Administrador pela API comum permaneceu bloqueada; Administrador novo exige convite administrativo válido.
- Convites inválidos não abriram formulário ativo de cadastro.
- Não foram encontrados `console.log` com dados sensíveis em `src`; os logs existentes estão em scripts de seed/teste local.
- Não foram encontrados `dangerouslySetInnerHTML` nem uso de `window.open` sem controle.
- Links externos revisados nas telas principais usam `rel="noopener noreferrer"` quando abrem nova aba.
- O arquivo `.env` contém segredo local de desenvolvimento, está coberto por `.gitignore` e não deve ser usado em produção.

### Riscos Remanescentes Antes de Produção

- Autenticação ainda é adequada para MVP local, mas produção deve exigir MFA, política formal de senhas, recuperação segura de conta e rotação de segredo.
- Upload/armazenamento de arquivos e anexos ainda deve migrar para armazenamento gerenciado, com antivírus/validação reforçada e política de retenção.
- Integrações externas de Agenda são mockadas; apenas exportação `.ics` é real.
- Transcrição segue mockada/demonstrativa e deve continuar restrita ao contexto administrativo.
- Falta uma suíte automatizada permanente de regressão E2E no repositório; a auditoria atual foi executada por scripts temporários de verificação.
- O ambiente local usa credenciais fictícias visíveis para demonstração; isso não é apropriado para ambiente público.

### Conclusão da Segunda Rodada

A solução permanece **apta para demonstração institucional controlada**, desde que apresentada explicitamente como MVP demonstrativo local. Os fluxos seguros para apresentação são: autenticação por perfis, RBAC, painel administrativo, catálogo, jornada do Aluno, vínculo de Instrutor por turma, materiais publicados, acompanhamento, certificados, Agenda interna, fórum, convites e auditoria.

## Auditoria Máxima de Segurança Pré-Testes - 31/05/2026

**Postura adotada:** squad simulada de segurança ofensiva, segurança defensiva, arquitetura segura, privacidade/LGPD, DevSecOps e qualidade de software, restrita ao ambiente local autorizado da Escola LaBC.

### Sumário Executivo

O nível geral de segurança encontrado é **adequado para testes controlados com usuários em ambiente local/homologação**, após as correções aplicadas nesta rodada. Não foram identificadas falhas críticas exploráveis nos fluxos testados. Foram corrigidos pontos de endurecimento em autenticação, validação de payload, upload e download privado.

Recomendação: **apta para testes com usuários com ressalvas de MVP**, desde que não seja tratada como produção pública e que os itens residuais sejam endereçados antes de deploy definitivo.

### Escopo Analisado

- Stack Next.js App Router, React, TypeScript, PostgreSQL, Prisma, `pg`, `bcryptjs`, `zod`.
- Rotas públicas: login, saúde, validação pública de certificado e cadastro por convite.
- Rotas protegidas: painéis, usuários, perfis, convites, cursos, turmas, aulas, materiais, inscrições, presenças, certificados, avaliações, agenda, fórum, relatórios e auditoria.
- APIs server-side em `src/app/api`.
- Banco de dados, migrations, seed e relacionamentos principais.
- Sessão, RBAC, vínculo de Instrutor por turma, certificados, uploads de transcrições, materiais por aula, Currículo Lattes e logs.

### Metodologia

Foram aplicadas referências de OWASP Top 10, OWASP API Security Top 10, revisão estática de código, revisão de queries parametrizadas, simulação controlada de IDOR, broken access control, brute force lógico, mass assignment, path traversal, acesso indevido a certificados, payload XSS inofensivo e verificação de dependências.

### Achados Encontrados

| ID | Severidade | Achado | Evidência | Correção | Status |
| --- | --- | --- | --- | --- | --- |
| SEC-001 | Média | Rate limit de login dependia de chave combinada por IP e e-mail, permitindo maior margem para brute force se o IP fosse alternado ou cabeçalho de proxy fosse manipulado. | `src/app/api/auth/login/route.ts` | Adicionado limite por e-mail e por IP, com bloqueio mesmo quando o IP informado muda. | Corrigido |
| SEC-002 | Média | APIs críticas aceitavam campos extras no payload, com descarte silencioso pelo Zod. Embora não houvesse mass assignment direto, isso dificultava detecção de payload malicioso. | `api/auth/login`, `api/cursos`, `api/usuarios`, `api/certificados`, `api/materiais` | Schemas críticos passaram a usar `.strict()`, rejeitando campos inesperados. | Corrigido |
| SEC-003 | Média | Upload de transcrição validava tamanho depois do parse de `multipart/form-data`, deixando margem para consumo desnecessário de memória antes da rejeição. | `src/app/api/transcricoes/route.ts` | Adicionado bloqueio por `Content-Length` antes do parse, com margem controlada para overhead multipart. | Corrigido |
| SEC-004 | Baixa | Nome original de áudio no cabeçalho `Content-Disposition` removia aspas, mas não tratava CR/LF e outros caracteres inadequados para cabeçalho. | `src/app/api/transcricoes/[id]/audio/route.ts` | Adicionada sanitização rígida do nome de arquivo de download. | Corrigido |
| SEC-005 | Baixa | Texto de erro sem acentuação em helper JSON. | `src/lib/api.ts` | Mensagem corrigida para “Requisição muito grande.” | Corrigido |
| SEC-006 | Informativa | Sessões são stateless por cookie assinado; logout remove o cookie, mas não invalida no servidor um token previamente copiado. | `src/lib/session.ts` | Mantido como risco residual de MVP; produção deve usar lista de sessões ou rotação de versão de sessão. | Pendente para produção |
| SEC-007 | Informativa | Senhas temporárias são exibidas ao Administrador no retorno imediato de criação/redefinição. | `src/lib/users.ts`, `src/app/usuarios/*` | Aceito para MVP administrativo local; produção deve trocar por fluxo de convite ou redefinição segura por e-mail. | Aceito com ressalva |

### Correções Implementadas

- `src/app/api/auth/login/route.ts`: rate limit por IP e por e-mail; schema estrito no login.
- `src/app/api/cursos/route.ts`: schema estrito para criação e alteração de status.
- `src/app/api/usuarios/route.ts`: schema estrito para criação, status e redefinição de senha.
- `src/app/api/certificados/route.ts`: schema estrito para emissão e cancelamento.
- `src/app/api/materiais/route.ts`: schemas estritos para criação, edição e exclusão.
- `src/app/api/transcricoes/route.ts`: limite por `Content-Length` antes de `formData()`.
- `src/app/api/transcricoes/[id]/audio/route.ts`: sanitização de nome em `Content-Disposition`.
- `src/lib/api.ts`: correção textual de mensagem de erro.
- `package.json`: novo script `test:security`.
- `scripts/security-audit.mjs`: bateria automatizada de segurança.

### Testes Executados

- `pnpm lint`: aprovado.
- `pnpm build`: aprovado.
- `pnpm audit --audit-level=moderate`: sem vulnerabilidades conhecidas.
- `pnpm test:security`: aprovado.

Testes controlados cobertos por `test:security`:

- Login válido dos perfis Administrador, Instrutor e Aluno.
- API de usuários bloqueada para visitante.
- API de usuários bloqueada para Aluno e Instrutor.
- Aluno bloqueado ao tentar criar curso.
- Payload com campo extra rejeitado em endpoint administrativo.
- Aluno bloqueado ao tentar emitir certificado.
- Aluno bloqueado ao tentar baixar certificado de outro aluno.
- Rate limit por e-mail bloqueando brute force mesmo com `X-Forwarded-For` alternado.

Testes manuais adicionais:

- `/login` retorna 200.
- `/api/health` retorna 200.
- `/usuarios` sem autenticação redireciona para `/login`.
- Validação pública de certificado rejeita código malformado e tentativa de path traversal com 400.
- Logs do servidor não apresentaram erro de runtime após as verificações.

### Checklist de Liberação para Testes com Usuários

| Item | Status |
| --- | --- |
| Autenticação validada | Aprovado |
| Autorização por perfil validada | Aprovado |
| Rotas administrativas protegidas | Aprovado |
| Aluno bloqueado em dados de terceiros testados | Aprovado |
| Instrutor bloqueado em áreas administrativas testadas | Aprovado |
| Certificados protegidos contra emissão/download indevido testados | Aprovado |
| Validação pública de certificado com formato rígido | Aprovado |
| Upload administrativo com limite e tipo validado | Aprovado com ressalva |
| Dados pessoais minimizados em APIs comuns | Aprovado com ressalva |
| Logs sem senhas em texto claro | Aprovado |
| Secrets reais ausentes no código | Aprovado |
| Dependências sem vulnerabilidade moderada conhecida | Aprovado |
| Headers de segurança configurados | Aprovado |
| CORS não permissivo | Aprovado |
| Testes automatizados de segurança adicionados | Aprovado |

### Riscos Residuais

- Produção deve trocar credenciais demonstrativas e remover dados fictícios públicos.
- Produção deve configurar `AUTH_SECRET` forte e rotação planejada.
- Sessões stateless devem evoluir para sessão persistida/revogável ou versão de sessão por usuário.
- MFA, recuperação de senha, política de senha e bloqueio administrativo de contas devem ser definidos antes de produção real.
- Uploads devem migrar para storage gerenciado com antivírus/varredura assíncrona, retenção e controle formal de download.
- Integrações externas continuam mockadas, exceto exportação `.ics`.
- É necessária revisão jurídica/LGPD formal para bases legais, retenção, anonimização e política de privacidade.

### Conclusão

A plataforma está **apta para testes controlados com usuários**, com ressalvas compatíveis com MVP/homologação. Não há recomendação de publicação em produção aberta sem concluir os itens de hardening de sessão, credenciais, uploads, LGPD formal, MFA e operação segura.

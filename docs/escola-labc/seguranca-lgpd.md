# Seguranca da Informacao e LGPD

## Principios

- Minimizar exposicao de dados pessoais.
- Aplicar controle de acesso por perfil e permissao.
- Validar a permissao tambem em acoes, servicos e APIs.
- Registrar eventos administrativos relevantes.
- Evitar dados reais em ambientes de demonstracao.

## Controles existentes no MVP

- Autenticacao por login e sessao.
- Senhas armazenadas com hash.
- RBAC com perfis e permissoes.
- Protecao de rotas administrativas.
- Restricao de dados por perfil:
  - aluno visualiza apenas seus dados;
  - instrutor visualiza dados de suas turmas;
  - administrador visualiza dados globais.
- Headers basicos de seguranca configurados.
- Auditoria para acoes sensiveis.
- Seed com dados ficticios.

## Dados sensiveis

Campos como CPF, telefone, endereco, orgao, cargo, matricula e historico
formativo devem ser tratados como dados pessoais. Em producao, recomenda-se:

- Politica formal de retencao e descarte.
- Revisao de necessidade de cada campo.
- Mascaramento de CPF e telefone em telas administrativas quando possivel.
- Registro de consentimento ou base legal aplicavel.
- Registro de acessos e alteracoes sensiveis.

## Riscos a monitorar antes de producao

- Exposicao de uploads locais em `public/uploads`.
- Falta de armazenamento externo seguro para arquivos.
- Falta de rate limit persistente distribuido.
- Falta de MFA para administradores.
- Ausencia de trilha de auditoria imutavel.
- Falta de politica de backup e recuperacao.
- Falta de revisao formal de LGPD pelo controlador municipal.

## Checklist minimo para homologacao segura

- Confirmar que usuarios ficticios nao usam dados reais.
- Testar acesso direto a rotas restritas.
- Testar APIs com perfil sem permissao.
- Testar que aluno nao acessa dados de outro aluno.
- Testar que instrutor nao acessa turmas de outro instrutor.
- Validar headers de seguranca.
- Validar logs de acoes administrativas.
- Trocar senhas de demonstracao antes de qualquer ambiente compartilhado.


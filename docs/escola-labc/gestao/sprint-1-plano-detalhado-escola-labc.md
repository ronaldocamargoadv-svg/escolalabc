# Sprint 1 - Plano Detalhado - Escola LaBC de Inovacao Publica

## 1. Objetivo da Sprint

Construir a fundacao da plataforma: autenticacao, usuarios, perfis, permissoes, layout base e auditoria inicial.

Ao final da Sprint 1, usuarios internos devem conseguir acessar a plataforma com perfis definidos e navegar por uma estrutura inicial protegida por permissao.

## 2. Duracao

2 semanas.

## 3. Escopo

### Incluido

- Setup inicial da aplicacao.
- Estrutura de frontend e backend.
- Banco de dados inicial.
- Login.
- Logout.
- Usuario autenticado.
- Cadastro de usuarios.
- Perfis.
- Associacao usuario-perfil.
- Protecao de rotas.
- Layout base autenticado.
- Logs de auditoria para usuarios e perfis.

### Fora da Sprint

- Cursos.
- Turmas.
- Inscricoes.
- Presenca.
- Certificados.
- Relatorios.
- Forum.
- Integracoes externas.

## 4. Historias da Sprint

### S1-H01 - Setup tecnico do projeto

Como equipe tecnica, quero uma base de projeto configurada para iniciar o desenvolvimento com padroes comuns.

Criterios de aceite:

- Projeto executa localmente.
- Banco local sobe com schema inicial.
- Variaveis de ambiente documentadas.
- Estrutura de pastas criada.
- Comando de lint/teste definido.

Tarefas:

- Criar estrutura do projeto.
- Configurar TypeScript.
- Configurar banco.
- Configurar ORM/migrations.
- Criar seed inicial.
- Criar README tecnico.

### S1-H02 - Login de usuario

Como usuario, quero fazer login para acessar a plataforma.

Criterios de aceite:

- Usuario informa e-mail e senha.
- Credenciais validas geram sessao.
- Credenciais invalidas exibem erro generico.
- Usuario bloqueado nao consegue acessar.
- Senha nao e armazenada em texto puro.

Tarefas:

- Criar endpoint de login.
- Criar tela de login.
- Implementar hash de senha.
- Criar middleware de autenticacao.
- Criar testes basicos.

### S1-H03 - Usuario autenticado

Como usuario autenticado, quero visualizar meus dados basicos e perfis.

Criterios de aceite:

- Endpoint /auth/me retorna usuario logado.
- Frontend identifica usuario logado.
- Sessao expirada redireciona para login.
- Perfis retornados orientam exibicao de menu.

Tarefas:

- Criar endpoint /auth/me.
- Criar controle de sessao no frontend.
- Criar componente de usuario logado.
- Criar redirecionamento de acesso.

### S1-H04 - Cadastro de usuarios

Como administrador, quero cadastrar usuarios para liberar acesso a plataforma.

Criterios de aceite:

- Administrador cadastra nome, CPF, e-mail, vinculo e perfil.
- Sistema impede CPF e e-mail duplicados.
- Sistema permite ativar e bloquear usuario.
- Cadastro gera log de auditoria.

Tarefas:

- Criar endpoint de usuarios.
- Criar tela/lista de usuarios.
- Criar formulario de usuario.
- Validar CPF/e-mail obrigatorios.
- Registrar auditoria.

### S1-H05 - Perfis e permissoes

Como administrador, quero associar perfis a usuarios para controlar acesso.

Criterios de aceite:

- Sistema possui perfis iniciais.
- Administrador atribui um ou mais perfis.
- Rotas administrativas exigem perfil autorizado.
- Usuario sem permissao recebe bloqueio de acesso.

Tarefas:

- Criar seed de perfis.
- Criar relacionamento usuario-perfil.
- Criar guard de permissao.
- Aplicar permissao nas rotas de usuarios.
- Ajustar menu por perfil.

### S1-H06 - Layout base autenticado

Como usuario autenticado, quero navegar por uma interface inicial organizada.

Criterios de aceite:

- Existe layout com menu, cabecalho e area de conteudo.
- Menu respeita perfil do usuario.
- Interface funciona em desktop e mobile.
- Rotas futuras aparecem como placeholders controlados.

Tarefas:

- Criar layout base.
- Criar navegacao por perfil.
- Criar dashboard placeholder.
- Criar estados de carregamento e erro.

### S1-H07 - Auditoria inicial

Como administrador, quero que acoes sensiveis sejam registradas.

Criterios de aceite:

- Criacao, edicao, bloqueio de usuario e alteracao de perfil geram log.
- Log registra usuario executor, acao, entidade, entidade_id e data/hora.
- Logs nao podem ser editados pela interface comum.

Tarefas:

- Criar tabela de auditoria.
- Criar servico de auditoria.
- Integrar auditoria aos fluxos de usuario/perfil.
- Criar consulta tecnica inicial de logs.

## 5. Definicao de Pronto da Sprint

Uma historia so pode ser concluida quando:

- criterio de aceite foi atendido;
- permissao foi validada no backend;
- erro comum foi tratado;
- dado sensivel nao aparece indevidamente;
- teste manual foi executado;
- auditoria foi gerada quando aplicavel;
- PO ou responsavel validou a historia.

## 6. Plano de Testes da Sprint 1

### Cenarios obrigatorios

1. Login com usuario valido.
2. Login com senha invalida.
3. Login com usuario bloqueado.
4. Acesso a rota protegida sem login.
5. Acesso a rota administrativa sem perfil autorizado.
6. Cadastro de usuario valido.
7. Tentativa de cadastro com e-mail duplicado.
8. Tentativa de cadastro com CPF duplicado.
9. Associacao de perfil a usuario.
10. Bloqueio de usuario.
11. Registro de auditoria apos alteracao de usuario.

## 7. Dados Seed

Perfis iniciais:

- administrador_geral;
- gestor_labc;
- instrutor;
- participante;
- moderador;
- convidado.

Usuario inicial:

- nome: Administrador LaBC;
- e-mail: admin@labc.local;
- perfil: administrador_geral;
- senha temporaria: definida por variavel segura ou processo de setup.

## 8. Riscos da Sprint

| Risco | Mitigacao |
|---|---|
| Indefinicao da stack final | Usar stack recomendada e registrar decisao. |
| Permissoes mal definidas | Comecar com perfis simples e evoluir por modulo. |
| Falta de ambiente de homologacao | Criar ambiente local compartilhavel ou homologacao temporaria. |
| Dados pessoais expostos em logs | Logs devem registrar resumo sem dados sensiveis desnecessarios. |

## 9. Entregavel Final

Ao final da Sprint 1, a plataforma deve permitir:

- login;
- identificacao de usuario autenticado;
- cadastro e bloqueio de usuarios;
- atribuicao de perfis;
- navegacao em layout base;
- protecao de rotas por permissao;
- auditoria inicial.


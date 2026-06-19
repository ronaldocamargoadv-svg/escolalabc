# Arquitetura Funcional

## Proposito

A plataforma Escola LaBC organiza cursos, turmas, aulas, materiais, inscricoes,
frequencia, certificados, forum e relatorios para atividades formativas do
Laboratorio de Inovacao de Balneario Camboriu.

## Perfis principais

### Administrador

- Gerencia cursos, turmas, aulas, usuarios, perfis, permissoes e materiais.
- Consulta inscricoes, presencas, certificados, relatorios e auditoria.
- Emite, bloqueia, cancela ou reemite certificados.

### Instrutor

- Acompanha cursos e turmas sob sua responsabilidade.
- Consulta alunos inscritos.
- Registra frequencia quando autorizado.
- Publica materiais, comunicados e participa dos debates.

### Aluno

- Consulta catalogo e detalhes de cursos.
- Inscreve-se em turmas abertas.
- Acessa sua jornada, aulas, materiais, frequencia, debates e certificados.
- Visualiza apenas seus proprios dados.

## Modulos da aplicacao

| Modulo | Finalidade | Rotas principais |
| --- | --- | --- |
| Autenticacao | Login, logout e usuario atual | `/login`, `/api/auth/*` |
| Dashboard | Visao por perfil | `/` |
| Catalogo | Ofertas disponiveis e inscricao | `/catalogo`, `/catalogo/[turmaId]` |
| Minha area | Jornada do aluno | `/minha-area`, `/minha-area/turmas/[turmaId]` |
| Cursos | Gestao de cursos | `/cursos`, `/cursos/[cursoId]/editar` |
| Turmas | Gestao de turmas e links publicos | `/turmas`, `/turmas/[turmaId]/editar` |
| Inscricoes | Controle de participantes | `/inscricoes`, `/inscricao/[turmaId]` |
| Encontros | Aulas e agenda | `/encontros` |
| Presencas | Frequencia e participacao | `/presencas` |
| Materiais | Apoio didatico por curso/turma | `/materiais` |
| Forum | Debates e comunicados | `/forum` |
| Certificados | Emissao, download e validacao | `/certificados`, `/certificados/validar` |
| Usuarios e RBAC | Usuarios, perfis e permissoes | `/usuarios`, `/perfis` |
| Auditoria | Logs administrativos | `/auditoria` |

## Fluxo do aluno

1. Login.
2. Acesso ao catalogo.
3. Consulta de detalhes da turma.
4. Inscricao.
5. Acesso a `Minha jornada`.
6. Botao `Iniciar curso`.
7. Tela da turma com dados, informes, encontros e materiais.
8. Participacao em debates.
9. Consulta de frequencia e certificado.

## Fluxo administrativo

1. Criar curso.
2. Criar turma vinculada ao curso.
3. Vincular instrutor.
4. Cadastrar encontros.
5. Publicar materiais por curso ou turma.
6. Acompanhar inscricoes.
7. Registrar frequencia.
8. Liberar certificado.
9. Consultar relatorios e auditoria.

## Dependencias funcionais

- Uma turma sempre pertence a um curso.
- Materiais podem estar vinculados ao curso ou diretamente a uma turma.
- O aluno acessa a tela de inicio apenas para turmas com inscricao ativa.
- Certificados dependem dos criterios de frequencia e liberacao.
- Instrutores visualizam apenas turmas vinculadas a eles, salvo permissao adicional.


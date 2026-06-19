# Proposta de Solucao - Escola LaBC de Inovacao Publica

## 1. Contexto

O Laboratorio de Inovacao de Balneario Camboriu, LaBC, necessita de uma plataforma propria para organizar, disponibilizar, registrar, acompanhar e certificar atividades formativas, cursos, aulas, oficinas, trilhas de aprendizagem, eventos hibridos e conteudos de inovacao publica.

Atualmente, as capacitacoes e seus registros estao dispersos em apresentacoes, arquivos, links, listas de presenca, formularios, videos, mensagens e sistemas nao integrados. Isso reduz a rastreabilidade institucional, dificulta a emissao de certificados e impede que o conhecimento produzido pelo LaBC se torne um ativo permanente.

## 2. Visao do Produto

A solucao proposta e uma plataforma web responsiva, inspirada no conceito da Escola Virtual.Gov/ENAP, mas adaptada a realidade municipal, ao Decreto no 13.149/2026 e as necessidades operacionais do LaBC.

O produto devera funcionar como uma Escola LaBC de Inovacao Publica, reunindo:

- gestao de cursos, oficinas, eventos e trilhas;
- inscricao de participantes;
- controle de presenca;
- repositorio de materiais;
- espacos de debate;
- emissao e validacao publica de certificados;
- relatorios institucionais;
- historico permanente de capacitacoes e participacao.

## 3. Publicos e Perfis

### Participantes

Servidores municipais, agentes publicos, parceiros institucionais, professores, facilitadores, universidades, entidades parceiras e eventualmente cidadaos inscritos em cursos ou eventos abertos.

### Equipe Interna LaBC

Equipe gestora do Laboratorio de Inovacao, Diretoria de Governo Eletronico e Inovacao, Divisao de Tecnologia da Informacao, Secretaria Municipal de Governo, Inovacao e Orcamento e demais setores envolvidos.

### Instrutores e Conteudistas

Professores, facilitadores, servidores especialistas, universidades parceiras e convidados responsaveis por cursos, oficinas, mentorias ou aulas.

### Administradores

Equipe responsavel por criar cursos, cadastrar turmas, validar presenca, publicar materiais, emitir certificados, moderar debates, controlar permissoes e extrair relatorios.

## 4. Problemas Atuais

- Informacoes dispersas em multiplas ferramentas.
- Ausencia de historico institucional consolidado.
- Dificuldade de comprovar participacao e frequencia.
- Retrabalho na emissao de certificados.
- Baixa padronizacao de cursos, oficinas e trilhas.
- Dificuldade de reaproveitar conteudos ja produzidos.
- Pouca visibilidade sobre participacao por pessoa, secretaria, tema ou periodo.
- Ausencia de indicadores de capacitacao e inovacao.
- Dependencia de ferramentas externas.
- Dificuldade de manter comunidades de debate apos as atividades.
- Risco de perda de memoria institucional.

## 5. Objetivos da Solucao

- Centralizar a gestao educacional e institucional do LaBC.
- Criar historico permanente das formacoes realizadas.
- Reduzir trabalho manual em inscricoes, presencas e certificados.
- Ampliar a rastreabilidade de participacao, carga horaria e conclusao.
- Disponibilizar materiais e gravacoes de forma organizada.
- Permitir debates por curso, turma ou comunidade.
- Gerar indicadores institucionais de capacitacao.
- Validar certificados publicamente por codigo unico ou QR Code.
- Preparar a arquitetura para integracoes futuras com sistemas municipais.

## 6. Escopo do MVP

O MVP deve ser enxuto e priorizar a operacao essencial da Escola LaBC.

### Funcionalidades Incluidas

1. Login e perfis de acesso.
2. Cadastro de usuarios.
3. Cadastro de cursos.
4. Cadastro de turmas.
5. Inscricao de participantes.
6. Controle de vagas e lista de participantes.
7. Area do participante.
8. Upload ou cadastro de materiais, links, apresentacoes, videos e gravacoes.
9. Controle de presenca manual e por QR Code.
10. Calculo de percentual de frequencia.
11. Emissao de certificado em PDF.
12. Codigo unico e QR Code para validacao de certificado.
13. Pagina publica de validacao de certificado.
14. Forum simples por curso ou turma.
15. Painel administrativo.
16. Relatorios basicos.
17. Logs de auditoria para acoes sensiveis.

### Funcionalidades Fora do MVP

- Trilhas avancadas de aprendizagem.
- Gamificacao.
- Ranking de participacao.
- Provas e avaliacoes automatizadas.
- Integracao nativa com videoconferencia.
- Login unico municipal.
- Integracao com RH.
- Biblioteca publica ampla.
- Comunidade ampla de inovacao.
- Recomendacao de cursos com inteligencia artificial.
- Painel publico de indicadores.
- Assinatura digital ICP-Brasil.
- Aplicativo movel.
- Marketplace de cursos de parceiros.
- Gestao de mentorias.
- Ambiente de projetos, desafios e hackathons.
- Curadoria automatizada de conteudos.
- Integracao com calendario institucional.

## 7. Requisitos Funcionais

### Autenticacao e Permissoes

- Permitir login de usuarios.
- Permitir recuperacao de senha.
- Controlar acesso por perfis.
- Restringir acoes administrativas a usuarios autorizados.
- Registrar logs de acoes relevantes.

### Gestao de Usuarios

- Cadastrar nome, CPF, e-mail, telefone, endereco, orgao ou secretaria, cargo, matricula, instituicao de origem, vinculo e perfil de acesso.
- Permitir ativacao, bloqueio e edicao de usuarios.
- Consultar historico de participacao por usuario.

### Gestao de Cursos

- Cadastrar nome, descricao, objetivos, ementa, carga horaria, modalidade, publico-alvo, instrutor, periodo, local, link online, criterios de certificacao e status.
- Publicar, despublicar ou arquivar cursos.
- Associar materiais e turmas a cursos.

### Gestao de Turmas

- Cadastrar datas, horarios, vagas, local, link online e instrutores.
- Controlar inscritos, lista de espera, presencas, avaliacoes e certificados emitidos.
- Permitir fechamento de turma.

### Inscricoes

- Permitir inscricao em cursos disponiveis.
- Controlar vagas.
- Gerar confirmacao de inscricao.
- Permitir cancelamento conforme regra administrativa.

### Presenca

- Registrar presenca por encontro.
- Permitir check-in por QR Code.
- Permitir validacao manual por gestor ou instrutor.
- Calcular percentual de frequencia.
- Registrar justificativas quando necessario.

### Certificacao

- Gerar certificado em PDF.
- Incluir dados do participante, curso, carga horaria, data de conclusao, percentual de frequencia, base normativa, autoridade emissora, assinatura institucional e codigo de validacao.
- Gerar QR Code apontando para pagina publica de validacao.
- Manter historico de emissao.

### Validacao Publica

- Permitir consulta publica por codigo unico.
- Exibir status de autenticidade do certificado.
- Exibir dados minimos do certificado sem expor informacoes sensiveis alem do necessario.

### Materiais

- Permitir upload ou cadastro de links de PDFs, apresentacoes, videos, documentos e gravacoes.
- Associar materiais a cursos ou turmas.
- Controlar visibilidade por perfil.

### Forum

- Criar forum simples por curso ou turma.
- Permitir postagens, comentarios, perguntas e respostas.
- Permitir moderacao.
- Permitir notificacoes basicas.

### Relatorios

- Exibir total de cursos realizados.
- Exibir total de inscritos, presentes, concluintes e certificados emitidos.
- Exibir carga horaria total ofertada.
- Exibir participacao por secretaria, curso, tema e periodo.
- Exportar relatorios em CSV ou XLSX.

## 8. Requisitos Nao Funcionais

- Interface web responsiva.
- Baixo custo de manutencao.
- Banco de dados relacional.
- Arquitetura modular.
- APIs documentadas.
- Controle de acesso por perfil.
- Aderencia a LGPD.
- Logs de auditoria.
- Backups periodicos.
- Capacidade de hospedagem institucional ou em nuvem.
- Codigo organizado para manutencao por equipe municipal ou fornecedor.
- Preparacao para integracoes futuras.

## 9. Perfis de Acesso

### Administrador Geral

Gerencia toda a plataforma, usuarios, permissoes, cursos, certificados, configuracoes e relatorios.

### Gestor LaBC

Cria cursos, turmas e conteudos, valida presencas, acompanha indicadores e emite certificados.

### Instrutor ou Facilitador

Publica materiais, acompanha alunos, registra presenca, interage em foruns e lanca avaliacoes quando aplicavel.

### Participante

Inscreve-se em cursos, acessa materiais, acompanha avisos, participa de foruns, consulta presenca e baixa certificados.

### Moderador

Atua nos espacos de debate, aprova publicacoes, organiza topicos e controla condutas.

### Convidado ou Observador

Acessa conteudos publicos ou eventos especificos com permissoes restritas.

## 10. Modelo de Dados Inicial

### Entidades Principais

- Usuario
- Perfil
- Curso
- Turma
- Encontro
- Inscricao
- Presenca
- Material
- Certificado
- Forum
- Topico
- Comentario
- Notificacao
- LogAuditoria

### Relacionamentos Principais

- Um usuario possui um ou mais perfis.
- Um curso possui uma ou mais turmas.
- Uma turma pertence a um curso.
- Uma turma possui um ou mais encontros.
- Um usuario pode se inscrever em varias turmas.
- Uma inscricao pertence a um usuario e a uma turma.
- Uma presenca pertence a uma inscricao e a um encontro.
- Um certificado pertence a uma inscricao concluida.
- Um curso ou turma pode possuir varios materiais.
- Um curso ou turma pode possuir um forum.
- Um forum possui topicos.
- Um topico possui comentarios.
- Logs de auditoria registram acoes de usuarios autenticados.

## 11. Arquitetura Recomendada

### Visao Geral

Arquitetura web modular com frontend responsivo, backend por API, banco relacional, servico de arquivos e modulo de geracao de certificados.

### Componentes

- Frontend web responsivo.
- Backend/API.
- Banco de dados relacional.
- Servico de autenticacao e autorizacao.
- Modulo de certificados em PDF.
- Modulo de QR Code e validacao publica.
- Servico de armazenamento de arquivos.
- Painel administrativo.
- Modulo de relatorios.
- Logs e auditoria.

### Stack Sugerida

Opcao recomendada:

- Frontend: Next.js ou React.
- Backend: Node.js/NestJS ou Next.js API, conforme padrao da equipe.
- Banco: PostgreSQL.
- ORM: Prisma ou TypeORM.
- Autenticacao: credenciais locais no MVP, preparada para login institucional futuro.
- Arquivos: armazenamento local institucional, S3 compativel ou servico equivalente.
- Certificados: geracao server-side em PDF.
- QR Code: geracao com codigo unico de certificado.
- Deploy: Docker, ambiente institucional ou nuvem.
- Observabilidade: logs estruturados, metricas basicas e auditoria.

## 12. Integracoes

### MVP

- Validacao publica de certificado por codigo unico ou QR Code.
- Envio basico de e-mail para confirmacao de inscricao e certificado, se houver servico disponivel.

### Futuro

- Login institucional da Prefeitura.
- Site oficial do LaBC.
- Portal da Prefeitura de Balneario Camboriu.
- Ferramentas de videoconferencia.
- Repositorio institucional de arquivos.
- WhatsApp ou notificacoes.
- Sistema de protocolo ou processo eletronico.
- Assinatura ou validacao digital avancada.
- API publica de consulta de certificados.
- Sistemas de RH.

## 13. Backlog Inicial do MVP

### Epico 1 - Fundacao da Plataforma

- Como administrador, quero configurar a plataforma para controlar usuarios, perfis e permissoes.
- Como usuario, quero fazer login para acessar funcionalidades conforme meu perfil.
- Como administrador, quero auditar acoes sensiveis para manter rastreabilidade.

### Epico 2 - Gestao de Cursos e Turmas

- Como gestor, quero cadastrar cursos para organizar a oferta formativa.
- Como gestor, quero criar turmas para controlar datas, vagas e instrutores.
- Como gestor, quero publicar ou arquivar cursos para manter o catalogo atualizado.

### Epico 3 - Inscricoes

- Como participante, quero consultar cursos disponiveis para escolher capacitacoes.
- Como participante, quero me inscrever em uma turma para participar da atividade.
- Como gestor, quero acompanhar inscritos e vagas para controlar a operacao.

### Epico 4 - Materiais

- Como instrutor, quero publicar materiais para apoiar os participantes.
- Como participante, quero acessar materiais do curso para estudar e consultar conteudos.

### Epico 5 - Presenca

- Como instrutor, quero registrar presenca dos participantes para validar frequencia.
- Como gestor, quero usar QR Code ou check-in manual para reduzir trabalho operacional.
- Como participante, quero acompanhar minha frequencia para saber se posso receber certificado.

### Epico 6 - Certificados

- Como gestor, quero emitir certificados em PDF para participantes concluintes.
- Como participante, quero baixar meu certificado para comprovar conclusao.
- Como publico externo, quero validar um certificado por codigo ou QR Code para confirmar autenticidade.

### Epico 7 - Forum

- Como participante, quero publicar duvidas e comentarios para manter o debate ativo.
- Como instrutor, quero responder perguntas para apoiar a aprendizagem.
- Como moderador, quero moderar conteudos para manter qualidade e conduta adequada.

### Epico 8 - Relatorios

- Como gestor, quero visualizar indicadores basicos para acompanhar resultados.
- Como administrador, quero exportar relatorios para prestacao de contas e analise institucional.

## 14. Roadmap

### Fase 0 - Descoberta Detalhada

- Validar fluxo atual de inscricoes, presencas e certificados.
- Definir modelos de certificado.
- Definir base normativa e dados obrigatorios.
- Priorizar relatorios do MVP.
- Definir politica de acesso, privacidade e retencao de dados.

### Fase 1 - MVP Operacional

- Login e perfis.
- Cursos e turmas.
- Inscricoes.
- Materiais.
- Presenca.
- Certificados.
- Validacao publica.
- Relatorios basicos.

### Fase 2 - Evolucao Institucional

- Login institucional.
- Integracoes com site e portal.
- Melhorias de notificacao.
- Trilhas de aprendizagem.
- Avaliacoes e provas.
- Dashboards avancados.

### Fase 3 - Ecossistema LaBC

- Comunidade ampliada.
- Biblioteca publica de conhecimento.
- Mentorias.
- Projetos e desafios.
- Recomendacoes com IA.
- Aplicativo movel.
- Integracoes com RH e calendario.

## 15. Riscos e Cuidados

- Tentar construir uma plataforma muito ampla no primeiro ciclo.
- Subestimar regras de certificacao e validacao.
- Nao definir criterios claros de frequencia e conclusao.
- Expor dados pessoais sem necessidade na validacao publica.
- Criar dependencia excessiva de ferramentas externas.
- Falta de governanca sobre conteudos, usuarios e permissoes.
- Ausencia de rotina de backup e auditoria.
- Baixa adesao se a experiencia do participante for complexa.

## 16. Questoes Pendentes para Refinamento

1. Qual sera o modelo visual e juridico do certificado?
2. Quem sera a autoridade emissora dos certificados?
3. A base normativa deve aparecer em todos os certificados?
4. Quais dados podem ser exibidos na validacao publica?
5. O CPF deve ser obrigatorio para todos os participantes?
6. Havera cursos abertos ao publico externo ou somente servidores e parceiros?
7. Quem aprova a publicacao de novos cursos?
8. Havera limite de inscricoes por participante?
9. Como tratar presenca em eventos online?
10. Quais relatorios sao indispensaveis para a primeira entrega?
11. Onde os arquivos serao armazenados no MVP?
12. A plataforma sera hospedada pela Prefeitura ou por fornecedor?

## 17. Proximo Passo Recomendado

Realizar uma oficina curta de validacao com a equipe do LaBC para transformar este documento em:

- matriz de requisitos priorizados;
- fluxos de usuario;
- modelo de dados detalhado;
- prototipo de telas principais;
- estimativa tecnica;
- cronograma de desenvolvimento;
- plano de implantacao do MVP.


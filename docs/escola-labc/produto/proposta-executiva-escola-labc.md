# Proposta Executiva - Escola LaBC de Inovacao Publica

## 1. Sumario Executivo

Propõe-se o desenvolvimento da Escola LaBC de Inovacao Publica, uma plataforma digital propria para gestao de cursos, oficinas, eventos, materiais, presencas, certificados e indicadores do Laboratorio de Inovacao de Balneario Camboriu.

A solucao busca transformar as atividades formativas do LaBC em um ativo institucional permanente, reduzindo dispersao de informacoes, retrabalho operacional e perda de memoria institucional.

O primeiro ciclo deve priorizar um MVP enxuto, com foco em operacao real: cadastro de cursos e turmas, inscricoes, presenca, materiais, certificado digital em PDF, validacao publica por QR Code e relatorios basicos.

## 2. Problema a Resolver

Hoje, as capacitacoes e conteudos do LaBC podem ficar distribuidos entre planilhas, formularios, apresentacoes, links, arquivos em nuvem, listas de presenca, e-mails, mensagens e registros administrativos avulsos.

Essa fragmentacao gera:

- baixa rastreabilidade da participacao;
- dificuldade de comprovar frequencia e conclusao;
- retrabalho na emissao de certificados;
- ausencia de historico institucional consolidado;
- pouca visibilidade gerencial sobre capacitacoes realizadas;
- dificuldade de reaproveitar conteudos ja produzidos;
- risco de perda de conhecimento publico gerado pelo LaBC.

## 3. Objetivo da Iniciativa

Criar uma plataforma municipal de aprendizagem e inovacao publica que centralize a gestao das atividades formativas do LaBC e permita acompanhar, certificar e analisar a participacao de servidores, parceiros e demais publicos autorizados.

## 4. Beneficios Esperados

- Organizacao institucional das atividades formativas.
- Reducao de trabalho manual em inscricoes, presencas e certificados.
- Certificados digitais verificaveis por codigo unico ou QR Code.
- Historico permanente de cursos, turmas, participantes e materiais.
- Indicadores de capacitacao por periodo, curso, secretaria e tema.
- Maior transparencia e confiabilidade na certificacao.
- Reaproveitamento de conteudos e materiais ja produzidos.
- Base tecnica preparada para integracoes futuras.

## 5. Escopo do MVP

O MVP deve contemplar as funcionalidades essenciais para colocar a Escola LaBC em operacao controlada:

1. Login e perfis de acesso.
2. Cadastro de usuarios.
3. Cadastro de cursos e turmas.
4. Inscricao de participantes.
5. Controle de vagas.
6. Area do participante.
7. Repositorio de materiais.
8. Registro de presenca manual e/ou por QR Code.
9. Calculo de frequencia.
10. Emissao de certificado PDF.
11. Validacao publica de certificado por codigo ou QR Code.
12. Forum simples por curso ou turma.
13. Painel administrativo.
14. Relatorios basicos.
15. Logs de auditoria.

## 6. Publicos Atendidos

### Participantes

Servidores municipais, agentes publicos, parceiros institucionais, universidades, entidades parceiras, convidados e eventualmente cidadaos inscritos em cursos ou eventos abertos.

### Equipe LaBC

Gestores e equipe tecnica responsaveis pela criacao, acompanhamento e avaliacao das atividades.

### Instrutores e Facilitadores

Professores, servidores especialistas, universidades parceiras e convidados responsaveis por aulas, oficinas, mentorias e conteudos.

### Administradores

Responsaveis pela configuracao, seguranca, usuarios, permissoes, certificados e relatorios.

## 7. Perfis de Acesso

- Administrador geral.
- Gestor LaBC.
- Instrutor ou facilitador.
- Participante.
- Moderador.
- Convidado ou observador.

## 8. Arquitetura Recomendada

Recomenda-se uma arquitetura web modular, com frontend responsivo, backend por API, banco de dados relacional, servico de arquivos e modulo de geracao de certificados.

Componentes principais:

- aplicacao web responsiva;
- API backend;
- banco de dados PostgreSQL ou equivalente relacional;
- autenticacao com controle de perfis;
- armazenamento de arquivos;
- geracao de certificados PDF;
- QR Code e pagina publica de validacao;
- painel administrativo;
- relatorios;
- logs de auditoria.

Essa arquitetura permite iniciar sem integracoes obrigatorias e evoluir, em fases posteriores, para login institucional, integracao com sistemas municipais, videoconferencia, RH, assinatura digital e dashboards publicos.

## 9. Roadmap Proposto

### Fase 0 - Descoberta e Preparacao

- Validacao dos fluxos com a equipe LaBC.
- Definicao do modelo de certificado.
- Definicao dos dados obrigatorios e regras LGPD.
- Priorizacao final do backlog.
- Prototipo das telas principais.

### Fase 1 - MVP Operacional

- Login, perfis e usuarios.
- Cursos, turmas e inscricoes.
- Materiais e presenca.
- Certificados e validacao publica.
- Relatorios basicos.
- Homologacao com usuarios-chave.

### Fase 2 - Evolucao Institucional

- Login institucional.
- Integracoes com site e portal.
- Notificacoes aprimoradas.
- Trilhas de aprendizagem.
- Avaliacoes e dashboards avancados.

### Fase 3 - Ecossistema de Inovacao

- Comunidade ampliada.
- Biblioteca publica de conhecimento.
- Mentorias.
- Projetos, desafios e hackathons.
- Recomendacoes com inteligencia artificial.
- Aplicativo movel.

## 10. Cronograma Referencial

Considerando sprints de duas semanas, o MVP pode ser planejado em aproximadamente 14 a 16 semanas, incluindo preparacao, desenvolvimento, homologacao e implantacao assistida.

| Etapa | Duracao estimada | Resultado |
|---|---:|---|
| Descoberta e prototipo | 2 semanas | Backlog validado e prototipo aprovado. |
| Desenvolvimento do nucleo | 4 semanas | Login, usuarios, cursos, turmas e inscricoes. |
| Operacao formativa | 4 semanas | Materiais, presenca, frequencia e area do participante. |
| Certificacao e relatorios | 4 semanas | PDF, QR Code, validacao publica e indicadores. |
| Homologacao e implantacao | 2 semanas | Ajustes, treinamento e entrada controlada em producao. |

## 11. Governanca e Seguranca

A plataforma deve observar boas praticas de seguranca e privacidade, especialmente por lidar com dados pessoais de participantes.

Pontos obrigatorios:

- controle de acesso por perfil;
- coleta minima de dados necessarios;
- logs de auditoria;
- backups periodicos;
- validacao publica de certificados com exposicao limitada de dados;
- politica de retencao e tratamento de dados;
- aderencia a LGPD;
- separacao clara entre conteudos publicos, restritos e administrativos.

## 12. Indicadores do MVP

O painel inicial deve permitir acompanhar:

- total de cursos realizados;
- total de turmas;
- total de inscritos;
- total de presentes;
- total de concluintes;
- total de certificados emitidos;
- carga horaria total ofertada;
- participacao por secretaria;
- participacao por tema;
- taxa de conclusao.

## 13. Riscos Principais

- Ampliar excessivamente o escopo do MVP.
- Nao definir previamente regras de certificacao.
- Expor dados pessoais em excesso na validacao publica.
- Falta de definicao sobre hospedagem e armazenamento.
- Baixa adesao se a jornada do participante for complexa.
- Ausencia de governanca para publicacao de cursos e materiais.

## 14. Recomendacao

Recomenda-se aprovar a execucao da Fase 0 para detalhamento final do MVP, com producao de prototipo, matriz de requisitos validada, modelo de dados detalhado, arquitetura tecnica e plano de implantacao.

Apos essa etapa, a equipe podera iniciar o desenvolvimento incremental da plataforma, priorizando a entrada em operacao da Escola LaBC com certificacao digital verificavel e relatorios institucionais basicos.


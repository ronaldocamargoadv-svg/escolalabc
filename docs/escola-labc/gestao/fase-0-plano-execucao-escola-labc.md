# Fase 0 - Plano de Execucao - Escola LaBC de Inovacao Publica

## 1. Objetivo da Fase 0

A Fase 0 tem como objetivo transformar a proposta da Escola LaBC de Inovacao Publica em uma base pronta para desenvolvimento. Esta fase deve reduzir incertezas, fechar decisoes criticas, validar o escopo do MVP, detalhar fluxos essenciais e preparar ambiente tecnico.

Ao final da Fase 0, a equipe deve estar apta a iniciar a Sprint 1 com backlog refinado, prototipo validado, arquitetura definida e criterios de aceite claros.

## 2. Duracao Recomendada

Duracao sugerida: 2 semanas.

Cadencia:

- 1 reuniao de abertura;
- 3 oficinas de descoberta e validacao;
- 2 sessoes tecnicas;
- 1 reuniao de fechamento;
- revisoes assincronas dos artefatos.

## 3. Objetivos Especificos

- Validar o escopo do MVP.
- Fechar decisoes sobre certificado, presenca, dados pessoais e hospedagem.
- Definir jornadas principais.
- Criar prototipo navegavel das telas criticas.
- Detalhar modelo de dados inicial.
- Definir arquitetura tecnica.
- Preparar backlog refinado para as primeiras sprints.
- Definir criterios de aceite e plano de testes.
- Identificar riscos e dependencias antes do desenvolvimento.

## 4. Entregaveis da Fase 0

| Entregavel | Responsavel principal | Resultado esperado |
|---|---|---|
| Escopo fechado do MVP | Product Owner | Lista aprovada de funcionalidades da primeira entrega. |
| Log de decisoes | Orquestrador | Decisoes criticas registradas com responsavel e impacto. |
| Prototipo navegavel | UX/UI Designer | Fluxos principais validados com usuarios-chave. |
| Mapa de jornadas | UX Research | Jornadas de participante, gestor, instrutor e publico validador. |
| Modelo de dados inicial | Arquiteto de Dados | Entidades, relacionamentos e dicionario de dados preliminar. |
| Arquitetura tecnica | Arquiteto de Software | Componentes, modulos, integracoes futuras e padroes tecnicos. |
| Backlog refinado | Product Owner e Analista | Historias priorizadas, estimadas e com criterios de aceite. |
| Plano de testes | QA | Cenarios de teste dos fluxos criticos. |
| Plano de ambientes | DevOps | Definicao de desenvolvimento, homologacao e producao. |

## 5. Agenda Recomendada

### Dia 1 - Kickoff

Participantes:

- Gestores LaBC;
- Product Owner;
- Orquestrador;
- Analista de Requisitos;
- Arquitetura;
- UX;
- Dados;
- Seguranca/LGPD;
- DevOps;
- QA.

Pauta:

- confirmar objetivo institucional;
- revisar escopo proposto;
- validar restricoes;
- identificar stakeholders;
- definir responsaveis por decisoes.

Saida:

- alinhamento inicial;
- calendario da Fase 0;
- matriz de participantes e responsabilidades.

### Dias 2 e 3 - Oficina de Requisitos e Processos

Pauta:

- fluxo atual de cursos e eventos;
- fluxo desejado de inscricao;
- controle de presenca;
- emissao de certificados;
- relatorios necessarios;
- regras administrativas.

Saida:

- requisitos revisados;
- regras de negocio priorizadas;
- lacunas e pendencias.

### Dias 4 e 5 - UX e Prototipacao

Pauta:

- jornadas por perfil;
- mapa de telas;
- fluxos de navegacao;
- prototipo das telas principais;
- validacao de linguagem e usabilidade.

Saida:

- prototipo inicial;
- mapa de telas do MVP;
- ajustes de experiencia.

### Dias 6 e 7 - Dados, Certificacao e LGPD

Pauta:

- modelo de dados;
- campos obrigatorios;
- dados sensiveis;
- validacao publica de certificados;
- regras de auditoria;
- retencao de dados.

Saida:

- modelo de dados preliminar;
- politica de exposicao minima;
- decisoes sobre certificado e validacao.

### Dias 8 e 9 - Arquitetura e Ambiente Tecnico

Pauta:

- stack tecnica;
- autenticacao;
- arquitetura modular;
- armazenamento de arquivos;
- geracao de PDF;
- QR Code;
- backups;
- ambientes;
- pipeline.

Saida:

- documento de arquitetura;
- plano de ambientes;
- riscos tecnicos.

### Dia 10 - Fechamento da Fase 0

Pauta:

- apresentar entregaveis;
- validar backlog;
- aprovar escopo do MVP;
- confirmar Sprint 1;
- registrar pendencias restantes.

Saida:

- autorizacao para iniciar desenvolvimento;
- backlog da Sprint 1;
- agenda da Sprint 1.

## 6. Fluxos Criticos a Validar

### Fluxo 1 - Criacao de Curso e Turma

1. Gestor acessa painel administrativo.
2. Cadastra curso.
3. Define ementa, carga horaria, modalidade e criterios.
4. Cria turma vinculada.
5. Define datas, vagas, instrutor, local ou link.
6. Publica turma para inscricao.

### Fluxo 2 - Inscricao do Participante

1. Participante acessa catalogo.
2. Visualiza detalhe do curso.
3. Seleciona turma disponivel.
4. Confirma inscricao.
5. Acompanha status na area do participante.

### Fluxo 3 - Presenca

1. Instrutor acessa turma.
2. Seleciona encontro.
3. Registra presenca manual ou habilita QR Code.
4. Sistema atualiza percentual de frequencia.
5. Participante visualiza frequencia.

### Fluxo 4 - Certificacao

1. Sistema identifica participantes aptos.
2. Gestor revisa lista de concluintes.
3. Gestor emite certificados.
4. Participante baixa PDF.
5. Terceiro valida autenticidade por codigo ou QR Code.

### Fluxo 5 - Relatorios

1. Gestor acessa painel.
2. Filtra por periodo, curso, secretaria ou tema.
3. Consulta indicadores.
4. Exporta relatorio.

## 7. Decisoes Criticas da Fase 0

- Percentual minimo de frequencia para certificacao.
- Modelo visual e juridico do certificado.
- Autoridade emissora.
- Dados exibidos na validacao publica.
- Dados obrigatorios para cadastro de participante.
- Forma de armazenamento de arquivos.
- Hospedagem inicial.
- Uso de e-mail no MVP.
- Inclusao ou nao do QR Code de presenca no MVP.
- Inclusao ou nao do forum simples no MVP.

## 8. Criterios de Conclusao da Fase 0

A Fase 0 sera considerada concluida quando:

- o escopo do MVP estiver aprovado;
- as decisoes criticas estiverem registradas;
- o prototipo estiver validado;
- o backlog da Sprint 1 estiver pronto;
- o modelo de dados inicial estiver aprovado tecnicamente;
- a arquitetura inicial estiver aprovada;
- o plano de testes estiver definido;
- houver acordo sobre ambiente de desenvolvimento e homologacao.

## 9. Riscos da Fase 0

| Risco | Impacto | Mitigacao |
|---|---|---|
| Falta de decisao sobre certificado | Atrasa modulo central do MVP | Realizar oficina especifica com responsavel institucional. |
| Escopo crescer alem do MVP | Aumenta prazo e custo | Usar matriz MoSCoW e proteger Must have. |
| Dados pessoais sem regra clara | Risco LGPD | Definir dados minimos e exposicao publica limitada. |
| Indefinicao de hospedagem | Atrasa setup tecnico | Definir opcao temporaria de homologacao. |
| Baixa disponibilidade dos stakeholders | Requisitos incompletos | Agendar oficinas curtas e objetivas. |

## 10. Saida Esperada para Sprint 1

A Sprint 1 deve iniciar com:

- repositorio criado;
- ambiente local documentado;
- banco inicial definido;
- historias de login, usuarios e permissoes refinadas;
- layout base aprovado;
- criterios de aceite revisados;
- plano de testes da Sprint 1 pronto.


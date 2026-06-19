# Matriz de Requisitos e Backlog - Escola LaBC de Inovacao Publica

## 1. Criterios de Priorizacao

Esta matriz usa a classificacao MoSCoW:

- Must have: indispensavel para o MVP.
- Should have: importante, mas pode entrar apos o nucleo operacional.
- Could have: desejavel, sem impacto critico no primeiro ciclo.
- Won't have now: fora do MVP, previsto para fases futuras.

## 2. Matriz de Requisitos Priorizados

| ID | Requisito | Tipo | Prioridade | Perfil principal | Criterio de aceite |
|---|---|---|---|---|---|
| RF-01 | Login de usuarios | Funcional | Must have | Todos | Usuario autenticado acessa apenas areas permitidas ao seu perfil. |
| RF-02 | Controle de perfis e permissoes | Funcional | Must have | Administrador | Administrador consegue atribuir perfis e restringir acoes sensiveis. |
| RF-03 | Cadastro de usuarios | Funcional | Must have | Administrador/Gestor | Sistema registra dados minimos de identificacao, contato, orgao, cargo e vinculo. |
| RF-04 | Cadastro de cursos | Funcional | Must have | Gestor LaBC | Gestor cadastra curso com nome, ementa, carga horaria, modalidade, publico-alvo e status. |
| RF-05 | Cadastro de turmas | Funcional | Must have | Gestor LaBC | Gestor cria turma vinculada a curso, com datas, horarios, vagas, local ou link online. |
| RF-06 | Inscricao de participantes | Funcional | Must have | Participante | Participante inscrito aparece na lista da turma e recebe status de inscricao. |
| RF-07 | Controle de vagas | Funcional | Must have | Gestor LaBC | Sistema impede inscricoes acima do limite definido ou envia excedentes para lista de espera. |
| RF-08 | Area do participante | Funcional | Must have | Participante | Participante visualiza cursos inscritos, materiais, avisos, presenca e certificados. |
| RF-09 | Repositorio de materiais | Funcional | Must have | Gestor/Instrutor | Materiais podem ser cadastrados como upload ou link e associados a curso ou turma. |
| RF-10 | Registro manual de presenca | Funcional | Must have | Gestor/Instrutor | Responsavel registra presenca por encontro e participante. |
| RF-11 | Check-in por QR Code | Funcional | Should have | Participante/Instrutor | Participante registra presenca por QR Code dentro de regra definida para o encontro. |
| RF-12 | Calculo de frequencia | Funcional | Must have | Sistema | Sistema calcula percentual de frequencia por inscricao. |
| RF-13 | Criterios de certificacao | Funcional | Must have | Gestor LaBC | Gestor define regra minima de frequencia e carga horaria para emissao de certificado. |
| RF-14 | Emissao de certificado PDF | Funcional | Must have | Gestor/Participante | Certificado e gerado com dados do curso, participante, carga horaria, data, codigo e QR Code. |
| RF-15 | Codigo unico de certificado | Funcional | Must have | Sistema | Cada certificado possui identificador unico, nao reutilizavel. |
| RF-16 | Validacao publica de certificado | Funcional | Must have | Publico externo | Pagina publica permite consultar autenticidade por codigo ou QR Code. |
| RF-17 | Forum simples por curso/turma | Funcional | Should have | Participante/Instrutor | Usuarios logados conseguem criar topicos e comentar dentro de curso ou turma. |
| RF-18 | Moderacao de forum | Funcional | Should have | Moderador | Moderador consegue ocultar ou aprovar conteudos conforme regra definida. |
| RF-19 | Relatorios basicos | Funcional | Must have | Gestor/Administrador | Sistema exibe cursos, inscritos, presentes, concluintes, certificados e carga horaria total. |
| RF-20 | Exportacao de relatorios | Funcional | Should have | Gestor/Administrador | Relatorios podem ser exportados em CSV ou XLSX. |
| RF-21 | Logs de auditoria | Funcional | Must have | Administrador | Acoes sensiveis ficam registradas com usuario, data, acao e entidade afetada. |
| RF-22 | Notificacoes por e-mail | Funcional | Should have | Participante | Sistema envia confirmacoes basicas de inscricao e disponibilidade de certificado. |
| RF-23 | Login institucional municipal | Integracao | Won't have now | Todos | Arquitetura permanece preparada para SSO futuro. |
| RF-24 | Integracao com videoconferencia | Integracao | Won't have now | Instrutor | Links podem ser cadastrados manualmente no MVP. |
| RF-25 | Integracao com RH | Integracao | Won't have now | Gestor | Dados de servidores poderao ser integrados em fase futura. |
| RF-26 | Trilhas avancadas de aprendizagem | Funcional | Won't have now | Participante | Planejado apos estabilizacao de cursos e turmas. |
| RF-27 | Avaliacoes automatizadas/provas | Funcional | Could have | Instrutor | Pode ser incorporado apos o modulo de certificacao basico. |
| RF-28 | Painel publico de indicadores | Funcional | Could have | Publico externo | Pode ser criado com dados agregados, sem exposicao de dados pessoais. |
| RNF-01 | Interface responsiva | Nao funcional | Must have | Todos | Plataforma funciona em desktop, tablet e celular. |
| RNF-02 | LGPD e privacidade | Nao funcional | Must have | Todos | Dados pessoais sao coletados com finalidade clara e exposicao minima. |
| RNF-03 | Baixo custo de manutencao | Nao funcional | Must have | Gestao | Stack deve ser comum, documentada e sustentavel para equipe municipal ou fornecedor. |
| RNF-04 | Banco relacional | Nao funcional | Must have | Tecnologia | Dados transacionais ficam em banco relacional, preferencialmente PostgreSQL. |
| RNF-05 | Arquitetura modular | Nao funcional | Must have | Tecnologia | Modulos podem evoluir sem reescrever a plataforma. |
| RNF-06 | Backups periodicos | Nao funcional | Must have | Administrador | Rotina de backup e restauracao deve ser definida antes da entrada em producao. |
| RNF-07 | APIs documentadas | Nao funcional | Should have | Tecnologia | Endpoints principais possuem documentacao tecnica. |
| RNF-08 | Observabilidade basica | Nao funcional | Should have | Tecnologia | Erros, eventos e acoes criticas sao monitoraveis. |

## 3. Backlog do MVP por Epicos

### Epico 1 - Fundacao, Login e Permissoes

Objetivo: criar a base segura da plataforma.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como administrador, quero cadastrar usuarios para liberar acesso a plataforma. | Must | 5 pts | Usuario criado consegue acessar conforme perfil. |
| Como usuario, quero fazer login para acessar meus recursos. | Must | 5 pts | Login valido entra; login invalido exibe erro seguro. |
| Como administrador, quero gerenciar perfis para controlar permissoes. | Must | 8 pts | Permissoes impedem acesso indevido a areas restritas. |
| Como administrador, quero registrar logs de acoes sensiveis. | Must | 5 pts | Criacao, edicao, exclusao, presenca e certificado geram log. |

### Epico 2 - Cursos e Turmas

Objetivo: permitir que o LaBC publique ofertas formativas.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como gestor, quero cadastrar cursos para organizar a oferta formativa. | Must | 8 pts | Curso salvo aparece no painel administrativo. |
| Como gestor, quero publicar e arquivar cursos. | Must | 3 pts | Apenas cursos publicados aparecem para inscricao. |
| Como gestor, quero criar turmas vinculadas a cursos. | Must | 8 pts | Turma possui vagas, datas, horarios, instrutor e local/link. |
| Como gestor, quero associar instrutores a turmas. | Must | 3 pts | Instrutor visualiza suas turmas. |

### Epico 3 - Inscricoes e Area do Participante

Objetivo: viabilizar a jornada basica do participante.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como participante, quero consultar cursos publicados. | Must | 5 pts | Lista exibe cursos disponiveis e detalhes basicos. |
| Como participante, quero me inscrever em uma turma. | Must | 8 pts | Inscricao aparece na area do participante e na lista da turma. |
| Como sistema, quero controlar vagas para evitar superlotacao. | Must | 5 pts | Inscricoes excedentes sao bloqueadas ou enviadas para lista de espera. |
| Como participante, quero acessar minha area para acompanhar cursos e certificados. | Must | 8 pts | Area mostra cursos inscritos, status, materiais, presenca e certificados. |

### Epico 4 - Materiais e Conteudos

Objetivo: centralizar materiais de apoio.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como gestor ou instrutor, quero cadastrar materiais por upload ou link. | Must | 8 pts | Material fica associado ao curso ou turma. |
| Como participante, quero acessar materiais dos cursos em que estou inscrito. | Must | 5 pts | Participante ve apenas materiais permitidos. |
| Como gestor, quero controlar visibilidade dos materiais. | Should | 3 pts | Material pode ser publico, restrito a inscritos ou interno. |

### Epico 5 - Presenca

Objetivo: registrar frequencia de forma rastreavel.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como gestor, quero cadastrar encontros da turma. | Must | 5 pts | Cada encontro tem data, horario, modalidade e responsavel. |
| Como instrutor, quero registrar presenca manual. | Must | 8 pts | Presenca fica vinculada ao participante e encontro. |
| Como sistema, quero calcular frequencia acumulada. | Must | 5 pts | Percentual de frequencia e atualizado apos registros. |
| Como participante, quero realizar check-in por QR Code. | Should | 8 pts | QR Code registra presenca dentro de janela permitida. |

### Epico 6 - Certificacao e Validacao Publica

Objetivo: emitir certificados confiaveis e verificaveis.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como gestor, quero definir criterio de certificacao por curso/turma. | Must | 5 pts | Sistema sabe quem esta apto a certificado. |
| Como gestor, quero emitir certificado em PDF para concluintes. | Must | 13 pts | PDF contem dados obrigatorios, codigo unico e QR Code. |
| Como participante, quero baixar meus certificados. | Must | 5 pts | Certificado fica disponivel na area do participante. |
| Como cidadao, quero validar certificado por codigo ou QR Code. | Must | 8 pts | Pagina publica confirma autenticidade com dados minimos. |

### Epico 7 - Forum Simples

Objetivo: manter debate e perguntas por curso ou turma.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como participante, quero criar topicos no forum da turma. | Should | 5 pts | Topico aparece para usuarios autorizados. |
| Como participante ou instrutor, quero comentar topicos. | Should | 5 pts | Comentarios ficam ordenados e identificados. |
| Como moderador, quero ocultar conteudos inadequados. | Should | 5 pts | Conteudo ocultado deixa de aparecer aos participantes. |

### Epico 8 - Relatorios

Objetivo: oferecer visao gerencial minima.

| Historia | Prioridade | Estimativa | Aceite |
|---|---|---:|---|
| Como gestor, quero visualizar indicadores basicos. | Must | 8 pts | Painel mostra cursos, inscritos, presentes, concluintes e certificados. |
| Como gestor, quero filtrar indicadores por periodo, curso e secretaria. | Should | 5 pts | Filtros atualizam os indicadores exibidos. |
| Como gestor, quero exportar relatorios. | Should | 5 pts | Exportacao gera CSV ou XLSX. |

## 4. Proposta de Sprints

Premissa: sprints de 2 semanas, time minimo com PO/analista, designer, frontend, backend, QA e apoio de arquitetura/DevOps.

### Sprint 0 - Preparacao e Refinamento

- Validar fluxos principais com LaBC.
- Definir modelo do certificado.
- Definir campos obrigatorios e politica LGPD.
- Definir ambientes, repositorio e padroes tecnicos.
- Criar prototipo navegavel das telas principais.

Entregavel: backlog refinado, prototipo aprovado e ambiente tecnico pronto.

### Sprint 1 - Base da Plataforma

- Autenticacao.
- Perfis e permissoes.
- Cadastro de usuarios.
- Layout base.
- Logs de auditoria iniciais.

Entregavel: usuarios conseguem acessar a plataforma conforme perfil.

### Sprint 2 - Cursos e Turmas

- Cadastro de cursos.
- Cadastro de turmas.
- Associacao de instrutores.
- Publicacao/arquivamento.
- Catalogo inicial de cursos publicados.

Entregavel: gestor consegue criar curso, turma e disponibilizar para inscricao.

### Sprint 3 - Inscricoes e Area do Participante

- Inscricao em turma.
- Controle de vagas.
- Lista de participantes.
- Area do participante.
- Status de inscricao.

Entregavel: participante consegue se inscrever e acompanhar sua participacao.

### Sprint 4 - Materiais e Presenca Manual

- Cadastro de materiais.
- Acesso a materiais.
- Cadastro de encontros.
- Registro manual de presenca.
- Calculo de frequencia.

Entregavel: instrutor consegue registrar presencas e participante visualiza frequencia.

### Sprint 5 - Certificados e Validacao

- Regras de certificacao.
- Geracao de PDF.
- Codigo unico.
- QR Code.
- Pagina publica de validacao.
- Historico de certificados.

Entregavel: certificados podem ser emitidos, baixados e validados publicamente.

### Sprint 6 - Forum, Relatorios e Ajustes de MVP

- Forum simples.
- Moderacao basica.
- Painel de indicadores.
- Exportacao de relatorios.
- Ajustes de usabilidade.
- Testes de regressao.

Entregavel: MVP completo para homologacao.

### Sprint 7 - Homologacao e Implantacao Assistida

- Homologacao com usuarios-chave.
- Correcao de bugs.
- Carga inicial de dados.
- Treinamento da equipe LaBC.
- Plano de operacao e suporte.

Entregavel: plataforma pronta para entrada controlada em producao.

## 5. Marcos de Entrega

| Marco | Resultado esperado |
|---|---|
| M1 | Backlog e prototipo aprovados. |
| M2 | Plataforma com login, usuarios e perfis. |
| M3 | Cursos, turmas e inscricoes operacionais. |
| M4 | Materiais e presenca em funcionamento. |
| M5 | Certificacao com validacao publica. |
| M6 | Relatorios, forum e homologacao do MVP. |
| M7 | Implantacao assistida e treinamento. |

## 6. Definicao de Pronto

Uma funcionalidade so deve ser considerada pronta quando:

- atende ao criterio de aceite;
- possui validacao de permissao;
- respeita requisitos de privacidade;
- foi testada em desktop e mobile;
- possui tratamento de erro basico;
- registra auditoria quando envolver acao sensivel;
- foi homologada pelo perfil usuario responsavel.

## 7. Decisoes Pendentes

1. Modelo visual e juridico do certificado.
2. Autoridade emissora e assinatura institucional.
3. Campos obrigatorios para usuarios externos.
4. Politica de exposicao de dados na validacao publica.
5. Hospedagem institucional ou nuvem.
6. Servico de e-mail disponivel.
7. Armazenamento de arquivos.
8. Percentual minimo padrao para certificacao.
9. Regras de inscricao, cancelamento e lista de espera.
10. Relatorios obrigatorios para a primeira prestacao de contas.


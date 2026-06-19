# Matriz RACI - Squad Escola LaBC de Inovacao Publica

## 1. Legenda

- R: Responsible, executa a atividade.
- A: Accountable, responde pela decisao final.
- C: Consulted, deve ser consultado.
- I: Informed, deve ser informado.

## 2. Papeis

| Sigla | Papel |
|---|---|
| ORQ | Orquestrador de Solucao |
| PO | Product Owner / Gestor de Produto |
| REQ | Analista de Requisitos |
| UX | UX Research / UX/UI Designer |
| ARQ | Arquiteto de Software |
| DAD | Arquiteto de Dados |
| BE | Backend Lead |
| FE | Frontend Lead |
| QA | QA / Qualidade |
| DEVOPS | DevOps / Infraestrutura |
| SEG | Seguranca e LGPD |
| CERT | Subagente de Certificacao |
| PRES | Subagente de Presenca |
| REL | Subagente de Relatorios |
| INT | Subagente de Integracoes |
| CONT | Subagente de Conteudo |
| IMPL | Subagente de Implantacao |
| GEST | Gestores LaBC / Stakeholders |

## 3. Matriz RACI

| Atividade | ORQ | PO | REQ | UX | ARQ | DAD | BE | FE | QA | DEVOPS | SEG | Subagentes | GEST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Validar visao do produto | R | A | C | C | I | I | I | I | I | I | C | I | A |
| Fechar escopo do MVP | R | A | R | C | C | C | C | C | C | I | C | C | A |
| Priorizar backlog | C | A | R | C | C | C | C | C | C | I | C | C | C |
| Detalhar requisitos | C | A | R | C | C | C | C | C | C | I | C | C | C |
| Mapear jornadas | I | A | C | R | I | I | I | C | C | I | C | C | C |
| Criar prototipo | I | A | C | R | I | I | I | C | C | I | C | C | C |
| Definir modelo de certificado | C | A | C | C | C | C | C | C | C | I | C | R | A |
| Definir regra de presenca | C | A | R | C | C | C | C | C | C | I | C | R | A |
| Definir dados publicos da validacao | C | A | C | C | C | C | C | I | C | I | R | R | A |
| Modelar dados | I | C | C | I | C | A/R | C | I | C | I | C | C | I |
| Definir arquitetura | C | I | C | I | A/R | C | C | C | C | C | C | C | I |
| Definir APIs | I | I | C | I | A | C | R | C | C | I | C | C | I |
| Implementar backend | I | I | C | I | C | C | A/R | I | C | I | C | C | I |
| Implementar frontend | I | I | C | C | C | I | C | A/R | C | I | C | C | I |
| Definir testes | I | C | C | C | C | C | C | C | A/R | I | C | C | I |
| Preparar ambientes | I | I | I | I | C | I | C | C | C | A/R | C | C | I |
| Definir backups e logs | I | I | I | I | C | C | C | I | C | A/R | C | C | I |
| Homologar MVP | R | A | C | C | I | I | C | C | R | C | C | C | A/R |
| Treinar usuarios | I | A | C | C | I | I | I | I | C | I | I | R | R |
| Implantar producao assistida | C | A | I | I | C | I | C | C | R | R | C | R | C |

## 4. Responsabilidades de Decisao

### Decisoes de negocio

Responsavel final: Product Owner e Gestores LaBC.

Inclui:

- escopo;
- priorizacao;
- regras operacionais;
- criterios de certificacao;
- relatorios gerenciais.

### Decisoes tecnicas

Responsavel final: Arquiteto de Software, com apoio de DevOps, Backend, Frontend, Dados e Seguranca.

Inclui:

- stack;
- arquitetura;
- banco;
- hospedagem;
- APIs;
- seguranca tecnica.

### Decisoes de dados e privacidade

Responsavel final: Seguranca/LGPD e Gestores LaBC, com apoio de Dados.

Inclui:

- dados obrigatorios;
- exposicao publica;
- retencao;
- auditoria;
- uso de dados pessoais.


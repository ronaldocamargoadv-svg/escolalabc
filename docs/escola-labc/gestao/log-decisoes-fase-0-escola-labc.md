# Log de Decisoes - Fase 0 - Escola LaBC de Inovacao Publica

## 1. Objetivo

Registrar as decisoes necessarias para iniciar o desenvolvimento da Escola LaBC de Inovacao Publica com menor risco de retrabalho.

Status possiveis:

- Proposta: decisao sugerida pela squad.
- Pendente: precisa de validacao institucional.
- Aprovada: decisao confirmada.
- Revisar: decisao deve ser reavaliada.

## 2. Decisoes Criticas

| ID | Tema | Decisao proposta | Status | Responsavel por validar | Impacto |
|---|---|---|---|---|---|
| D-01 | Escopo do MVP | MVP inclui cursos, turmas, inscricoes, materiais, presenca, certificados, validacao publica, relatorios e administracao. | Proposta | Gestores LaBC / PO | Define todo o planejamento de desenvolvimento. |
| D-02 | Forum no MVP | Forum simples entra como Should have e pode ser removido se houver restricao de prazo. | Proposta | PO / Gestor LaBC | Afeta Sprint 6 e moderacao. |
| D-03 | QR Code de presenca | QR Code de presenca entra como Should have; presenca manual e obrigatoria. | Proposta | PO / Instrutores | Evita bloquear MVP por complexidade operacional. |
| D-04 | QR Code do certificado | QR Code de validacao do certificado e obrigatorio no MVP. | Proposta | Gestor LaBC | Funcionalidade central de confiabilidade. |
| D-05 | Frequencia minima | Adotar frequencia minima padrao de 75%, configuravel por curso ou turma. | Proposta | Gestor LaBC / Juridico se necessario | Impacta regra de certificacao. |
| D-06 | Autoridade emissora | Certificado emitido pelo LaBC com autoridade institucional definida pela Secretaria competente. | Pendente | Gestor LaBC / Secretaria | Impacta texto e assinatura do certificado. |
| D-07 | Base normativa | Certificado deve conter referencia normativa quando aplicavel, incluindo o Decreto no 13.149/2026 se confirmado. | Pendente | Gestor LaBC / Juridico | Impacta modelo juridico do certificado. |
| D-08 | Dados publicos na validacao | Pagina publica deve exibir apenas nome do participante, curso, carga horaria, data de conclusao, emissor, status e codigo. | Proposta | Seguranca/LGPD / Gestor LaBC | Reduz exposicao de dados pessoais. |
| D-09 | CPF na validacao publica | CPF nao deve ser exibido publicamente; se necessario, exibir apenas mascarado. | Proposta | Seguranca/LGPD | Protecao de dado pessoal. |
| D-10 | Cadastro de usuario | CPF, nome e e-mail devem ser obrigatorios; matricula/secretaria obrigatorios apenas para servidores. | Proposta | PO / LGPD | Afeta formularios e importacao. |
| D-11 | Login do MVP | MVP usa autenticacao propria, preparada para login institucional futuro. | Proposta | Arquitetura / TI Municipal | Permite iniciar sem depender de SSO. |
| D-12 | Banco de dados | Usar banco relacional, preferencialmente PostgreSQL. | Proposta | Arquitetura / TI Municipal | Base para integridade e relatorios. |
| D-13 | Armazenamento de arquivos | MVP deve aceitar links e upload; armazenamento final depende de decisao de infraestrutura. | Pendente | DevOps / TI Municipal | Impacta custos, backup e seguranca. |
| D-14 | E-mail | Notificacoes por e-mail entram se houver servico institucional disponivel. | Pendente | TI Municipal | Afeta confirmacoes e comunicacao. |
| D-15 | Hospedagem | Plataforma deve poder rodar em ambiente institucional ou nuvem, preferencialmente via Docker. | Proposta | TI Municipal | Impacta arquitetura e DevOps. |
| D-16 | Auditoria | Criacao, edicao, exclusao, presenca, emissao e cancelamento de certificados devem gerar log. | Proposta | Arquitetura / LGPD | Requisito de rastreabilidade. |
| D-17 | Importacao inicial | MVP deve permitir cadastro manual; importacao em lote pode ser ferramenta administrativa simples se houver dados historicos organizados. | Proposta | PO / Gestor LaBC | Afeta carga inicial. |
| D-18 | Relatorios do MVP | Relatorios iniciais devem cobrir cursos, inscritos, presentes, concluintes, certificados, carga horaria e secretaria. | Proposta | Gestor LaBC | Define painel gerencial inicial. |

## 3. Decisoes de Escopo

### Funcionalidades obrigatorias para o MVP

- Login e perfis.
- Usuarios.
- Cursos.
- Turmas.
- Inscricoes.
- Materiais.
- Presenca manual.
- Frequencia.
- Certificado PDF.
- Validacao publica por codigo e QR Code.
- Relatorios basicos.
- Logs de auditoria.

### Funcionalidades condicionais no MVP

- QR Code de presenca.
- Forum simples.
- Exportacao XLSX.
- E-mails transacionais.
- Importacao em lote.

### Funcionalidades fora do MVP

- Login unico municipal.
- Integracao com RH.
- Aplicativo movel.
- Gamificacao.
- Trilhas avancadas.
- Assinatura ICP-Brasil.
- Inteligencia artificial.
- Marketplace de cursos.

## 4. Pendencias para Validacao Institucional

1. Confirmar autoridade emissora dos certificados.
2. Confirmar texto juridico e base normativa.
3. Confirmar se CPF sera obrigatorio para todos os publicos.
4. Confirmar regra padrao de frequencia.
5. Confirmar onde os arquivos serao armazenados.
6. Confirmar ambiente de hospedagem.
7. Confirmar disponibilidade de servico de e-mail.
8. Confirmar se forum e QR Code de presenca entram no MVP.


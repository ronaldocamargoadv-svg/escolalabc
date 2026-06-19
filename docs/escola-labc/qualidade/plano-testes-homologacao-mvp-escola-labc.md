# Plano de Testes e Homologacao - MVP Escola LaBC

## 1. Objetivo

Definir os cenarios de teste e homologacao do MVP da Escola LaBC de Inovacao Publica, garantindo que os fluxos essenciais funcionem antes da entrada em producao assistida.

## 2. Escopo de Testes

- Autenticacao e permissoes.
- Usuarios e perfis.
- Cursos e turmas.
- Inscricoes.
- Materiais.
- Presencas.
- Certificados.
- Validacao publica.
- Relatorios.
- Auditoria.
- Responsividade.
- Regras de privacidade.

## 3. Perfis de Teste

| Perfil | Objetivo |
|---|---|
| Administrador geral | Validar configuracoes, usuarios, perfis e auditoria. |
| Gestor LaBC | Validar operacao de cursos, turmas, presencas, certificados e relatorios. |
| Instrutor | Validar suas turmas, materiais e presenca. |
| Participante | Validar inscricao, materiais, frequencia e certificados. |
| Publico externo | Validar certificado sem login. |

## 4. Cenarios por Fluxo

### Fluxo A - Autenticacao

| ID | Cenario | Resultado esperado |
|---|---|---|
| A-01 | Login com credenciais validas | Usuario acessa area autenticada. |
| A-02 | Login com senha invalida | Sistema exibe erro generico. |
| A-03 | Usuario bloqueado tenta acessar | Sistema impede acesso. |
| A-04 | Usuario sem perfil tenta acessar area restrita | Sistema bloqueia permissao. |
| A-05 | Sessao expirada | Usuario e redirecionado ao login. |

### Fluxo B - Usuarios

| ID | Cenario | Resultado esperado |
|---|---|---|
| B-01 | Administrador cadastra usuario | Usuario e criado com status ativo. |
| B-02 | Cadastro com CPF duplicado | Sistema impede duplicidade. |
| B-03 | Cadastro com e-mail duplicado | Sistema impede duplicidade. |
| B-04 | Administrador associa perfil | Usuario recebe permissoes correspondentes. |
| B-05 | Administrador bloqueia usuario | Usuario bloqueado nao acessa. |

### Fluxo C - Cursos e Turmas

| ID | Cenario | Resultado esperado |
|---|---|---|
| C-01 | Gestor cria curso valido | Curso aparece no painel. |
| C-02 | Gestor publica curso | Curso fica disponivel conforme visibilidade. |
| C-03 | Gestor arquiva curso | Curso deixa de aceitar novas inscricoes. |
| C-04 | Gestor cria turma | Turma fica vinculada ao curso. |
| C-05 | Gestor define vagas e instrutor | Turma exibe limite e responsavel. |

### Fluxo D - Inscricoes

| ID | Cenario | Resultado esperado |
|---|---|---|
| D-01 | Participante se inscreve em turma com vagas | Inscricao confirmada. |
| D-02 | Participante tenta inscricao duplicada | Sistema bloqueia duplicidade. |
| D-03 | Turma sem vagas recebe inscricao | Sistema bloqueia ou envia para lista de espera. |
| D-04 | Participante cancela inscricao | Status muda e historico permanece. |
| D-05 | Gestor consulta lista de inscritos | Lista exibe participantes e status. |

### Fluxo E - Materiais

| ID | Cenario | Resultado esperado |
|---|---|---|
| E-01 | Gestor cadastra link | Material aparece no curso/turma. |
| E-02 | Gestor faz upload | Arquivo fica disponivel aos autorizados. |
| E-03 | Participante acessa material permitido | Download ou link abre corretamente. |
| E-04 | Participante sem inscricao tenta acessar material restrito | Acesso bloqueado. |

### Fluxo F - Presenca

| ID | Cenario | Resultado esperado |
|---|---|---|
| F-01 | Instrutor registra presenca manual | Presenca fica vinculada ao encontro. |
| F-02 | Instrutor altera presenca | Alteracao gera auditoria. |
| F-03 | Sistema calcula frequencia | Percentual e atualizado. |
| F-04 | Participante consulta frequencia | Frequencia aparece na area do participante. |
| F-05 | QR Code de presenca, se aprovado | Check-in registra presenca dentro da janela permitida. |

### Fluxo G - Certificados

| ID | Cenario | Resultado esperado |
|---|---|---|
| G-01 | Gestor emite certificado para participante apto | PDF e gerado com codigo e QR Code. |
| G-02 | Gestor tenta emitir para participante nao apto | Sistema impede emissao. |
| G-03 | Participante baixa certificado | Arquivo PDF e baixado/visualizado. |
| G-04 | Certificado e reemitido | Historico permanece rastreavel. |
| G-05 | Certificado e cancelado | Status muda e validacao publica reflete cancelamento. |

### Fluxo H - Validacao Publica

| ID | Cenario | Resultado esperado |
|---|---|---|
| H-01 | Consulta codigo valido | Sistema confirma autenticidade. |
| H-02 | Consulta codigo inexistente | Sistema informa nao encontrado. |
| H-03 | Consulta certificado cancelado | Sistema informa status cancelado. |
| H-04 | Validacao por QR Code | Pagina publica abre com resultado correto. |
| H-05 | Verificar dados exibidos | CPF integral nao aparece. |

### Fluxo I - Relatorios

| ID | Cenario | Resultado esperado |
|---|---|---|
| I-01 | Gestor acessa dashboard | Indicadores basicos aparecem. |
| I-02 | Gestor filtra por periodo | Indicadores refletem filtro. |
| I-03 | Gestor filtra por secretaria | Indicadores refletem filtro. |
| I-04 | Exportacao CSV/XLSX | Arquivo e gerado corretamente. |

## 5. Homologacao

### Grupo piloto

Recomenda-se iniciar com:

- 1 administrador;
- 2 gestores LaBC;
- 2 instrutores;
- 10 a 20 participantes;
- 1 curso real;
- 1 turma real;
- ao menos 2 encontros.

### Roteiro de homologacao

1. Cadastrar usuarios.
2. Criar curso piloto.
3. Criar turma piloto.
4. Inscrever participantes.
5. Publicar materiais.
6. Registrar presenca.
7. Emitir certificados.
8. Validar certificados publicamente.
9. Consultar relatorios.
10. Registrar ajustes.

## 6. Criterio de Aceite do MVP

O MVP pode ser aprovado para producao assistida quando:

- fluxos de curso, turma, inscricao, presenca, certificado e validacao publica estiverem funcionando;
- nao houver bug critico aberto;
- permissao por perfil estiver validada;
- dados pessoais da validacao publica estiverem protegidos;
- relatorios minimos estiverem corretos;
- backup e logs estiverem configurados;
- usuarios-chave tiverem recebido treinamento.


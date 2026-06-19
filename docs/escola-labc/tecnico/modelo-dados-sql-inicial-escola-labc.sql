-- Modelo SQL inicial - Escola LaBC de Inovacao Publica
-- Banco alvo: PostgreSQL

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT,
    orgao_secretaria TEXT,
    cargo TEXT,
    matricula TEXT,
    instituicao_origem TEXT,
    vinculo TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuario_perfis (
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    perfil_id UUID NOT NULL REFERENCES perfis(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, perfil_id)
);

CREATE TABLE cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    objetivos TEXT,
    ementa TEXT NOT NULL,
    carga_horaria NUMERIC(5,2) NOT NULL,
    modalidade VARCHAR(30) NOT NULL,
    publico_alvo TEXT,
    tema TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
    criado_por UUID REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID NOT NULL REFERENCES cursos(id),
    nome TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    vagas INTEGER NOT NULL,
    local TEXT,
    link_online TEXT,
    modalidade VARCHAR(30) NOT NULL,
    criterio_frequencia_minima NUMERIC(5,2) NOT NULL DEFAULT 75,
    status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
    instrutor_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT turmas_vagas_positivas CHECK (vagas >= 0),
    CONSTRAINT turmas_frequencia_valida CHECK (criterio_frequencia_minima >= 0 AND criterio_frequencia_minima <= 100)
);

CREATE TABLE encontros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turmas(id),
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    modalidade VARCHAR(30) NOT NULL,
    local TEXT,
    link_online TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'previsto',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inscricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    turma_id UUID NOT NULL REFERENCES turmas(id),
    status VARCHAR(30) NOT NULL DEFAULT 'inscrito',
    data_inscricao TIMESTAMPTZ NOT NULL DEFAULT now(),
    origem TEXT,
    percentual_frequencia NUMERIC(5,2) NOT NULL DEFAULT 0,
    apto_certificado BOOLEAN NOT NULL DEFAULT false,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, turma_id),
    CONSTRAINT inscricoes_frequencia_valida CHECK (percentual_frequencia >= 0 AND percentual_frequencia <= 100)
);

CREATE TABLE presencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscricao_id UUID NOT NULL REFERENCES inscricoes(id),
    encontro_id UUID NOT NULL REFERENCES encontros(id),
    status VARCHAR(30) NOT NULL DEFAULT 'presente',
    metodo VARCHAR(30) NOT NULL DEFAULT 'manual',
    registrado_por UUID REFERENCES usuarios(id),
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    justificativa TEXT,
    UNIQUE (inscricao_id, encontro_id)
);

CREATE TABLE materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES cursos(id),
    turma_id UUID REFERENCES turmas(id),
    titulo TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    url TEXT,
    arquivo TEXT,
    visibilidade VARCHAR(30) NOT NULL DEFAULT 'inscritos',
    publicado_por UUID REFERENCES usuarios(id),
    publicado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT materiais_escopo CHECK (curso_id IS NOT NULL OR turma_id IS NOT NULL)
);

CREATE TABLE certificados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscricao_id UUID NOT NULL UNIQUE REFERENCES inscricoes(id),
    codigo_validacao VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'valido',
    data_emissao TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_cancelamento TIMESTAMPTZ,
    motivo_cancelamento TEXT,
    arquivo_pdf TEXT,
    hash_documento TEXT,
    emitido_por UUID REFERENCES usuarios(id)
);

CREATE TABLE foruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL UNIQUE REFERENCES turmas(id),
    titulo TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE topicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES foruns(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'publicado',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topico_id UUID NOT NULL REFERENCES topicos(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    conteudo TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'publicado',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id UUID,
    resumo TEXT,
    ip TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_turmas_curso_id ON turmas(curso_id);
CREATE INDEX idx_encontros_turma_id ON encontros(turma_id);
CREATE INDEX idx_inscricoes_usuario_id ON inscricoes(usuario_id);
CREATE INDEX idx_inscricoes_turma_id ON inscricoes(turma_id);
CREATE INDEX idx_presencas_inscricao_id ON presencas(inscricao_id);
CREATE INDEX idx_presencas_encontro_id ON presencas(encontro_id);
CREATE INDEX idx_certificados_codigo_validacao ON certificados(codigo_validacao);
CREATE INDEX idx_logs_auditoria_entidade ON logs_auditoria(entidade, entidade_id);
CREATE INDEX idx_logs_auditoria_criado_em ON logs_auditoria(criado_em);


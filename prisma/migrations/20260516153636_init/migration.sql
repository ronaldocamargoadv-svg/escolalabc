-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" TEXT,
    "endereco" TEXT,
    "orgao_secretaria" TEXT,
    "cargo" TEXT,
    "matricula" TEXT,
    "instituicao_origem" TEXT,
    "vinculo" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_perfis" (
    "usuario_id" UUID NOT NULL,
    "perfil_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_perfis_pkey" PRIMARY KEY ("usuario_id","perfil_id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "objetivos" TEXT,
    "ementa" TEXT NOT NULL,
    "carga_horaria" DECIMAL(5,2) NOT NULL,
    "modalidade" VARCHAR(30) NOT NULL,
    "publico_alvo" TEXT,
    "tema" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'rascunho',
    "criado_por" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "vagas" INTEGER NOT NULL,
    "local" TEXT,
    "link_online" TEXT,
    "modalidade" VARCHAR(30) NOT NULL,
    "criterio_frequencia_minima" DECIMAL(5,2) NOT NULL DEFAULT 75,
    "status" VARCHAR(20) NOT NULL DEFAULT 'rascunho',
    "instrutor_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encontros" (
    "id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "horario_inicio" TIME NOT NULL,
    "horario_fim" TIME NOT NULL,
    "modalidade" VARCHAR(30) NOT NULL,
    "local" TEXT,
    "link_online" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'previsto',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encontros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'inscrito',
    "data_inscricao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" TEXT,
    "percentual_frequencia" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "apto_certificado" BOOLEAN NOT NULL DEFAULT false,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas" (
    "id" UUID NOT NULL,
    "inscricao_id" UUID NOT NULL,
    "encontro_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'presente',
    "metodo" VARCHAR(30) NOT NULL DEFAULT 'manual',
    "registrado_por" UUID,
    "registrado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justificativa" TEXT,

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" UUID NOT NULL,
    "curso_id" UUID,
    "turma_id" UUID,
    "titulo" TEXT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "url" TEXT,
    "arquivo" TEXT,
    "visibilidade" VARCHAR(30) NOT NULL DEFAULT 'inscritos',
    "publicado_por" UUID,
    "publicado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" UUID NOT NULL,
    "inscricao_id" UUID NOT NULL,
    "codigo_validacao" VARCHAR(80) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'valido',
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_cancelamento" TIMESTAMP(3),
    "motivo_cancelamento" TEXT,
    "arquivo_pdf" TEXT,
    "hash_documento" TEXT,
    "emitido_por" UUID,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foruns" (
    "id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foruns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topicos" (
    "id" UUID NOT NULL,
    "forum_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'publicado',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" UUID NOT NULL,
    "topico_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'publicado',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" UUID,
    "resumo" TEXT,
    "ip" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_usuario_id_turma_id_key" ON "inscricoes"("usuario_id", "turma_id");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_inscricao_id_encontro_id_key" ON "presencas"("inscricao_id", "encontro_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_inscricao_id_key" ON "certificados"("inscricao_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_codigo_validacao_key" ON "certificados"("codigo_validacao");

-- CreateIndex
CREATE UNIQUE INDEX "foruns_turma_id_key" ON "foruns"("turma_id");

-- AddForeignKey
ALTER TABLE "usuario_perfis" ADD CONSTRAINT "usuario_perfis_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfis" ADD CONSTRAINT "usuario_perfis_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_instrutor_id_fkey" FOREIGN KEY ("instrutor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encontros" ADD CONSTRAINT "encontros_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_inscricao_id_fkey" FOREIGN KEY ("inscricao_id") REFERENCES "inscricoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_encontro_id_fkey" FOREIGN KEY ("encontro_id") REFERENCES "encontros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_inscricao_id_fkey" FOREIGN KEY ("inscricao_id") REFERENCES "inscricoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foruns" ADD CONSTRAINT "foruns_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topicos" ADD CONSTRAINT "topicos_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "foruns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_topico_id_fkey" FOREIGN KEY ("topico_id") REFERENCES "topicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

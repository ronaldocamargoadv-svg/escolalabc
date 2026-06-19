CREATE TABLE "progresso_cursos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id" UUID NOT NULL,
  "curso_id" UUID NOT NULL,
  "inscricao_id" UUID NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'not_started',
  "iniciado_em" TIMESTAMP(3),
  "ultimo_acesso_em" TIMESTAMP(3),
  "concluido_em" TIMESTAMP(3),
  "percentual_progresso" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "total_aulas" INTEGER NOT NULL DEFAULT 0,
  "aulas_concluidas" INTEGER NOT NULL DEFAULT 0,
  "aulas_acessadas" INTEGER NOT NULL DEFAULT 0,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "progresso_cursos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "acessos_aulas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id" UUID NOT NULL,
  "curso_id" UUID NOT NULL,
  "aula_id" UUID NOT NULL,
  "primeiro_acesso_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ultimo_acesso_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "quantidade_acessos" INTEGER NOT NULL DEFAULT 1,
  "concluido_em" TIMESTAMP(3),
  "concluida" BOOLEAN NOT NULL DEFAULT false,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "acessos_aulas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eventos_aprendizagem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id" UUID NOT NULL,
  "curso_id" UUID NOT NULL,
  "aula_id" UUID,
  "tipo_evento" VARCHAR(50) NOT NULL,
  "metadata" JSONB,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "eventos_aprendizagem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "progresso_cursos_inscricao_id_key"
  ON "progresso_cursos"("inscricao_id");

CREATE INDEX "progresso_cursos_usuario_id_idx"
  ON "progresso_cursos"("usuario_id");

CREATE INDEX "progresso_cursos_curso_id_idx"
  ON "progresso_cursos"("curso_id");

CREATE INDEX "progresso_cursos_status_idx"
  ON "progresso_cursos"("status");

CREATE UNIQUE INDEX "acessos_aulas_usuario_id_aula_id_key"
  ON "acessos_aulas"("usuario_id", "aula_id");

CREATE INDEX "acessos_aulas_curso_id_idx"
  ON "acessos_aulas"("curso_id");

CREATE INDEX "eventos_aprendizagem_usuario_id_curso_id_idx"
  ON "eventos_aprendizagem"("usuario_id", "curso_id");

CREATE INDEX "eventos_aprendizagem_aula_id_idx"
  ON "eventos_aprendizagem"("aula_id");

CREATE INDEX "eventos_aprendizagem_tipo_evento_idx"
  ON "eventos_aprendizagem"("tipo_evento");

ALTER TABLE "progresso_cursos"
  ADD CONSTRAINT "progresso_cursos_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresso_cursos"
  ADD CONSTRAINT "progresso_cursos_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progresso_cursos"
  ADD CONSTRAINT "progresso_cursos_inscricao_id_fkey"
  FOREIGN KEY ("inscricao_id") REFERENCES "inscricoes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "acessos_aulas"
  ADD CONSTRAINT "acessos_aulas_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "acessos_aulas"
  ADD CONSTRAINT "acessos_aulas_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "acessos_aulas"
  ADD CONSTRAINT "acessos_aulas_aula_id_fkey"
  FOREIGN KEY ("aula_id") REFERENCES "encontros"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eventos_aprendizagem"
  ADD CONSTRAINT "eventos_aprendizagem_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eventos_aprendizagem"
  ADD CONSTRAINT "eventos_aprendizagem_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eventos_aprendizagem"
  ADD CONSTRAINT "eventos_aprendizagem_aula_id_fkey"
  FOREIGN KEY ("aula_id") REFERENCES "encontros"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

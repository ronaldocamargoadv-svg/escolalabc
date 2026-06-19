CREATE TABLE IF NOT EXISTS "vinculos_instrutoria" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
  "curso_id" uuid NOT NULL REFERENCES "cursos"("id"),
  "turma_id" uuid NOT NULL REFERENCES "turmas"("id"),
  "atribuido_por_usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
  "status" varchar(24) NOT NULL DEFAULT 'agendado',
  "inicio_em" date,
  "fim_em" date,
  "desativado_em" timestamp(3),
  "motivo_desativacao" text,
  "criado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "vinculos_instrutoria_usuario_status_idx"
  ON "vinculos_instrutoria" ("usuario_id", "status");
CREATE INDEX IF NOT EXISTS "vinculos_instrutoria_turma_status_idx"
  ON "vinculos_instrutoria" ("turma_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "vinculos_instrutoria_turma_aberto_idx"
  ON "vinculos_instrutoria" ("turma_id")
  WHERE "status" IN ('agendado', 'ativo');

ALTER TABLE "convites_cadastro"
  ADD COLUMN IF NOT EXISTS "turma_instrutoria_id" uuid REFERENCES "turmas"("id");

CREATE INDEX IF NOT EXISTS "convites_cadastro_turma_instrutoria_idx"
  ON "convites_cadastro" ("turma_instrutoria_id");

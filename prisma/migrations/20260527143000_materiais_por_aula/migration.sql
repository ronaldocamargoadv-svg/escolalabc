ALTER TABLE "materiais"
  ADD COLUMN "aula_id" UUID,
  ADD COLUMN "descricao" TEXT,
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "status_publicacao" VARCHAR(20) NOT NULL DEFAULT 'publicado',
  ADD COLUMN "atualizado_por" UUID,
  ADD COLUMN "excluido_em" TIMESTAMP(3);

ALTER TABLE "materiais"
  ADD CONSTRAINT "materiais_aula_id_fkey"
  FOREIGN KEY ("aula_id") REFERENCES "encontros"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "materiais"
  ADD CONSTRAINT "materiais_publicado_por_fkey"
  FOREIGN KEY ("publicado_por") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "materiais"
  ADD CONSTRAINT "materiais_atualizado_por_fkey"
  FOREIGN KEY ("atualizado_por") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "materiais_aula_id_status_publicacao_idx"
  ON "materiais"("aula_id", "status_publicacao");

CREATE INDEX "materiais_turma_id_status_publicacao_idx"
  ON "materiais"("turma_id", "status_publicacao");

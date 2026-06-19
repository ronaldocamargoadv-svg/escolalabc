ALTER TABLE "avaliacoes_aluno_instrutor"
  ADD COLUMN IF NOT EXISTS "inscricao_id" UUID;

UPDATE "avaliacoes_aluno_instrutor" a
SET "inscricao_id" = i.id
FROM "inscricoes" i
WHERE i.turma_id = a.turma_id
  AND i.usuario_id = a.aluno_id
  AND a.inscricao_id IS NULL;

ALTER TABLE "avaliacoes_aluno_instrutor"
  DROP CONSTRAINT IF EXISTS "avaliacoes_aluno_instrutor_unique";

ALTER TABLE "avaliacoes_aluno_instrutor"
  ADD CONSTRAINT "avaliacoes_aluno_instrutor_unique"
  UNIQUE ("inscricao_id", "instrutor_id");

ALTER TABLE "avaliacoes_aluno_instrutor"
  DROP CONSTRAINT IF EXISTS "avaliacoes_aluno_instrutor_inscricao_id_fkey";

ALTER TABLE "avaliacoes_aluno_instrutor"
  ADD CONSTRAINT "avaliacoes_aluno_instrutor_inscricao_id_fkey"
  FOREIGN KEY ("inscricao_id") REFERENCES "inscricoes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "avaliacoes_aluno_instrutor_inscricao_idx"
  ON "avaliacoes_aluno_instrutor" ("inscricao_id");

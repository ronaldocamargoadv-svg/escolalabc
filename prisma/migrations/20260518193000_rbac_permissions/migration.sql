ALTER TABLE "perfis"
ADD COLUMN IF NOT EXISTS "sistema" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "permissoes" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "perfil_permissoes" (
    "perfil_id" UUID NOT NULL,
    "permissao_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_permissoes_pkey" PRIMARY KEY ("perfil_id","permissao_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "permissoes_codigo_key" ON "permissoes"("codigo");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'perfil_permissoes_perfil_id_fkey'
  ) THEN
    ALTER TABLE "perfil_permissoes"
    ADD CONSTRAINT "perfil_permissoes_perfil_id_fkey"
    FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'perfil_permissoes_permissao_id_fkey'
  ) THEN
    ALTER TABLE "perfil_permissoes"
    ADD CONSTRAINT "perfil_permissoes_permissao_id_fkey"
    FOREIGN KEY ("permissao_id") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE "convites_cadastro" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "token_hash" VARCHAR(64) NOT NULL,
  "token_cifrado" TEXT NOT NULL,
  "token_prefixo" VARCHAR(12) NOT NULL,
  "perfil_atribuido" VARCHAR(40) NOT NULL,
  "criado_por_usuario_id" UUID NOT NULL,
  "max_usos" INTEGER NOT NULL DEFAULT 1,
  "usos_realizados" INTEGER NOT NULL DEFAULT 0,
  "expira_em" TIMESTAMP(3) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "email_convidado" TEXT,
  "dominio_email_permitido" TEXT,
  "observacao" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revogado_em" TIMESTAMP(3),
  "revogado_por_usuario_id" UUID,
  CONSTRAINT "convites_cadastro_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "convites_cadastro_status_check"
    CHECK ("status" IN ('active', 'revoked')),
  CONSTRAINT "convites_cadastro_perfil_check"
    CHECK ("perfil_atribuido" IN ('administrador_geral', 'instrutor', 'participante')),
  CONSTRAINT "convites_cadastro_usos_check"
    CHECK ("max_usos" > 0 AND "usos_realizados" >= 0 AND "usos_realizados" <= "max_usos")
);

CREATE TABLE "usos_convites_cadastro" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "convite_id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "usado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" VARCHAR(80),
  "user_agent" VARCHAR(280),
  CONSTRAINT "usos_convites_cadastro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convites_cadastro_token_hash_key" ON "convites_cadastro"("token_hash");
CREATE INDEX "convites_cadastro_status_expira_em_idx" ON "convites_cadastro"("status", "expira_em");
CREATE INDEX "convites_cadastro_perfil_atribuido_idx" ON "convites_cadastro"("perfil_atribuido");
CREATE INDEX "usos_convites_cadastro_convite_id_idx" ON "usos_convites_cadastro"("convite_id");
CREATE INDEX "usos_convites_cadastro_usuario_id_idx" ON "usos_convites_cadastro"("usuario_id");

ALTER TABLE "convites_cadastro" ADD CONSTRAINT "convites_cadastro_criado_por_usuario_id_fkey"
  FOREIGN KEY ("criado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "convites_cadastro" ADD CONSTRAINT "convites_cadastro_revogado_por_usuario_id_fkey"
  FOREIGN KEY ("revogado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usos_convites_cadastro" ADD CONSTRAINT "usos_convites_cadastro_convite_id_fkey"
  FOREIGN KEY ("convite_id") REFERENCES "convites_cadastro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usos_convites_cadastro" ADD CONSTRAINT "usos_convites_cadastro_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "permissoes" ("id", "codigo", "descricao", "categoria") VALUES
  (gen_random_uuid(), 'invite.view', 'Visualizar links de cadastro', 'Convites'),
  (gen_random_uuid(), 'invite.create_student', 'Gerar link para aluno', 'Convites'),
  (gen_random_uuid(), 'invite.create_instructor', 'Gerar link para instrutor', 'Convites'),
  (gen_random_uuid(), 'invite.create_admin', 'Gerar link para administrador', 'Convites'),
  (gen_random_uuid(), 'invite.revoke', 'Revogar links de cadastro', 'Convites'),
  (gen_random_uuid(), 'invite.manage', 'Gerenciar links de cadastro', 'Convites')
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
SELECT perfil.id, permissao.id FROM "perfis" perfil CROSS JOIN "permissoes" permissao
WHERE perfil.nome = 'administrador_geral' AND permissao.codigo LIKE 'invite.%'
ON CONFLICT DO NOTHING;

INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
SELECT perfil.id, permissao.id FROM "perfis" perfil CROSS JOIN "permissoes" permissao
WHERE perfil.nome = 'gestor_labc' AND permissao.codigo = ANY(ARRAY[
  'invite.view', 'invite.create_student', 'invite.create_instructor'
])
ON CONFLICT DO NOTHING;

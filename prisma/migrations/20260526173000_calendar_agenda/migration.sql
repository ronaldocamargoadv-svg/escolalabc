CREATE TABLE "eventos_agenda" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" VARCHAR(40) NOT NULL,
  "inicio_em" TIMESTAMP(3) NOT NULL,
  "fim_em" TIMESTAMP(3) NOT NULL,
  "local" TEXT,
  "link_online" TEXT,
  "curso_id" UUID,
  "turma_id" UUID,
  "encontro_id" UUID,
  "usuario_responsavel_id" UUID NOT NULL,
  "visibilidade" VARCHAR(20) NOT NULL DEFAULT 'private',
  "origem" VARCHAR(30) NOT NULL DEFAULT 'manual',
  "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  "lembrete_minutos" INTEGER,
  "sincronizar" BOOLEAN NOT NULL DEFAULT false,
  "provedor_externo" VARCHAR(20) NOT NULL DEFAULT 'none',
  "evento_externo_id" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eventos_agenda_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "eventos_agenda_periodo_check" CHECK ("fim_em" > "inicio_em"),
  CONSTRAINT "eventos_agenda_visibilidade_check" CHECK ("visibilidade" IN ('private', 'course', 'class', 'institutional')),
  CONSTRAINT "eventos_agenda_status_check" CHECK ("status" IN ('scheduled', 'completed', 'cancelled'))
);

CREATE TABLE "configuracoes_integracao_agenda" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id" UUID NOT NULL,
  "provedor" VARCHAR(20) NOT NULL DEFAULT 'none',
  "habilitada" BOOLEAN NOT NULL DEFAULT false,
  "direcao_sincronizacao" VARCHAR(20) NOT NULL DEFAULT 'export_only',
  "sincronizar_eventos_curso" BOOLEAN NOT NULL DEFAULT true,
  "sincronizar_eventos_pessoais" BOOLEAN NOT NULL DEFAULT false,
  "ultima_sincronizacao_em" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "configuracoes_integracao_agenda_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "configuracoes_agenda_provedor_check" CHECK ("provedor" IN ('none', 'google', 'outlook', 'apple', 'ics')),
  CONSTRAINT "configuracoes_agenda_direcao_check" CHECK ("direcao_sincronizacao" IN ('export_only', 'import_only', 'two_way'))
);

CREATE INDEX "eventos_agenda_inicio_em_idx" ON "eventos_agenda"("inicio_em");
CREATE INDEX "eventos_agenda_usuario_responsavel_id_idx" ON "eventos_agenda"("usuario_responsavel_id");
CREATE INDEX "eventos_agenda_curso_id_idx" ON "eventos_agenda"("curso_id");
CREATE INDEX "eventos_agenda_turma_id_idx" ON "eventos_agenda"("turma_id");
CREATE UNIQUE INDEX "configuracoes_integracao_agenda_usuario_id_key"
  ON "configuracoes_integracao_agenda"("usuario_id");

ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_usuario_responsavel_id_fkey"
  FOREIGN KEY ("usuario_responsavel_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_curso_id_fkey"
  FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_turma_id_fkey"
  FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_encontro_id_fkey"
  FOREIGN KEY ("encontro_id") REFERENCES "encontros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "configuracoes_integracao_agenda" ADD CONSTRAINT "configuracoes_integracao_agenda_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "permissoes" ("id", "codigo", "descricao", "categoria") VALUES
  (gen_random_uuid(), 'calendar.view_own', 'Visualizar a própria agenda', 'Agenda'),
  (gen_random_uuid(), 'calendar.create_own', 'Criar compromissos pessoais', 'Agenda'),
  (gen_random_uuid(), 'calendar.edit_own', 'Editar compromissos pessoais', 'Agenda'),
  (gen_random_uuid(), 'calendar.delete_own', 'Excluir compromissos pessoais', 'Agenda'),
  (gen_random_uuid(), 'calendar.view_course', 'Visualizar agenda de cursos autorizados', 'Agenda'),
  (gen_random_uuid(), 'calendar.view_class', 'Visualizar agenda de turmas autorizadas', 'Agenda'),
  (gen_random_uuid(), 'calendar.create_class_event', 'Criar eventos de turmas autorizadas', 'Agenda'),
  (gen_random_uuid(), 'calendar.edit_class_event', 'Editar eventos de turmas autorizadas', 'Agenda'),
  (gen_random_uuid(), 'calendar.view_institutional', 'Visualizar agenda institucional', 'Agenda'),
  (gen_random_uuid(), 'calendar.create_institutional', 'Criar eventos institucionais', 'Agenda'),
  (gen_random_uuid(), 'calendar.edit_institutional', 'Editar eventos institucionais', 'Agenda'),
  (gen_random_uuid(), 'calendar.delete_institutional', 'Excluir eventos institucionais', 'Agenda'),
  (gen_random_uuid(), 'calendar.export', 'Exportar agenda em formato iCalendar', 'Agenda'),
  (gen_random_uuid(), 'calendar.integration_configure', 'Configurar integração da própria agenda', 'Agenda'),
  (gen_random_uuid(), 'calendar.integration_enable', 'Ativar integração da própria agenda', 'Agenda'),
  (gen_random_uuid(), 'calendar.integration_disable', 'Desativar integração da própria agenda', 'Agenda')
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
SELECT perfil.id, permissao.id FROM "perfis" perfil CROSS JOIN "permissoes" permissao
WHERE perfil.nome = 'administrador_geral' AND permissao.codigo LIKE 'calendar.%'
ON CONFLICT DO NOTHING;

INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
SELECT perfil.id, permissao.id FROM "perfis" perfil CROSS JOIN "permissoes" permissao
WHERE perfil.nome = 'gestor_labc' AND permissao.codigo = ANY(ARRAY[
  'calendar.view_own', 'calendar.create_own', 'calendar.edit_own', 'calendar.delete_own',
  'calendar.view_course', 'calendar.view_class', 'calendar.view_institutional',
  'calendar.create_institutional', 'calendar.edit_institutional', 'calendar.delete_institutional',
  'calendar.export', 'calendar.integration_configure', 'calendar.integration_enable', 'calendar.integration_disable'
])
ON CONFLICT DO NOTHING;

INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
SELECT perfil.id, permissao.id FROM "perfis" perfil CROSS JOIN "permissoes" permissao
WHERE perfil.nome = 'instrutor' AND permissao.codigo = ANY(ARRAY[
  'calendar.view_own', 'calendar.create_own', 'calendar.edit_own', 'calendar.delete_own',
  'calendar.view_course', 'calendar.view_class', 'calendar.view_institutional',
  'calendar.create_class_event', 'calendar.edit_class_event', 'calendar.export',
  'calendar.integration_configure', 'calendar.integration_enable', 'calendar.integration_disable'
])
ON CONFLICT DO NOTHING;

INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
SELECT perfil.id, permissao.id FROM "perfis" perfil CROSS JOIN "permissoes" permissao
WHERE perfil.nome = 'participante' AND permissao.codigo = ANY(ARRAY[
  'calendar.view_own', 'calendar.create_own', 'calendar.edit_own', 'calendar.delete_own',
  'calendar.view_course', 'calendar.view_institutional', 'calendar.export',
  'calendar.integration_configure', 'calendar.integration_enable', 'calendar.integration_disable'
])
ON CONFLICT DO NOTHING;

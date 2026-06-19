CREATE TABLE IF NOT EXISTS "requisitos_certificacao" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "curso_id" UUID NOT NULL,
  "turma_id" UUID NOT NULL,
  "exigir_frequencia" BOOLEAN NOT NULL DEFAULT true,
  "frequencia_minima" DECIMAL(5,2) NOT NULL DEFAULT 75,
  "exigir_progresso" BOOLEAN NOT NULL DEFAULT true,
  "progresso_minimo" DECIMAL(5,2) NOT NULL DEFAULT 100,
  "exigir_avaliacao_curso" BOOLEAN NOT NULL DEFAULT false,
  "exigir_questionario" BOOLEAN NOT NULL DEFAULT false,
  "nota_minima_questionario" DECIMAL(5,2) NOT NULL DEFAULT 70,
  "exigir_avaliacao_instrutor" BOOLEAN NOT NULL DEFAULT false,
  "exigir_aprovacao_instrutor" BOOLEAN NOT NULL DEFAULT false,
  "emissao_automatica" BOOLEAN NOT NULL DEFAULT false,
  "liberacao_manual_admin" BOOLEAN NOT NULL DEFAULT true,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "requisitos_certificacao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "requisitos_certificacao_turma_id_key" UNIQUE ("turma_id"),
  CONSTRAINT "requisitos_certificacao_curso_id_fkey"
    FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "requisitos_certificacao_turma_id_fkey"
    FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "avaliacoes_turma_aluno" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "curso_id" UUID NOT NULL,
  "turma_id" UUID NOT NULL,
  "aluno_id" UUID NOT NULL,
  "expectativas" INTEGER NOT NULL,
  "relevancia_conteudo" INTEGER NOT NULL,
  "metodologia" INTEGER NOT NULL,
  "carga_horaria" INTEGER NOT NULL,
  "materiais" INTEGER NOT NULL,
  "dominio_instrutor" INTEGER NOT NULL,
  "clareza_instrutor" INTEGER NOT NULL,
  "participacao_instrutor" INTEGER NOT NULL,
  "exemplos_praticos" INTEGER NOT NULL,
  "aplicabilidade_servico_publico" INTEGER NOT NULL,
  "experiencia_plataforma" INTEGER NOT NULL,
  "contribuicao_inovacao" INTEGER NOT NULL,
  "nps_nota" INTEGER NOT NULL,
  "nps_motivo" TEXT,
  "principal_aprendizado" TEXT,
  "sugestao_melhoria" TEXT,
  "temas_futuros" TEXT,
  "intencao_aplicacao" TEXT,
  "submetido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "avaliacoes_turma_aluno_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "avaliacoes_turma_aluno_unique" UNIQUE ("turma_id", "aluno_id"),
  CONSTRAINT "avaliacoes_turma_aluno_score_check"
    CHECK (
      "expectativas" BETWEEN 1 AND 5 AND
      "relevancia_conteudo" BETWEEN 1 AND 5 AND
      "metodologia" BETWEEN 1 AND 5 AND
      "carga_horaria" BETWEEN 1 AND 5 AND
      "materiais" BETWEEN 1 AND 5 AND
      "dominio_instrutor" BETWEEN 1 AND 5 AND
      "clareza_instrutor" BETWEEN 1 AND 5 AND
      "participacao_instrutor" BETWEEN 1 AND 5 AND
      "exemplos_praticos" BETWEEN 1 AND 5 AND
      "aplicabilidade_servico_publico" BETWEEN 1 AND 5 AND
      "experiencia_plataforma" BETWEEN 1 AND 5 AND
      "contribuicao_inovacao" BETWEEN 1 AND 5 AND
      "nps_nota" BETWEEN 0 AND 10
    ),
  CONSTRAINT "avaliacoes_turma_aluno_curso_id_fkey"
    FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "avaliacoes_turma_aluno_turma_id_fkey"
    FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "avaliacoes_turma_aluno_aluno_id_fkey"
    FOREIGN KEY ("aluno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "avaliacoes_aluno_instrutor" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "curso_id" UUID NOT NULL,
  "turma_id" UUID NOT NULL,
  "aluno_id" UUID NOT NULL,
  "instrutor_id" UUID NOT NULL,
  "participacao" INTEGER NOT NULL,
  "assiduidade" INTEGER NOT NULL,
  "interesse" INTEGER NOT NULL,
  "compreensao" INTEGER NOT NULL,
  "atividades" INTEGER NOT NULL,
  "debates" INTEGER NOT NULL,
  "aplicacao_pratica" INTEGER NOT NULL,
  "colaboracao" INTEGER NOT NULL,
  "evolucao" INTEGER NOT NULL,
  "aptidao_certificacao" INTEGER NOT NULL,
  "resultado_final" VARCHAR(40) NOT NULL,
  "feedback_publico" TEXT,
  "observacoes_internas" TEXT,
  "recomendacao" TEXT,
  "submetido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "avaliacoes_aluno_instrutor_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "avaliacoes_aluno_instrutor_unique" UNIQUE ("turma_id", "aluno_id"),
  CONSTRAINT "avaliacoes_aluno_instrutor_score_check"
    CHECK (
      "participacao" BETWEEN 1 AND 5 AND
      "assiduidade" BETWEEN 1 AND 5 AND
      "interesse" BETWEEN 1 AND 5 AND
      "compreensao" BETWEEN 1 AND 5 AND
      "atividades" BETWEEN 1 AND 5 AND
      "debates" BETWEEN 1 AND 5 AND
      "aplicacao_pratica" BETWEEN 1 AND 5 AND
      "colaboracao" BETWEEN 1 AND 5 AND
      "evolucao" BETWEEN 1 AND 5 AND
      "aptidao_certificacao" BETWEEN 1 AND 5
    ),
  CONSTRAINT "avaliacoes_aluno_instrutor_resultado_check"
    CHECK ("resultado_final" IN ('apto', 'apto_com_ressalvas', 'nao_apto', 'pendente_atividade', 'pendente_frequencia', 'pendente_avaliacao_final')),
  CONSTRAINT "avaliacoes_aluno_instrutor_curso_id_fkey"
    FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "avaliacoes_aluno_instrutor_turma_id_fkey"
    FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "avaliacoes_aluno_instrutor_aluno_id_fkey"
    FOREIGN KEY ("aluno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "avaliacoes_aluno_instrutor_instrutor_id_fkey"
    FOREIGN KEY ("instrutor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "questionarios" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "curso_id" UUID NOT NULL,
  "turma_id" UUID NOT NULL,
  "aula_id" UUID,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  "abre_em" TIMESTAMP(3),
  "fecha_em" TIMESTAMP(3),
  "tempo_limite_minutos" INTEGER,
  "max_tentativas" INTEGER NOT NULL DEFAULT 1,
  "nota_minima" DECIMAL(5,2) NOT NULL DEFAULT 70,
  "obrigatorio_certificado" BOOLEAN NOT NULL DEFAULT true,
  "exibir_gabarito" BOOLEAN NOT NULL DEFAULT false,
  "exibir_feedback" BOOLEAN NOT NULL DEFAULT true,
  "criado_por_usuario_id" UUID NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "questionarios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "questionarios_status_check" CHECK ("status" IN ('rascunho', 'publicado', 'encerrado')),
  CONSTRAINT "questionarios_curso_id_fkey"
    FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "questionarios_turma_id_fkey"
    FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "questionarios_aula_id_fkey"
    FOREIGN KEY ("aula_id") REFERENCES "encontros"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "questionarios_criado_por_usuario_id_fkey"
    FOREIGN KEY ("criado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "questoes_questionario" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "questionario_id" UUID NOT NULL,
  "tipo" VARCHAR(30) NOT NULL,
  "enunciado" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "pontos" DECIMAL(6,2) NOT NULL DEFAULT 1,
  "feedback_correto" TEXT,
  "feedback_incorreto" TEXT,
  "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "questoes_questionario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "questoes_questionario_tipo_check" CHECK ("tipo" IN ('single_choice', 'multiple_choice', 'true_false')),
  CONSTRAINT "questoes_questionario_questionario_id_fkey"
    FOREIGN KEY ("questionario_id") REFERENCES "questionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "opcoes_questionario" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "questao_id" UUID NOT NULL,
  "texto" TEXT NOT NULL,
  "correta" BOOLEAN NOT NULL DEFAULT false,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "opcoes_questionario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "opcoes_questionario_questao_id_fkey"
    FOREIGN KEY ("questao_id") REFERENCES "questoes_questionario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "tentativas_questionario" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "questionario_id" UUID NOT NULL,
  "aluno_id" UUID NOT NULL,
  "numero_tentativa" INTEGER NOT NULL,
  "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submetido_em" TIMESTAMP(3),
  "nota" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "status" VARCHAR(30) NOT NULL DEFAULT 'submetido',
  CONSTRAINT "tentativas_questionario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tentativas_questionario_unique" UNIQUE ("questionario_id", "aluno_id", "numero_tentativa"),
  CONSTRAINT "tentativas_questionario_status_check" CHECK ("status" IN ('em_andamento', 'submetido', 'aprovado', 'reprovado')),
  CONSTRAINT "tentativas_questionario_questionario_id_fkey"
    FOREIGN KEY ("questionario_id") REFERENCES "questionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tentativas_questionario_aluno_id_fkey"
    FOREIGN KEY ("aluno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "respostas_questionario" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tentativa_id" UUID NOT NULL,
  "questao_id" UUID NOT NULL,
  "opcoes_selecionadas" UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
  "correta" BOOLEAN NOT NULL DEFAULT false,
  "pontos_obtidos" DECIMAL(6,2) NOT NULL DEFAULT 0,
  CONSTRAINT "respostas_questionario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "respostas_questionario_tentativa_questao_key" UNIQUE ("tentativa_id", "questao_id"),
  CONSTRAINT "respostas_questionario_tentativa_id_fkey"
    FOREIGN KEY ("tentativa_id") REFERENCES "tentativas_questionario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "respostas_questionario_questao_id_fkey"
    FOREIGN KEY ("questao_id") REFERENCES "questoes_questionario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "avaliacoes_turma_aluno_turma_idx" ON "avaliacoes_turma_aluno" ("turma_id");
CREATE INDEX IF NOT EXISTS "avaliacoes_aluno_instrutor_turma_idx" ON "avaliacoes_aluno_instrutor" ("turma_id");
CREATE INDEX IF NOT EXISTS "questionarios_turma_status_idx" ON "questionarios" ("turma_id", "status");
CREATE INDEX IF NOT EXISTS "tentativas_questionario_aluno_idx" ON "tentativas_questionario" ("aluno_id");

INSERT INTO permissoes (id, codigo, descricao, categoria)
VALUES
  (gen_random_uuid(), 'evaluations.manage_all', 'Gerenciar avaliações de todas as turmas', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.view_all', 'Visualizar avaliações de todas as turmas', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.configure_certification', 'Configurar requisitos de certificação', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.reopen', 'Reabrir avaliações', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.export', 'Exportar avaliações', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.view_own_class', 'Visualizar avaliações das próprias turmas', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.view_course_feedback_own_class', 'Visualizar avaliação da turma vinculada', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.respond_course_feedback', 'Responder avaliação da turma', 'Avaliações'),
  (gen_random_uuid(), 'evaluations.view_own_results', 'Visualizar próprios resultados de avaliação', 'Avaliações'),
  (gen_random_uuid(), 'student_assessments.view_all', 'Visualizar avaliações de alunos', 'Avaliações'),
  (gen_random_uuid(), 'student_assessments.create_own_class', 'Avaliar alunos da turma vinculada', 'Avaliações'),
  (gen_random_uuid(), 'student_assessments.edit_own_class', 'Editar avaliações da turma vinculada', 'Avaliações'),
  (gen_random_uuid(), 'quizzes.manage_all', 'Gerenciar questionários de todas as turmas', 'Questionários'),
  (gen_random_uuid(), 'quizzes.create_own_class', 'Criar questionários da turma vinculada', 'Questionários'),
  (gen_random_uuid(), 'quizzes.edit_own_class', 'Editar questionários da turma vinculada', 'Questionários'),
  (gen_random_uuid(), 'quizzes.publish_own_class', 'Publicar questionários da turma vinculada', 'Questionários'),
  (gen_random_uuid(), 'quizzes.view_results_own_class', 'Ver resultados dos questionários da turma vinculada', 'Questionários'),
  (gen_random_uuid(), 'quizzes.respond', 'Responder questionários', 'Questionários'),
  (gen_random_uuid(), 'certification.request_release_own_class', 'Solicitar liberação de certificado da turma vinculada', 'Certificação'),
  (gen_random_uuid(), 'certification.view_own_requirements', 'Visualizar próprios requisitos de certificação', 'Certificação'),
  (gen_random_uuid(), 'certificates.override_release', 'Liberar certificado por exceção administrativa', 'Certificados')
ON CONFLICT (codigo) DO UPDATE
SET descricao = EXCLUDED.descricao,
    categoria = EXCLUDED.categoria;

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'administrador_geral'
  AND (
    perm.codigo LIKE 'evaluations.%'
    OR perm.codigo LIKE 'student_assessments.%'
    OR perm.codigo LIKE 'quizzes.%'
    OR perm.codigo IN ('certification.request_release_own_class', 'certification.view_own_requirements', 'certificates.override_release')
  )
ON CONFLICT DO NOTHING;

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
INNER JOIN permissoes perm ON perm.codigo IN (
  'evaluations.view_own_class',
  'evaluations.view_course_feedback_own_class',
  'student_assessments.create_own_class',
  'student_assessments.edit_own_class',
  'quizzes.create_own_class',
  'quizzes.edit_own_class',
  'quizzes.publish_own_class',
  'quizzes.view_results_own_class',
  'certification.request_release_own_class',
  'certification.view_own_requirements'
)
WHERE p.nome = 'instrutor'
ON CONFLICT DO NOTHING;

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
INNER JOIN permissoes perm ON perm.codigo IN (
  'evaluations.respond_course_feedback',
  'evaluations.view_own_results',
  'quizzes.respond',
  'certification.view_own_requirements'
)
WHERE p.nome = 'participante'
ON CONFLICT DO NOTHING;

import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";

export const permissionCatalog = [
  ["users.view", "Visualizar usuários", "Usuários"],
  ["users.create", "Criar usuários", "Usuários"],
  ["users.edit", "Editar usuários", "Usuários"],
  ["users.delete", "Excluir ou inativar usuários", "Usuários"],
  ["roles.view", "Visualizar perfis", "Perfis"],
  ["roles.create", "Criar perfis personalizados", "Perfis"],
  ["roles.edit", "Editar perfis", "Perfis"],
  ["roles.delete", "Excluir perfis personalizados", "Perfis"],
  ["permissions.manage", "Gerenciar permissões de perfis", "Perfis"],
  ["courses.view", "Visualizar cursos", "Cursos"],
  ["courses.create", "Criar cursos", "Cursos"],
  ["courses.edit", "Editar cursos", "Cursos"],
  ["courses.delete", "Excluir ou arquivar cursos", "Cursos"],
  ["courses.publish", "Publicar cursos", "Cursos"],
  ["classes.view", "Visualizar turmas e aulas", "Turmas"],
  ["classes.create", "Criar turmas e aulas", "Turmas"],
  ["classes.edit", "Editar turmas e aulas", "Turmas"],
  ["classes.delete", "Excluir ou cancelar turmas e aulas", "Turmas"],
  ["instructor.assignment.view", "Visualizar vínculos de Instrutores", "Instrutoria"],
  ["instructor.assignment.create", "Vincular Instrutores a turmas", "Instrutoria"],
  ["instructor.assignment.edit", "Editar vínculos de Instrutores", "Instrutoria"],
  ["instructor.assignment.remove", "Remover vínculos de Instrutores", "Instrutoria"],
  ["instructor.assignment.deactivate", "Encerrar vínculos de Instrutores", "Instrutoria"],
  ["instructor.view_own_classes", "Visualizar turmas vinculadas", "Instrutoria"],
  ["instructor.manage_own_lessons", "Gerenciar aulas da turma vinculada", "Instrutoria"],
  ["instructor.publish_materials_own_class", "Publicar materiais da turma vinculada", "Instrutoria"],
  ["instructor.view_students_own_class", "Visualizar alunos da turma vinculada", "Instrutoria"],
  ["instructor.manage_attendance_own_class", "Registrar frequência da turma vinculada", "Instrutoria"],
  ["instructor.view_progress_own_class", "Visualizar progresso da turma vinculada", "Instrutoria"],
  ["instructor.send_announcements_own_class", "Enviar comunicados da turma vinculada", "Instrutoria"],
  ["instructor.request_certification_own_class", "Solicitar certificação da turma vinculada", "Instrutoria"],
  ["materials.view", "Visualizar materiais publicados", "Materiais"],
  ["materials.view_own_class", "Visualizar materiais das turmas vinculadas", "Materiais"],
  ["materials.create_own_class", "Adicionar materiais às aulas vinculadas", "Materiais"],
  ["materials.edit_own_class", "Editar materiais das aulas vinculadas", "Materiais"],
  ["materials.delete_own_class", "Excluir materiais das aulas vinculadas", "Materiais"],
  ["materials.publish_own_class", "Publicar materiais das aulas vinculadas", "Materiais"],
  ["materials.manage_all", "Gerenciar materiais de todas as aulas", "Materiais"],
  ["enrollments.view", "Consultar inscrições", "Inscrições"],
  ["enrollments.create", "Criar inscrições", "Inscrições"],
  ["enrollments.manage", "Gerenciar inscrições", "Inscrições"],
  ["attendance.view", "Visualizar frequência", "Frequência"],
  ["attendance.manage", "Registrar ou editar frequência", "Frequência"],
  ["certificates.view", "Visualizar certificados", "Certificados"],
  ["certificates.issue", "Emitir ou reemitir certificados", "Certificados"],
  ["certificates.cancel", "Cancelar certificados", "Certificados"],
  ["certificates.download", "Baixar certificados", "Certificados"],
  ["certificates.override_release", "Liberar certificados por exceção administrativa", "Certificados"],
  ["reports.view", "Visualizar relatórios", "Relatórios"],
  ["reports.export", "Exportar relatórios", "Relatórios"],
  ["progress.view_all", "Visualizar progresso de todos os alunos", "Engajamento"],
  ["progress.view_own", "Visualizar o próprio progresso", "Engajamento"],
  ["progress.view_courses_managed", "Visualizar progresso das próprias turmas", "Engajamento"],
  ["progress.export", "Exportar acompanhamento de progresso", "Engajamento"],
  ["learning_events.view", "Visualizar eventos de aprendizagem", "Engajamento"],
  ["learning_events.manage", "Gerenciar eventos de aprendizagem", "Engajamento"],
  ["evaluations.manage_all", "Gerenciar avaliações de todas as turmas", "Avaliações"],
  ["evaluations.view_all", "Visualizar avaliações de todas as turmas", "Avaliações"],
  ["evaluations.configure_certification", "Configurar requisitos de certificação", "Avaliações"],
  ["evaluations.reopen", "Reabrir avaliações", "Avaliações"],
  ["evaluations.export", "Exportar avaliações", "Avaliações"],
  ["evaluations.view_own_class", "Visualizar avaliações das próprias turmas", "Avaliações"],
  ["evaluations.view_course_feedback_own_class", "Visualizar avaliação da turma vinculada", "Avaliações"],
  ["evaluations.respond_course_feedback", "Responder avaliação da turma", "Avaliações"],
  ["evaluations.view_own_results", "Visualizar próprios resultados de avaliação", "Avaliações"],
  ["student_assessments.view_all", "Visualizar avaliações de alunos", "Avaliações"],
  ["student_assessments.create_own_class", "Avaliar alunos da turma vinculada", "Avaliações"],
  ["student_assessments.edit_own_class", "Editar avaliações da turma vinculada", "Avaliações"],
  ["quizzes.manage_all", "Gerenciar questionários de todas as turmas", "Questionários"],
  ["quizzes.create_own_class", "Criar questionários da turma vinculada", "Questionários"],
  ["quizzes.edit_own_class", "Editar questionários da turma vinculada", "Questionários"],
  ["quizzes.publish_own_class", "Publicar questionários da turma vinculada", "Questionários"],
  ["quizzes.view_results_own_class", "Ver resultados dos questionários da turma vinculada", "Questionários"],
  ["quizzes.respond", "Responder questionários", "Questionários"],
  ["certification.request_release_own_class", "Solicitar liberação de certificado da turma vinculada", "Certificação"],
  ["certification.view_own_requirements", "Visualizar próprios requisitos de certificação", "Certificação"],
  ["calendar.view_own", "Visualizar a própria agenda", "Agenda"],
  ["calendar.create_own", "Criar compromissos pessoais", "Agenda"],
  ["calendar.edit_own", "Editar compromissos pessoais", "Agenda"],
  ["calendar.delete_own", "Excluir compromissos pessoais", "Agenda"],
  ["calendar.view_course", "Visualizar agenda de cursos autorizados", "Agenda"],
  ["calendar.view_class", "Visualizar agenda de turmas autorizadas", "Agenda"],
  ["calendar.create_class_event", "Criar eventos de turmas autorizadas", "Agenda"],
  ["calendar.edit_class_event", "Editar eventos de turmas autorizadas", "Agenda"],
  ["calendar.view_institutional", "Visualizar agenda institucional", "Agenda"],
  ["calendar.create_institutional", "Criar eventos institucionais", "Agenda"],
  ["calendar.edit_institutional", "Editar eventos institucionais", "Agenda"],
  ["calendar.delete_institutional", "Excluir eventos institucionais", "Agenda"],
  ["calendar.export", "Exportar agenda em formato iCalendar", "Agenda"],
  ["calendar.integration_configure", "Configurar integração da própria agenda", "Agenda"],
  ["calendar.integration_enable", "Ativar integração da própria agenda", "Agenda"],
  ["calendar.integration_disable", "Desativar integração da própria agenda", "Agenda"],
  ["invite.view", "Visualizar links de cadastro", "Convites"],
  ["invite.create_student", "Gerar link para aluno", "Convites"],
  ["invite.create_instructor", "Gerar link para instrutor", "Convites"],
  ["invite.create_admin", "Gerar link para administrador", "Convites"],
  ["invite.revoke", "Revogar links de cadastro", "Convites"],
  ["invite.manage", "Gerenciar links de cadastro", "Convites"],
  ["forums.view", "Visualizar fórum", "Fórum"],
  ["forums.post", "Postar em fórum", "Fórum"],
  ["forums.moderate", "Moderar fórum", "Fórum"],
  ["settings.manage", "Gerenciar configurações", "Configurações"],
  ["audit.view", "Visualizar auditoria", "Auditoria"]
] as const;

export type PermissionCode = (typeof permissionCatalog)[number][0];

export const allPermissions = permissionCatalog.map(([code]) => code);

export const defaultProfilePermissions: Record<string, PermissionCode[]> = {
  administrador_geral: allPermissions,
  gestor_labc: [
    "users.view",
    "courses.view",
    "courses.create",
    "courses.edit",
    "courses.publish",
    "classes.view",
    "classes.create",
    "classes.edit",
    "instructor.assignment.view",
    "instructor.assignment.create",
    "instructor.assignment.edit",
    "instructor.assignment.remove",
    "instructor.assignment.deactivate",
    "materials.manage_all",
    "enrollments.view",
    "enrollments.create",
    "enrollments.manage",
    "attendance.view",
    "attendance.manage",
    "certificates.view",
    "certificates.issue",
    "certificates.cancel",
    "certificates.download",
    "certificates.override_release",
    "reports.view",
    "reports.export",
    "progress.view_all",
    "progress.view_own",
    "progress.view_courses_managed",
    "progress.export",
    "learning_events.view",
    "learning_events.manage",
    "evaluations.manage_all",
    "evaluations.view_all",
    "evaluations.configure_certification",
    "evaluations.reopen",
    "evaluations.export",
    "evaluations.view_own_class",
    "evaluations.view_course_feedback_own_class",
    "evaluations.respond_course_feedback",
    "evaluations.view_own_results",
    "student_assessments.view_all",
    "student_assessments.create_own_class",
    "student_assessments.edit_own_class",
    "quizzes.manage_all",
    "quizzes.create_own_class",
    "quizzes.edit_own_class",
    "quizzes.publish_own_class",
    "quizzes.view_results_own_class",
    "quizzes.respond",
    "certification.request_release_own_class",
    "certification.view_own_requirements",
    "calendar.view_own",
    "calendar.create_own",
    "calendar.edit_own",
    "calendar.delete_own",
    "calendar.view_course",
    "calendar.view_class",
    "calendar.view_institutional",
    "calendar.create_institutional",
    "calendar.edit_institutional",
    "calendar.delete_institutional",
    "calendar.export",
    "calendar.integration_configure",
    "calendar.integration_enable",
    "calendar.integration_disable",
    "invite.view",
    "invite.create_student",
    "invite.create_instructor",
    "forums.view",
    "forums.post",
    "forums.moderate",
    "audit.view"
  ],
  instrutor: [
    "courses.view",
    "classes.view",
    "classes.create",
    "classes.edit",
    "instructor.view_own_classes",
    "instructor.manage_own_lessons",
    "instructor.publish_materials_own_class",
    "instructor.view_students_own_class",
    "instructor.manage_attendance_own_class",
    "instructor.view_progress_own_class",
    "instructor.send_announcements_own_class",
    "instructor.request_certification_own_class",
    "materials.view_own_class",
    "materials.create_own_class",
    "materials.edit_own_class",
    "materials.delete_own_class",
    "materials.publish_own_class",
    "enrollments.view",
    "attendance.view",
    "attendance.manage",
    "certificates.view",
    "progress.view_courses_managed",
    "learning_events.view",
    "calendar.view_own",
    "calendar.create_own",
    "calendar.edit_own",
    "calendar.delete_own",
    "calendar.view_course",
    "calendar.view_class",
    "calendar.view_institutional",
    "calendar.create_class_event",
    "calendar.edit_class_event",
    "calendar.export",
    "calendar.integration_configure",
    "calendar.integration_enable",
    "calendar.integration_disable",
    "forums.view",
    "forums.post",
    "reports.view",
    "evaluations.view_own_class",
    "evaluations.view_course_feedback_own_class",
    "student_assessments.create_own_class",
    "student_assessments.edit_own_class",
    "quizzes.create_own_class",
    "quizzes.edit_own_class",
    "quizzes.publish_own_class",
    "quizzes.view_results_own_class",
    "certification.request_release_own_class",
    "certification.view_own_requirements"
  ],
  participante: [
    "courses.view",
    "classes.view",
    "materials.view",
    "enrollments.create",
    "attendance.view",
    "certificates.view",
    "certificates.download",
    "progress.view_own",
    "calendar.view_own",
    "calendar.create_own",
    "calendar.edit_own",
    "calendar.delete_own",
    "calendar.view_course",
    "calendar.view_institutional",
    "calendar.export",
    "calendar.integration_configure",
    "calendar.integration_enable",
    "calendar.integration_disable",
    "forums.view",
    "forums.post",
    "evaluations.respond_course_feedback",
    "evaluations.view_own_results",
    "quizzes.respond",
    "certification.view_own_requirements"
  ],
  moderador: ["forums.view", "forums.post", "forums.moderate"],
  convidado: ["courses.view"]
};

export type ProfilePermissionSummary = {
  id: string;
  nome: string;
  descricao: string | null;
  sistema: boolean;
  permissoes: string[];
};

export class ProfileMutationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 422) {
    super(message);
    this.name = "ProfileMutationError";
    this.code = code;
    this.status = status;
  }
}

export function hasPermission(
  user: { permissoes?: string[]; perfis: string[] },
  permission: string
) {
  return (
    user.permissoes?.includes(permission) ||
    user.perfis.includes("administrador_geral")
  );
}

export function hasAnyPermission(
  user: { permissoes?: string[]; perfis: string[] },
  permissions: string[]
) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export async function ensurePermissionCatalog() {
  const db = getDb();

  for (const [codigo, descricao, categoria] of permissionCatalog) {
    await db.query(
      `
        INSERT INTO permissoes (id, codigo, descricao, categoria)
        VALUES (gen_random_uuid(), $1, $2, $3)
        ON CONFLICT (codigo)
        DO UPDATE SET descricao = EXCLUDED.descricao,
                      categoria = EXCLUDED.categoria
      `,
      [codigo, descricao, categoria]
    );
  }
}

export async function listProfilesWithPermissions(): Promise<
  ProfilePermissionSummary[]
> {
  await ensurePermissionCatalog();
  const db = getDb();
  const result = await db.query(`
    SELECT
      p.id,
      p.nome,
      p.descricao,
      p.sistema,
      COALESCE(
        array_agg(perm.codigo ORDER BY perm.codigo)
          FILTER (WHERE perm.codigo IS NOT NULL),
        '{}'
      ) AS permissoes
    FROM perfis p
    LEFT JOIN perfil_permissoes pp ON pp.perfil_id = p.id
    LEFT JOIN permissoes perm ON perm.id = pp.permissao_id
    GROUP BY p.id
    ORDER BY p.sistema DESC, p.nome ASC
  `);

  return result.rows.map((item) => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    sistema: Boolean(item.sistema),
    permissoes: item.permissoes
  }));
}

export async function createProfile(input: {
  nome: string;
  descricao?: string;
  permissoes: string[];
}) {
  await ensurePermissionCatalog();
  const db = getDb();
  const nome = input.nome.trim();
  const existing = await db.query("SELECT id FROM perfis WHERE nome = $1", [nome]);

  if (existing.rows[0]) {
    throw new ProfileMutationError(
      "PROFILE_ALREADY_EXISTS",
      "Já existe um perfil com este nome.",
      409
    );
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        INSERT INTO perfis (id, nome, descricao, sistema)
        VALUES (gen_random_uuid(), $1, $2, false)
        RETURNING id, nome, descricao, sistema
      `,
      [nome, input.descricao?.trim() || null]
    );
    const profile = result.rows[0];

    await replaceProfilePermissions(profile.id, input.permissoes, client);

    await client.query("COMMIT");

    return profile;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProfilePermissions(
  profileId: string,
  permissions: string[]
) {
  await setProfilePermissions(profileId, permissions);
}

export async function deleteCustomProfile(profileId: string) {
  const db = getDb();
  const assigned = await db.query(
    "SELECT 1 FROM usuario_perfis WHERE perfil_id = $1 LIMIT 1",
    [profileId]
  );

  if (assigned.rows[0]) {
    throw new ProfileMutationError(
      "PROFILE_IN_USE",
      "Remova este perfil dos usuários antes de excluí-lo.",
      409
    );
  }

  const result = await db.query(
    `
      DELETE FROM perfis
      WHERE id = $1
        AND sistema = false
      RETURNING id, nome
    `,
    [profileId]
  );

  return result.rows[0] as { id: string; nome: string } | undefined;
}

async function setProfilePermissions(profileId: string, permissions: string[]) {
  await ensurePermissionCatalog();
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await replaceProfilePermissions(profileId, permissions, client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function replaceProfilePermissions(
  profileId: string,
  permissions: string[],
  client: PoolClient
) {
  const uniquePermissions = [...new Set(permissions)].filter((permission) =>
    allPermissions.includes(permission as PermissionCode)
  );

  await client.query("DELETE FROM perfil_permissoes WHERE perfil_id = $1", [
    profileId
  ]);

  if (!uniquePermissions.length) {
    return;
  }

  await client.query(
    `
      INSERT INTO perfil_permissoes (perfil_id, permissao_id)
      SELECT $1, perm.id
      FROM permissoes perm
      WHERE perm.codigo = ANY($2::text[])
      ON CONFLICT DO NOTHING
    `,
    [profileId, uniquePermissions]
  );
}

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { hasAnyPermission, hasPermission } from "@/lib/permissions";
import { getSessionPayload } from "@/lib/session";

export type CurrentUser = {
  id: string;
  nome: string;
  email: string;
  perfis: string[];
  permissoes: string[];
};

export const ROLES = {
  admin: "administrador_geral",
  gestor: "gestor_labc",
  instrutor: "instrutor",
  participante: "participante",
  moderador: "moderador",
  convidado: "convidado"
} as const;

export const educationManagerRoles = [ROLES.admin, ROLES.gestor];
export const attendanceManagerRoles = [
  ROLES.admin,
  ROLES.gestor,
  ROLES.instrutor
];
export const auditViewerRoles = [ROLES.admin, ROLES.gestor];

export function hasAnyRole(user: CurrentUser, roles: string[]) {
  return roles.some((role) => user.perfis.includes(role));
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionPayload();

  if (!session) {
    return null;
  }

  const db = getDb();
  const result = await db.query(
    `
      SELECT
        u.id,
        u.nome,
        u.email,
        COALESCE(array_agg(DISTINCT p.nome) FILTER (WHERE p.nome IS NOT NULL), '{}') AS perfis,
        COALESCE(
          array_agg(DISTINCT perm.codigo) FILTER (WHERE perm.codigo IS NOT NULL),
          '{}'
        ) AS permissoes
      FROM usuarios u
      LEFT JOIN usuario_perfis up ON up.usuario_id = u.id
      LEFT JOIN perfis p ON p.id = up.perfil_id
      LEFT JOIN perfil_permissoes pp ON pp.perfil_id = p.id
      LEFT JOIN permissoes perm ON perm.id = pp.permissao_id
      WHERE u.id = $1 AND u.status = 'ativo'
      GROUP BY u.id
      LIMIT 1
    `,
    [session.userId]
  );

  return result.rows[0] ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAnyRole(roles: string[]) {
  const user = await requireCurrentUser();

  if (!hasAnyRole(user, roles)) {
    redirect("/sem-permissao");
  }

  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireCurrentUser();

  if (!hasPermission(user, permission)) {
    redirect("/sem-permissao");
  }

  return user;
}

export async function requireAnyPermission(permissions: string[]) {
  const user = await requireCurrentUser();

  if (!hasAnyPermission(user, permissions)) {
    redirect("/sem-permissao");
  }

  return user;
}

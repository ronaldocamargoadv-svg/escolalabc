import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { PoolClient } from "pg";
import { ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { LattesValidationError, normalizeLattesUrl } from "@/lib/lattes";
import { hasPermission } from "@/lib/permissions";
import { createInstructorAssignmentWithClient } from "@/lib/instructor-assignments";

export const inviteRoles = [ROLES.participante, ROLES.instrutor, ROLES.admin] as const;
export type InviteRole = (typeof inviteRoles)[number];
export type InviteStatus =
  | "active"
  | "expired"
  | "revoked"
  | "used"
  | "limit_reached";

export type InviteSummary = {
  id: string;
  role: InviteRole;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  maxUses: number;
  usedCount: number;
  invitedEmail: string | null;
  notes: string | null;
  creatorName: string;
  tokenPrefix: string;
  registrationUrl: string | null;
  uses: Array<{ name: string; email: string; usedAt: string }>;
  turmaInstrutoriaNome: string | null;
  cursoInstrutoriaNome: string | null;
};

export type PublicInvite = {
  id?: string;
  role?: InviteRole;
  status: InviteStatus | "invalid";
  expiresAt?: string;
  invitedEmail?: string | null;
  turmaInstrutoriaNome?: string | null;
  cursoInstrutoriaNome?: string | null;
};

type CreateInviteInput = {
  role: InviteRole;
  maxUses: number;
  expiresInHours: number;
  invitedEmail?: string;
  notes?: string;
  confirmedAdministrativeRisk?: boolean;
  turmaInstrutoriaId?: string;
};

type RegisterInviteInput = {
  token: string;
  name: string;
  cpf: string;
  email: string;
  password: string;
  phone?: string;
  organization?: string;
  position?: string;
  lattesUrl?: string;
  ipAddress?: string;
  userAgent?: string;
};

type InviteRow = {
  id: string;
  token_hash: string;
  token_cifrado: string;
  token_prefixo: string;
  perfil_atribuido: InviteRole;
  criado_por_usuario_id: string;
  max_usos: number;
  usos_realizados: number;
  expira_em: Date;
  status: "active" | "revoked";
  email_convidado: string | null;
  observacao: string | null;
  turma_instrutoria_id: string | null;
};

export class InviteError extends Error {
  code: string;
  status: number;
  inviteId?: string;

  constructor(code: string, message: string, status = 422, inviteId?: string) {
    super(message);
    this.name = "InviteError";
    this.code = code;
    this.status = status;
    this.inviteId = inviteId;
  }
}

function encryptionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET obrigatório em produção.");
  }

  return secret ?? "dev-secret-change-me";
}

function tokenKey() {
  return crypto.createHash("sha256").update(encryptionSecret()).digest();
}

export function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function encryptInviteToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", tokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((item) => item.toString("base64url")).join(".");
}

function decryptInviteToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Token cifrado inválido.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    tokenKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

function baseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function buildRegistrationUrl(token: string) {
  return `${baseUrl()}/cadastro/convite/${token}`;
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || undefined;
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function statusForInvite(invite: {
  status: string;
  expira_em: Date | string;
  max_usos: number;
  usos_realizados: number;
}): InviteStatus {
  if (invite.status === "revoked") {
    return "revoked";
  }

  if (new Date(invite.expira_em).getTime() <= Date.now()) {
    return "expired";
  }

  if (invite.usos_realizados >= invite.max_usos) {
    return invite.max_usos === 1 ? "used" : "limit_reached";
  }

  return "active";
}

function creationPermission(role: InviteRole) {
  if (role === ROLES.admin) {
    return "invite.create_admin";
  }

  return role === ROLES.instrutor
    ? "invite.create_instructor"
    : "invite.create_student";
}

export async function createRegistrationInvite(
  input: CreateInviteInput,
  user: CurrentUser
) {
  if (!hasPermission(user, creationPermission(input.role))) {
    throw new InviteError(
      "INVITE_FORBIDDEN",
      "Você não possui permissão para gerar este tipo de link.",
      403
    );
  }

  const invitedEmail = normalizeEmail(input.invitedEmail);
  let maxUses = Math.min(Math.max(Math.trunc(input.maxUses), 1), 100);
  let expiresInHours = Math.min(Math.max(Math.trunc(input.expiresInHours), 1), 720);

  if (input.role === ROLES.admin) {
    if (!input.confirmedAdministrativeRisk) {
      throw new InviteError(
        "ADMIN_INVITE_CONFIRMATION_REQUIRED",
        "Confirme a criação do link administrativo antes de continuar."
      );
    }

    maxUses = 1;
    expiresInHours = Math.min(expiresInHours, 24);
  }
  if (input.role === ROLES.instrutor && !input.turmaInstrutoriaId) {
    throw new InviteError(
      "INSTRUCTOR_CLASS_REQUIRED",
      "Para convidar um Instrutor, é necessário vinculá-lo a uma turma específica."
    );
  }

  if (input.role === ROLES.instrutor) {
    const availableClass = await getDb().query(
      `
        SELECT id FROM turmas
        WHERE id = $1 AND status NOT IN ('encerrada', 'cancelada')
        LIMIT 1
      `,
      [input.turmaInstrutoriaId]
    );
    if (!availableClass.rows[0]) {
      throw new InviteError(
        "CLASS_UNAVAILABLE",
        "Selecione uma turma ativa ou futura para o convite de Instrutor."
      );
    }
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO convites_cadastro (
        id, token_hash, token_cifrado, token_prefixo, perfil_atribuido,
        criado_por_usuario_id, max_usos, expira_em, email_convidado,
        observacao, turma_instrutoria_id, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now()
      )
      RETURNING id
    `,
    [
      hashInviteToken(token),
      encryptInviteToken(token),
      token.slice(0, 10),
      input.role,
      user.id,
      maxUses,
      expiresAt,
      invitedEmail ?? null,
      input.notes?.trim() || null,
      input.role === ROLES.instrutor ? input.turmaInstrutoriaId : null
    ]
  );

  return {
    id: result.rows[0].id as string,
    role: input.role,
    maxUses,
    expiresAt,
    registrationUrl: buildRegistrationUrl(token)
  };
}

export async function listRegistrationInvites(
  user: CurrentUser,
  filters: { role?: string; status?: string } = {}
): Promise<InviteSummary[]> {
  if (!hasPermission(user, "invite.view")) {
    throw new InviteError("INVITE_FORBIDDEN", "Acesso não autorizado.", 403);
  }

  const db = getDb();
  const result = await db.query(
    `
      SELECT
        c.*,
        creator.nome AS criador_nome,
        t.nome AS turma_instrutoria_nome,
        course.nome AS curso_instrutoria_nome,
        COALESCE(
          json_agg(
            json_build_object(
              'nome', invited.nome,
              'email', invited.email,
              'usado_em', use.usado_em
            )
            ORDER BY use.usado_em DESC
          ) FILTER (WHERE use.id IS NOT NULL),
          '[]'::json
        ) AS usos
      FROM convites_cadastro c
      INNER JOIN usuarios creator ON creator.id = c.criado_por_usuario_id
      LEFT JOIN turmas t ON t.id = c.turma_instrutoria_id
      LEFT JOIN cursos course ON course.id = t.curso_id
      LEFT JOIN usos_convites_cadastro use ON use.convite_id = c.id
      LEFT JOIN usuarios invited ON invited.id = use.usuario_id
      WHERE ($1::text IS NULL OR c.perfil_atribuido = $1)
      GROUP BY c.id, creator.nome, t.nome, course.nome
      ORDER BY c.criado_em DESC
    `,
    [filters.role || null]
  );

  return result.rows
    .map((row) => {
      const status = statusForInvite(row);
      const canCopy =
        row.perfil_atribuido !== ROLES.admin ||
        hasPermission(user, "invite.create_admin");
      const uses = (row.usos as Array<{
        nome: string;
        email: string;
        usado_em: Date | string;
      }>).map((use) => ({
        name: use.nome,
        email: use.email,
        usedAt: formatDateTime(use.usado_em)
      }));

      return {
        id: row.id,
        role: row.perfil_atribuido,
        status,
        expiresAt: formatDateTime(row.expira_em),
        createdAt: formatDateTime(row.criado_em),
        maxUses: row.max_usos,
        usedCount: row.usos_realizados,
        invitedEmail: row.email_convidado,
        notes: row.observacao,
        creatorName: row.criador_nome,
        tokenPrefix: row.token_prefixo,
        registrationUrl: canCopy
          ? buildRegistrationUrl(decryptInviteToken(row.token_cifrado))
          : null,
        uses
        ,
        turmaInstrutoriaNome: row.turma_instrutoria_nome,
        cursoInstrutoriaNome: row.curso_instrutoria_nome
      } satisfies InviteSummary;
    })
    .filter((item) => !filters.status || item.status === filters.status);
}

export async function revokeRegistrationInvite(id: string, user: CurrentUser) {
  if (!hasPermission(user, "invite.revoke")) {
    throw new InviteError(
      "INVITE_FORBIDDEN",
      "Você não possui permissão para revogar links.",
      403
    );
  }

  const db = getDb();
  const result = await db.query(
    `
      UPDATE convites_cadastro
      SET status = 'revoked', revogado_em = now(),
          revogado_por_usuario_id = $2, atualizado_em = now()
      WHERE id = $1 AND status = 'active'
      RETURNING id, perfil_atribuido
    `,
    [id, user.id]
  );

  if (!result.rows[0]) {
    throw new InviteError(
      "INVITE_NOT_ACTIVE",
      "Este link já foi revogado ou não está mais ativo.",
      409,
      id
    );
  }

  return result.rows[0] as { id: string; perfil_atribuido: InviteRole };
}

async function fetchInviteByToken(
  token: string,
  client: Pick<PoolClient, "query"> = getDb()
) {
  const result = await client.query(
    "SELECT * FROM convites_cadastro WHERE token_hash = $1 LIMIT 1",
    [hashInviteToken(token)]
  );

  return result.rows[0] as InviteRow | undefined;
}

export async function getPublicRegistrationInvite(token: string): Promise<PublicInvite> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    return { status: "invalid" };
  }

  const invite = await fetchInviteByToken(token);

  if (!invite) {
    return { status: "invalid" };
  }

  let classContext: { turma_nome: string; curso_nome: string } | undefined;
  if (invite.turma_instrutoria_id) {
    const classResult = await getDb().query(
      `
        SELECT t.nome AS turma_nome, c.nome AS curso_nome
        FROM turmas t INNER JOIN cursos c ON c.id = t.curso_id
        WHERE t.id = $1
      `,
      [invite.turma_instrutoria_id]
    );
    classContext = classResult.rows[0];
  }
  return {
    id: invite.id,
    role: invite.perfil_atribuido,
    status: statusForInvite(invite),
    expiresAt: formatDateTime(invite.expira_em),
    invitedEmail: invite.email_convidado,
    turmaInstrutoriaNome: classContext?.turma_nome ?? null,
    cursoInstrutoriaNome: classContext?.curso_nome ?? null
  };
}

function assertUsableInvite(invite: InviteRow | undefined) {
  if (!invite) {
    throw new InviteError("INVITE_INVALID", "Link inválido.", 404);
  }

  const status = statusForInvite(invite);
  const messages: Partial<Record<InviteStatus, string>> = {
    expired: "Este link expirou.",
    revoked: "Este link foi revogado.",
    used: "Este link já foi utilizado.",
    limit_reached: "Este link atingiu o limite de cadastros."
  };

  if (status !== "active") {
    throw new InviteError(
      `INVITE_${status.toUpperCase()}`,
      messages[status] ?? "Este link não está disponível.",
      409,
      invite.id
    );
  }

  return invite;
}

export async function registerUserFromInvite(input: RegisterInviteInput) {
  const db = getDb();
  const client = await db.connect();
  const email = normalizeEmail(input.email)!;
  const cpf = normalizeCpf(input.cpf);
  let lattesUrl: string | null;

  if (cpf.length !== 11) {
    throw new InviteError("CPF_INVALID", "CPF deve conter 11 dígitos.");
  }

  try {
    lattesUrl = normalizeLattesUrl(input.lattesUrl);
  } catch (error) {
    if (error instanceof LattesValidationError) {
      throw new InviteError("LATTES_URL_INVALID", error.message);
    }

    throw error;
  }

  try {
    await client.query("BEGIN");
    const inviteResult = await client.query(
      "SELECT * FROM convites_cadastro WHERE token_hash = $1 FOR UPDATE",
      [hashInviteToken(input.token)]
    );
    const invite = assertUsableInvite(inviteResult.rows[0] as InviteRow | undefined);

    if (invite.email_convidado && invite.email_convidado !== email) {
      throw new InviteError(
        "INVITE_EMAIL_MISMATCH",
        "Este convite foi emitido para outro endereço de e-mail.",
        403,
        invite.id
      );
    }

    const existing = await client.query(
      "SELECT id FROM usuarios WHERE lower(email) = $1 OR cpf = $2 LIMIT 1",
      [email, cpf]
    );

    if (existing.rows[0]) {
      throw new InviteError(
        "USER_ALREADY_EXISTS",
        "Já existe um usuário cadastrado com este e-mail ou CPF.",
        409,
        invite.id
      );
    }

    const profileResult = await client.query(
      "SELECT id FROM perfis WHERE nome = $1 LIMIT 1",
      [invite.perfil_atribuido]
    );
    const profileId = profileResult.rows[0]?.id as string | undefined;

    if (!profileId) {
      throw new InviteError("PROFILE_NOT_FOUND", "Perfil do convite não encontrado.", 500);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const userResult = await client.query(
      `
        INSERT INTO usuarios (
          id, nome, cpf, email, senha_hash, telefone, orgao_secretaria, cargo,
          lattes_url, vinculo, status, atualizado_em
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'convidado',
          'ativo', now()
        )
        RETURNING id, nome, email
      `,
      [
        input.name.trim(),
        cpf,
        email,
        passwordHash,
        input.phone?.trim() || null,
        input.organization?.trim() || null,
        input.position?.trim() || null,
        lattesUrl
      ]
    );
    const user = userResult.rows[0] as { id: string; nome: string; email: string };

    await client.query(
      "INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES ($1, $2)",
      [user.id, profileId]
    );
    if (invite.perfil_atribuido === ROLES.instrutor) {
      if (!invite.turma_instrutoria_id) {
        throw new InviteError(
          "INSTRUCTOR_CLASS_REQUIRED",
          "Este convite de Instrutor não possui turma vinculada.",
          422,
          invite.id
        );
      }
      await createInstructorAssignmentWithClient(client, {
        turmaId: invite.turma_instrutoria_id,
        usuarioId: user.id,
        atribuidoPorUsuarioId: invite.criado_por_usuario_id
      });
    }
    await client.query(
      `
        INSERT INTO usos_convites_cadastro (
          id, convite_id, usuario_id, ip_address, user_agent
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `,
      [
        invite.id,
        user.id,
        input.ipAddress?.slice(0, 80) || null,
        input.userAgent?.slice(0, 280) || null
      ]
    );
    await client.query(
      `
        UPDATE convites_cadastro
        SET usos_realizados = usos_realizados + 1, atualizado_em = now()
        WHERE id = $1
      `,
      [invite.id]
    );
    await client.query("COMMIT");

    return {
      user,
      inviteId: invite.id,
      role: invite.perfil_atribuido
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

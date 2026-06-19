import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { LattesValidationError, normalizeLattesUrl } from "@/lib/lattes";
import { createInstructorAssignmentWithClient } from "@/lib/instructor-assignments";

export type UserSummary = {
  id: string;
  nome: string;
  email: string;
  status: string;
  perfis: string[];
  lattesUrl: string | null;
};

export type InstructorSummary = {
  id: string;
  nome: string;
  email: string;
  lattesUrl: string | null;
};

export type UserStatus = "ativo" | "inativo";

export type CreateUserInput = {
  nome: string;
  cpf: string;
  email: string;
  perfil: string;
  telefone?: string;
  orgaoSecretaria?: string;
  cargo?: string;
  lattesUrl?: string;
  matricula?: string;
  vinculo?: string;
  turmaId?: string;
};

export class UserCreationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "UserCreationError";
    this.code = code;
    this.status = status;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export function maskCpf(cpf: string) {
  const digits = normalizeCpf(cpf);

  if (digits.length !== 11) {
    return "***";
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

function generateTemporaryPassword() {
  return `LaBC-${crypto.randomBytes(6).toString("base64url")}`;
}

export async function listUsers(): Promise<UserSummary[]> {
  const db = getDb();
  const result = await db.query(`
    SELECT
      u.id,
      u.nome,
      u.email,
      u.status,
      u.lattes_url,
      COALESCE(array_agg(p.nome) FILTER (WHERE p.nome IS NOT NULL), '{}') AS perfis
    FROM usuarios u
    LEFT JOIN usuario_perfis up ON up.usuario_id = u.id
    LEFT JOIN perfis p ON p.id = up.perfil_id
    GROUP BY u.id
    ORDER BY u.criado_em DESC
  `);

  return result.rows.map((user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    status: user.status,
    perfis: user.perfis,
    lattesUrl: user.lattes_url
  }));
}

export async function listActiveInstructors(): Promise<InstructorSummary[]> {
  const db = getDb();
  const result = await db.query(`
    SELECT DISTINCT u.id, u.nome, u.email, u.lattes_url
    FROM usuarios u
    WHERE u.status = 'ativo'
    ORDER BY u.nome ASC
  `);

  return result.rows.map((user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    lattesUrl: user.lattes_url
  }));
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
  actingUserId?: string
) {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    if (status === "inativo") {
      if (actingUserId === userId) {
        throw new UserCreationError(
          "SELF_DEACTIVATION_NOT_ALLOWED",
          "Você não pode inativar a própria conta.",
          409
        );
      }

      const targetResult = await client.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM usuario_perfis up
            INNER JOIN perfis p ON p.id = up.perfil_id
            WHERE up.usuario_id = u.id AND p.nome = 'administrador_geral'
          ) AS administrador
          FROM usuarios u
          WHERE u.id = $1
          FOR UPDATE
        `,
        [userId]
      );

      if (targetResult.rows[0]?.administrador) {
        const activeAdminsResult = await client.query(`
          SELECT COUNT(DISTINCT u.id)::int AS total
          FROM usuarios u
          INNER JOIN usuario_perfis up ON up.usuario_id = u.id
          INNER JOIN perfis p ON p.id = up.perfil_id
          WHERE u.status = 'ativo' AND p.nome = 'administrador_geral'
        `);

        if (Number(activeAdminsResult.rows[0]?.total ?? 0) <= 1) {
          throw new UserCreationError(
            "LAST_ADMIN_REQUIRED",
            "Não é possível inativar o último Administrador ativo.",
            409
          );
        }
      }
    }

    const result = await client.query(
      `
        UPDATE usuarios
        SET status = $2,
            atualizado_em = now()
        WHERE id = $1
        RETURNING id, nome, email, status
      `,
      [userId, status]
    );

    await client.query("COMMIT");
    return result.rows[0] as
      | { id: string; nome: string; email: string; status: UserStatus }
      | undefined;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createUser(input: CreateUserInput, createdByUserId?: string) {
  const db = getDb();
  const client = await db.connect();
  const email = normalizeEmail(input.email);
  const cpf = normalizeCpf(input.cpf);
  let lattesUrl: string | null;

  try {
    lattesUrl = normalizeLattesUrl(input.lattesUrl);
  } catch (error) {
    if (error instanceof LattesValidationError) {
      throw new UserCreationError("INVALID_LATTES_URL", error.message, 422);
    }

    throw error;
  }

  try {
    await client.query("BEGIN");

    if (input.perfil === "administrador_geral") {
      throw new UserCreationError(
        "ADMIN_INVITE_REQUIRED",
        "Novos administradores devem ser cadastrados por um link administrativo válido.",
        403
      );
    }

    if (input.perfil === "instrutor" && (!input.turmaId || !createdByUserId)) {
      throw new UserCreationError(
        "INSTRUCTOR_CLASS_REQUIRED",
        "Para cadastrar um Instrutor, é necessário vinculá-lo a uma turma específica.",
        422
      );
    }

    if (cpf.length !== 11) {
      throw new UserCreationError(
        "INVALID_CPF",
        "CPF deve conter 11 dígitos.",
        422
      );
    }

    const existing = await client.query(
      `
        SELECT id, email, cpf
        FROM usuarios
        WHERE lower(email) = $1 OR regexp_replace(cpf, '\\D', '', 'g') = $2
        LIMIT 1
      `,
      [email, cpf]
    );
    const existingUser = existing.rows[0] as
      | { id: string; email: string; cpf: string }
      | undefined;

    if (existingUser && normalizeEmail(existingUser.email) === email) {
      throw new UserCreationError(
        "EMAIL_ALREADY_EXISTS",
        "Já existe usuário com este e-mail.",
        409
      );
    }

    if (existingUser && normalizeCpf(existingUser.cpf) === cpf) {
      throw new UserCreationError(
        "CPF_ALREADY_EXISTS",
        "Já existe usuário com este CPF.",
        409
      );
    }

    const perfilResult = await client.query("SELECT id FROM perfis WHERE nome = $1", [
      input.perfil
    ]);
    const perfil = perfilResult.rows[0] as { id: string } | undefined;

    if (!perfil) {
      throw new UserCreationError(
        "PROFILE_NOT_FOUND",
        "Perfil informado não existe.",
        422
      );
    }

    const senhaTemporaria = generateTemporaryPassword();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);
    const userResult = await client.query(
      `
        INSERT INTO usuarios (
          id, nome, cpf, email, telefone, orgao_secretaria, cargo, matricula,
          vinculo, lattes_url, senha_hash, status, atualizado_em
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ativo', now()
        )
        RETURNING id, nome, cpf, email, status
      `,
      [
        input.nome,
        cpf,
        email,
        input.telefone || null,
        input.orgaoSecretaria || null,
        input.cargo || null,
        input.matricula || null,
        input.vinculo || null,
        lattesUrl,
        senhaHash
      ]
    );
    const user = userResult.rows[0];

    await client.query(
      "INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES ($1, $2)",
      [user.id, perfil.id]
    );
    if (input.perfil === "instrutor" && input.turmaId && createdByUserId) {
      await createInstructorAssignmentWithClient(client, {
        turmaId: input.turmaId,
        usuarioId: user.id,
        atribuidoPorUsuarioId: createdByUserId
      });
    }

    await client.query("COMMIT");

    return {
      ...user,
      senhaTemporaria
    } as {
      id: string;
      nome: string;
      cpf: string;
      email: string;
      status: UserStatus;
      senhaTemporaria: string;
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserLattesUrl(userId: string, value?: string | null) {
  const lattesUrl = normalizeLattesUrl(value);
  const db = getDb();
  const result = await db.query(
    `
      UPDATE usuarios
      SET lattes_url = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome, email, lattes_url
    `,
    [userId, lattesUrl]
  );

  return result.rows[0] as
    | { id: string; nome: string; email: string; lattes_url: string | null }
    | undefined;
}

export async function resetUserTemporaryPassword(userId: string) {
  const db = getDb();
  const senhaTemporaria = generateTemporaryPassword();
  const senhaHash = await bcrypt.hash(senhaTemporaria, 10);
  const result = await db.query(
    `
      UPDATE usuarios
      SET senha_hash = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, nome, email, status
    `,
    [userId, senhaHash]
  );

  const user = result.rows[0] as
    | { id: string; nome: string; email: string; status: UserStatus }
    | undefined;

  return user ? { ...user, senhaTemporaria } : undefined;
}

export async function setUserProfiles(
  userId: string,
  profileIds: string[],
  actingUserId?: string
) {
  const db = getDb();
  const client = await db.connect();
  const uniqueProfileIds = [...new Set(profileIds)];

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        SELECT
          u.id,
          u.nome,
          u.email,
          EXISTS (
            SELECT 1
            FROM usuario_perfis up
            INNER JOIN perfis p ON p.id = up.perfil_id
            WHERE up.usuario_id = u.id AND p.nome = 'administrador_geral'
          ) AS administrador,
          EXISTS (
            SELECT 1
            FROM usuario_perfis up
            INNER JOIN perfis p ON p.id = up.perfil_id
            WHERE up.usuario_id = u.id AND p.nome = 'instrutor'
          ) AS instrutor
        FROM usuarios u
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId]
    );
    const user = userResult.rows[0] as
      | { id: string; nome: string; email: string; administrador: boolean; instrutor: boolean }
      | undefined;

    if (!user) {
      await client.query("ROLLBACK");
      return undefined;
    }

    const addingAdminResult = await client.query(
      `
        SELECT EXISTS (
          SELECT 1 FROM perfis
          WHERE id = ANY($1::uuid[]) AND nome = 'administrador_geral'
        ) AS adicionando_administrador
      `,
      [uniqueProfileIds]
    );

    if (addingAdminResult.rows[0]?.adicionando_administrador && !user.administrador) {
      throw new UserCreationError(
        "ADMIN_INVITE_REQUIRED",
        "O perfil Administrador somente pode ser atribuído durante cadastro por convite administrativo válido.",
        403
      );
    }
    const adminSelected = Boolean(
      addingAdminResult.rows[0]?.adicionando_administrador
    );

    if (user.administrador && !adminSelected) {
      if (actingUserId === userId) {
        throw new UserCreationError(
          "SELF_ADMIN_PROFILE_REMOVAL_NOT_ALLOWED",
          "Você não pode remover o próprio perfil Administrador.",
          409
        );
      }

      const activeAdminsResult = await client.query(`
        SELECT COUNT(DISTINCT u.id)::int AS total
        FROM usuarios u
        INNER JOIN usuario_perfis up ON up.usuario_id = u.id
        INNER JOIN perfis p ON p.id = up.perfil_id
        WHERE u.status = 'ativo' AND p.nome = 'administrador_geral'
      `);

      if (Number(activeAdminsResult.rows[0]?.total ?? 0) <= 1) {
        throw new UserCreationError(
          "LAST_ADMIN_REQUIRED",
          "Não é possível remover o perfil do último Administrador ativo.",
          409
        );
      }
    }

    const selectedInstructorResult = await client.query(
      `
        SELECT EXISTS (
          SELECT 1 FROM perfis
          WHERE id = ANY($1::uuid[]) AND nome = 'instrutor'
        ) AS instrutor_selecionado
      `,
      [uniqueProfileIds]
    );
    const assignment = await client.query(
      `
        SELECT id FROM vinculos_instrutoria
        WHERE usuario_id = $1 AND status IN ('agendado', 'ativo')
        LIMIT 1
      `,
      [userId]
    );
    const instructorSelected = Boolean(
      selectedInstructorResult.rows[0]?.instrutor_selecionado
    );
    if (instructorSelected && !assignment.rows[0] && !user.instrutor) {
      throw new UserCreationError(
        "INSTRUCTOR_CLASS_REQUIRED",
        "Vincule o usuário a uma turma antes de atribuir o perfil Instrutor.",
        422
      );
    }
    if (!instructorSelected && assignment.rows[0]) {
      throw new UserCreationError(
        "OPEN_INSTRUCTOR_ASSIGNMENT",
        "Encerre os vínculos de instrutoria ativos ou agendados antes de remover o perfil Instrutor.",
        409
      );
    }

    await client.query("DELETE FROM usuario_perfis WHERE usuario_id = $1", [
      userId
    ]);

    if (uniqueProfileIds.length) {
      await client.query(
      `
        INSERT INTO usuario_perfis (usuario_id, perfil_id)
        SELECT $1, p.id
        FROM perfis p
        WHERE p.id = ANY($2::uuid[])
        ON CONFLICT DO NOTHING
      `,
        [userId, uniqueProfileIds]
      );
    }

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

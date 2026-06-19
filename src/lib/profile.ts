import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { normalizeLattesUrl } from "@/lib/lattes";

export class PasswordChangeError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "PasswordChangeError";
    this.code = code;
    this.status = status;
  }
}

export type ProfessionalProfile = {
  orgaoSecretaria: string | null;
  cargo: string | null;
  lattesUrl: string | null;
};

export async function getProfessionalProfile(userId: string): Promise<ProfessionalProfile> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT orgao_secretaria, cargo, lattes_url
      FROM usuarios
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );
  const profile = result.rows[0];

  return {
    orgaoSecretaria: profile?.orgao_secretaria ?? null,
    cargo: profile?.cargo ?? null,
    lattesUrl: profile?.lattes_url ?? null
  };
}

export async function updateOwnLattesUrl(userId: string, value?: string | null) {
  const lattesUrl = normalizeLattesUrl(value);
  const db = getDb();

  await db.query(
    `
      UPDATE usuarios
      SET lattes_url = $2,
          atualizado_em = now()
      WHERE id = $1
    `,
    [userId, lattesUrl]
  );

  return lattesUrl;
}

export async function changeOwnPassword({
  userId,
  currentPassword,
  newPassword
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT id, senha_hash
      FROM usuarios
      WHERE id = $1
        AND status = 'ativo'
      LIMIT 1
    `,
    [userId]
  );
  const user = result.rows[0];

  if (!user) {
    throw new PasswordChangeError(
      "ACTIVE_USER_NOT_FOUND",
      "Usuário ativo não encontrado.",
      404
    );
  }

  const currentPasswordOk = await bcrypt.compare(
    currentPassword,
    user.senha_hash
  );

  if (!currentPasswordOk) {
    throw new PasswordChangeError(
      "CURRENT_PASSWORD_INVALID",
      "Senha atual incorreta.",
      422
    );
  }

  if (currentPassword === newPassword) {
    throw new PasswordChangeError(
      "PASSWORD_REUSE_NOT_ALLOWED",
      "A nova senha deve ser diferente da atual.",
      409
    );
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await db.query(
    `
      UPDATE usuarios
      SET senha_hash = $2,
          atualizado_em = now()
      WHERE id = $1
    `,
    [userId, newHash]
  );
}

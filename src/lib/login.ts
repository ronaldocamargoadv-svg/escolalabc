import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSessionToken } from "@/lib/session";

export async function authenticateUser(email: string, senha: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT id, nome, email, senha_hash, status
      FROM usuarios
      WHERE lower(email) = $1
      LIMIT 1
    `,
    [email.trim().toLowerCase()]
  );
  const user = result.rows[0];

  if (!user || user.status !== "ativo") {
    return null;
  }

  const passwordOk = await bcrypt.compare(senha, user.senha_hash);

  if (!passwordOk) {
    return null;
  }

  return {
    user,
    token: createSessionToken({
      userId: user.id,
      email: user.email
    })
  };
}

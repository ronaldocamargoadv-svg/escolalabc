import { getDb } from "@/lib/db";
import { getSessionPayload } from "@/lib/session";

type AuditEvent = {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  ip?: string;
};

function maskSensitiveText(value?: string) {
  if (!value) {
    return null;
  }

  return value
    .replace(
      /([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      "$1***$2"
    )
    .replace(/\b(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})\b/g, "$1.***.***-$2");
}

export async function writeAuditLog(event: AuditEvent) {
  const db = getDb();
  const session = event.userId ? null : await getSessionPayload().catch(() => null);
  const userId = event.userId ?? session?.userId ?? null;
  const result = await db.query(
    `
      INSERT INTO logs_auditoria (
        id, usuario_id, acao, entidade, entidade_id, resumo, ip
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      userId,
      event.action,
      event.entity,
      event.entityId || null,
      maskSensitiveText(event.summary),
      event.ip || null
    ]
  );

  return result.rows[0];
}

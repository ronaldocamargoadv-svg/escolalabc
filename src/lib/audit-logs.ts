import { getDb } from "@/lib/db";

export type AuditLogSummary = {
  id: string;
  usuarioId: string | null;
  usuario: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  ip: string | null;
  resumo: string | null;
  criadoEm: string;
};

export type AuditLogFilters = {
  acao?: string;
  entidade?: string;
  usuarioId?: string;
  dataInicio?: string;
  dataFim?: string;
};

export async function listAuditLogs({
  limit = 100,
  filters = {}
}: {
  limit?: number | null;
  filters?: AuditLogFilters;
} = {}): Promise<AuditLogSummary[]> {
  const db = getDb();
  const whereClauses: string[] = [];
  const params: string[] = [];

  if (filters.acao) {
    params.push(filters.acao);
    whereClauses.push(`l.acao = $${params.length}`);
  }

  if (filters.entidade) {
    params.push(filters.entidade);
    whereClauses.push(`l.entidade = $${params.length}`);
  }

  if (filters.usuarioId) {
    params.push(filters.usuarioId);
    whereClauses.push(`l.usuario_id = $${params.length}::uuid`);
  }

  if (filters.dataInicio) {
    params.push(filters.dataInicio);
    whereClauses.push(`l.criado_em >= $${params.length}::date`);
  }

  if (filters.dataFim) {
    params.push(filters.dataFim);
    whereClauses.push(`l.criado_em < ($${params.length}::date + interval '1 day')`);
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";
  const baseQuery = `
      SELECT
        l.id,
        l.usuario_id,
        u.nome AS usuario,
        l.acao,
        l.entidade,
        l.entidade_id,
        l.ip,
        l.resumo,
        to_char(l.criado_em, 'DD/MM/YYYY HH24:MI:SS') AS criado_em
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON u.id = l.usuario_id
      ${where}
      ORDER BY l.criado_em DESC
    `;
  const result =
    limit === null
      ? await db.query(baseQuery, params)
      : await db.query(`${baseQuery} LIMIT $${params.length + 1}`, [
          ...params,
          String(limit)
        ]);

  return result.rows.map((item) => ({
    id: item.id,
    usuarioId: item.usuario_id,
    usuario: item.usuario,
    acao: item.acao,
    entidade: item.entidade,
    entidadeId: item.entidade_id,
    ip: item.ip,
    resumo: item.resumo,
    criadoEm: item.criado_em
  }));
}

function csvCell(value: string | null) {
  const text = value ?? "";
  return `"${text.replace(/"/g, '""')}"`;
}

export function auditLogsToCsv(logs: AuditLogSummary[]) {
  const header = [
    "id",
    "criado_em",
    "usuario",
    "acao",
    "entidade",
    "entidade_id",
    "ip",
    "resumo"
  ];
  const lines = logs.map((log) =>
    [
      log.id,
      log.criadoEm,
      log.usuario ?? "Sistema",
      log.acao,
      log.entidade,
      log.entidadeId,
      log.ip,
      log.resumo
    ]
      .map(csvCell)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

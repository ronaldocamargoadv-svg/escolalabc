import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export type DashboardMetrics = {
  cursos: number;
  turmas: number;
  usuarios: number;
  inscricoes: number;
  presencas: number;
  certificados: number;
  cargaHoraria: string;
  concluintes: number;
};

export type RecentActivity = {
  label: string;
  value: string;
  detail: string;
};

export type ExecutiveReportRow = {
  tipo: string;
  nome: string;
  status: string;
  detalhe: string;
  totalInscricoes: number;
  totalPresencas: number;
  totalCertificadosValidos: number;
};

function canSeeInstitutionalReports(user: CurrentUser) {
  return (
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "reports.export")
  );
}

export async function getDashboardMetrics(
  user: CurrentUser
): Promise<DashboardMetrics> {
  const db = getDb();
  const result = canSeeInstitutionalReports(user)
    ? await db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM cursos) AS cursos,
          (SELECT COUNT(*)::int FROM turmas) AS turmas,
          (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
          (SELECT COUNT(*)::int FROM inscricoes WHERE status <> 'cancelado') AS inscricoes,
          (SELECT COUNT(*)::int FROM presencas WHERE status = 'presente') AS presencas,
          (SELECT COUNT(*)::int FROM certificados WHERE status = 'valido') AS certificados,
          COALESCE((SELECT SUM(carga_horaria)::text FROM cursos), '0') AS carga_horaria,
          (SELECT COUNT(*)::int FROM inscricoes WHERE apto_certificado = true) AS concluintes
      `)
    : await db.query(
        `
          SELECT
            COUNT(DISTINCT c.id)::int AS cursos,
            COUNT(DISTINCT t.id)::int AS turmas,
            COUNT(DISTINCT i.usuario_id)::int AS usuarios,
            COUNT(DISTINCT i.id) FILTER (WHERE i.status <> 'cancelado')::int AS inscricoes,
            COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'presente')::int AS presencas,
            COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valido')::int AS certificados,
            COALESCE(SUM(DISTINCT c.carga_horaria)::text, '0') AS carga_horaria,
            COUNT(DISTINCT i.id) FILTER (WHERE i.apto_certificado = true)::int AS concluintes
          FROM turmas t
          INNER JOIN cursos c ON c.id = t.curso_id
          LEFT JOIN inscricoes i ON i.turma_id = t.id
          LEFT JOIN presencas p ON p.inscricao_id = i.id
          LEFT JOIN certificados cert ON cert.inscricao_id = i.id
          WHERE EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
          )
        `,
        [user.id]
      );

  const row = result.rows[0];

  return {
    cursos: row.cursos,
    turmas: row.turmas,
    usuarios: row.usuarios,
    inscricoes: row.inscricoes,
    presencas: row.presencas,
    certificados: row.certificados,
    cargaHoraria: row.carga_horaria,
    concluintes: row.concluintes
  };
}

export async function getRecentActivity(user: CurrentUser): Promise<RecentActivity[]> {
  const db = getDb();
  const result = canSeeInstitutionalReports(user)
    ? await db.query(`
        SELECT 'Curso' AS label, nome AS value, status AS detail, criado_em
        FROM cursos
        UNION ALL
        SELECT 'Turma' AS label, nome AS value, status AS detail, criado_em
        FROM turmas
        UNION ALL
        SELECT 'Certificado' AS label, codigo_validacao AS value, status AS detail, data_emissao AS criado_em
        FROM certificados
        ORDER BY criado_em DESC
        LIMIT 6
      `)
    : await db.query(
        `
          SELECT 'Curso' AS label, c.nome AS value, c.status AS detail, c.criado_em
          FROM cursos c
          WHERE EXISTS (
            SELECT 1 FROM turmas t
            WHERE t.curso_id = c.id AND EXISTS (
              SELECT 1 FROM vinculos_instrutoria vi
              WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
            )
          )
          UNION ALL
          SELECT 'Turma' AS label, t.nome AS value, t.status AS detail, t.criado_em
          FROM turmas t
          WHERE EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
          )
          UNION ALL
          SELECT 'Certificado' AS label, cert.codigo_validacao AS value, cert.status AS detail, cert.data_emissao AS criado_em
          FROM certificados cert
          INNER JOIN inscricoes i ON i.id = cert.inscricao_id
          INNER JOIN turmas t ON t.id = i.turma_id
          WHERE EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
          )
          ORDER BY criado_em DESC
          LIMIT 6
        `,
        [user.id]
      );

  return result.rows.map((item) => ({
    label: item.label,
    value: item.value,
    detail: item.detail
  }));
}

export async function getExecutiveReportRows(): Promise<ExecutiveReportRow[]> {
  const db = getDb();
  const result = await db.query(`
    SELECT
      'curso' AS tipo,
      c.nome,
      c.status,
      c.modalidade || ' - ' || c.carga_horaria || 'h' AS detalhe,
      COUNT(DISTINCT i.id)::int AS total_inscricoes,
      COUNT(DISTINCT p.id)::int AS total_presencas,
      COUNT(DISTINCT cert.id)::int AS total_certificados_validos
    FROM cursos c
    LEFT JOIN turmas t ON t.curso_id = c.id
    LEFT JOIN inscricoes i ON i.turma_id = t.id AND i.status <> 'cancelado'
    LEFT JOIN presencas p ON p.inscricao_id = i.id AND p.status = 'presente'
    LEFT JOIN certificados cert ON cert.inscricao_id = i.id AND cert.status = 'valido'
    GROUP BY c.id
    UNION ALL
    SELECT
      'turma' AS tipo,
      t.nome,
      t.status,
      c.nome || ' - ' || to_char(t.data_inicio, 'DD/MM/YYYY') AS detalhe,
      COUNT(DISTINCT i.id)::int AS total_inscricoes,
      COUNT(DISTINCT p.id)::int AS total_presencas,
      COUNT(DISTINCT cert.id)::int AS total_certificados_validos
    FROM turmas t
    INNER JOIN cursos c ON c.id = t.curso_id
    LEFT JOIN inscricoes i ON i.turma_id = t.id AND i.status <> 'cancelado'
    LEFT JOIN presencas p ON p.inscricao_id = i.id AND p.status = 'presente'
    LEFT JOIN certificados cert ON cert.inscricao_id = i.id AND cert.status = 'valido'
    GROUP BY t.id, c.nome
    ORDER BY tipo, nome
  `);

  return result.rows.map((item) => ({
    tipo: item.tipo,
    nome: item.nome,
    status: item.status,
    detalhe: item.detalhe,
    totalInscricoes: item.total_inscricoes,
    totalPresencas: item.total_presencas,
    totalCertificadosValidos: item.total_certificados_validos
  }));
}

function csvCell(value: string | number) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function executiveReportToCsv(rows: ExecutiveReportRow[]) {
  const header = [
    "tipo",
    "nome",
    "status",
    "detalhe",
    "total_inscricoes",
    "total_presencas",
    "total_certificados_validos"
  ];
  const lines = rows.map((row) =>
    [
      row.tipo,
      row.nome,
      row.status,
      row.detalhe,
      row.totalInscricoes,
      row.totalPresencas,
      row.totalCertificadosValidos
    ]
      .map(csvCell)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

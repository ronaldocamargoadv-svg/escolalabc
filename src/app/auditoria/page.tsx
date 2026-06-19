import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { listAuditLogs } from "@/lib/audit-logs";
import { uiLabel } from "@/lib/ui-labels";

export default async function AuditPage() {
  const user = await requirePermission("audit.view");
  const logs = await listAuditLogs();

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Rastreabilidade</p>
          <h1 className="page-title">Auditoria</h1>
          <p className="page-copy">
            Acompanhe eventos sensíveis registrados pela plataforma para apoiar
            governança, segurança e prestação de contas.
          </p>
        </div>
        <a className="button secondary" href="/api/relatorios/auditoria.csv">
          Exportar auditoria
        </a>
      </section>

      <section className="panel">
        <h2>Eventos recentes</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>Usuário</th>
              <th>Resumo</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.criadoEm}</td>
                  <td>{uiLabel(log.acao)}</td>
                  <td>{uiLabel(log.entidade)}</td>
                  <td>{log.usuario ?? "Sistema"}</td>
                  <td>{log.resumo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>Nenhum evento registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

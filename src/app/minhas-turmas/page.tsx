import { AppShell, UserPill } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { listInstructorAssignments } from "@/lib/instructor-assignments";
import { uiLabel } from "@/lib/ui-labels";

export default async function MyInstructorClassesPage() {
  const user = await requirePermission("classes.view");
  const assignments = await listInstructorAssignments(user);

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Atuação formativa</p>
          <h1 className="page-title">Minhas turmas como Instrutor</h1>
          <p className="page-copy">
            Consulte vínculos ativos, previstos e encerrados. A atuação em
            aulas e alunos fica disponível apenas durante vínculo ativo.
          </p>
        </div>
        <UserPill user={user} />
      </section>
      <section className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Curso / Turma</th>
                <th>Status do vínculo</th>
                <th>Período</th>
                <th>Acesso</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    {assignment.cursoNome}
                    <span className="muted-small">{assignment.turmaNome}</span>
                  </td>
                  <td>
                    <span className="badge blue">{uiLabel(assignment.status)}</span>
                  </td>
                  <td>
                    {assignment.inicioEm ?? "-"} a {assignment.fimEm ?? "-"}
                  </td>
                  <td>
                    {assignment.status === "ativo" ? (
                      <div className="inline-actions">
                        <a className="text-button" href="/encontros">
                          Acessar aulas
                        </a>
                        <a className="text-button" href="/materiais">
                          Materiais
                        </a>
                      </div>
                    ) : (
                      <span className="muted-small">Somente histórico</span>
                    )}
                  </td>
                </tr>
              ))}
              {!assignments.length ? (
                <tr>
                  <td colSpan={4}>Nenhuma turma vinculada como Instrutor.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

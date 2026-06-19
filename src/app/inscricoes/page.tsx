import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { listClasses } from "@/lib/classes";
import { listEnrollments } from "@/lib/enrollments";
import { hasPermission } from "@/lib/permissions";
import { listUsers } from "@/lib/users";
import { uiLabel } from "@/lib/ui-labels";
import {
  createEnrollmentAction,
  updateEnrollmentStatusAction
} from "./actions";

export default async function EnrollmentsPage() {
  const user = await requirePermission("enrollments.view");
  const canManageEnrollments = hasPermission(user, "enrollments.manage");
  const [enrollments, users, classes] = await Promise.all([
    listEnrollments({ user }),
    canManageEnrollments ? listUsers() : Promise.resolve([]),
    listClasses(user)
  ]);
  const activeEnrollments = enrollments.filter(
    (item) => item.status !== "cancelado"
  ).length;
  const canceledEnrollments = enrollments.length - activeEnrollments;
  const activeUsers = users.filter((item) => item.status === "ativo");
  const availableClasses = classes.filter(
    (item) => item.status === "publicada" && item.cursoStatus === "publicado"
  );

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Participação</p>
          <h1 className="page-title">Inscrições</h1>
          <p className="page-copy">
            Registre alunos em turmas, acompanhe status e prepare a base
            para presença, frequência e certificação.
          </p>
        </div>
        <div className="action-row">
          <a className="button secondary" href="/api/relatorios/inscricoes.csv?status=ativo">
            CSV ativas
          </a>
          <a className="button secondary" href="/api/relatorios/inscricoes.csv">
            CSV completo
          </a>
        </div>
      </section>

      <section className="metric-grid" aria-label="Resumo das inscrições">
        <article className="metric">
          <span>Inscrições ativas</span>
          <strong>{activeEnrollments}</strong>
        </article>
        <article className="metric">
          <span>Canceladas</span>
          <strong>{canceledEnrollments}</strong>
        </article>
        <article className="metric">
          <span>Aptas a certificado</span>
          <strong>
            {enrollments.filter((item) => item.aptoCertificado).length}
          </strong>
        </article>
        <article className="metric">
          <span>Total histórico</span>
          <strong>{enrollments.length}</strong>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Inscrições registradas</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Curso</th>
                <th>Turma</th>
                <th>Status</th>
                <th>Frequência</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length ? (
                enrollments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.participante}
                      <br />
                      <span className="muted-small">{item.email}</span>
                    </td>
                    <td>{item.curso}</td>
                    <td>{item.turma}</td>
                    <td>
                      <span className="badge">{uiLabel(item.status)}</span>
                    </td>
                    <td>{item.percentualFrequencia}%</td>
                    <td>
                      <div className="inline-actions">
                        {!canManageEnrollments ? (
                          <span className="muted-small">Somente leitura</span>
                        ) : item.status === "cancelado" ? (
                          <form action={updateEnrollmentStatusAction}>
                            <input
                              name="inscricaoId"
                              type="hidden"
                              value={item.id}
                            />
                            <input name="status" type="hidden" value="inscrito" />
                            <button className="text-button" type="submit">
                              Reativar
                            </button>
                          </form>
                        ) : (
                          <form action={updateEnrollmentStatusAction}>
                            <input
                              name="inscricaoId"
                              type="hidden"
                              value={item.id}
                            />
                            <input
                              name="status"
                              type="hidden"
                              value="cancelado"
                            />
                            <button className="text-button danger" type="submit">
                              Cancelar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>Nenhuma inscrição registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {canManageEnrollments ? (
        <aside className="panel">
          <h2>Nova inscrição</h2>
          <form className="form-grid" action={createEnrollmentAction}>
            <div className="field">
              <label htmlFor="usuarioId">Aluno</label>
              <select id="usuarioId" name="usuarioId" required>
                {activeUsers.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.nome} - {participant.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="turmaId">Turma</label>
              <select id="turmaId" name="turmaId" required>
                {availableClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} - {item.cursoNome}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="button"
              type="submit"
              disabled={!activeUsers.length || !availableClasses.length}
            >
              Inscrever aluno
            </button>
            {!availableClasses.length ? (
              <p className="muted">Publique curso e turma antes de inscrever.</p>
            ) : null}
          </form>
        </aside>
        ) : null}
      </section>
    </AppShell>
  );
}

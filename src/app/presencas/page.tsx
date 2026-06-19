import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { listAttendances } from "@/lib/attendance";
import { listClasses } from "@/lib/classes";
import { listEnrollments } from "@/lib/enrollments";
import { canUseClassForMeeting, listMeetings } from "@/lib/meetings";
import { hasPermission } from "@/lib/permissions";
import { uiLabel } from "@/lib/ui-labels";
import { registerAttendanceAction } from "./actions";

export default async function AttendancePage() {
  const user = await requirePermission("attendance.view");
  const [attendances, enrollments, meetings, classes] = await Promise.all([
    listAttendances(user),
    listEnrollments({ user }),
    listMeetings(user),
    listClasses(user)
  ]);
  const availableClasses = classes.filter((item) => canUseClassForMeeting(user, item));
  const availableClassIds = new Set(availableClasses.map((item) => item.id));
  const availableEnrollments = enrollments.filter((item) =>
    availableClassIds.has(item.turmaId)
  );
  const availableMeetings = meetings.filter((item) => item.status !== "cancelado");
  const canRegisterAttendance = hasPermission(user, "attendance.manage");
  const canExportReports = hasPermission(user, "reports.export");

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Frequência</p>
          <h1 className="page-title">Frequência</h1>
          <p className="page-copy">
            Registre presença por encontro e mantenha a frequência das
            inscrições atualizada para certificação.
          </p>
        </div>
        {canExportReports ? (
          <a className="button secondary" href="/api/relatorios/presencas.csv">
            Exportar frequência
          </a>
        ) : null}
      </section>

      <section className="content-grid frequency-grid">
        <div className="panel">
          <h2>Registros de frequência</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Curso</th>
                <th>Turma</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length ? (
                attendances.map((item) => (
                  <tr key={item.id}>
                    <td>{item.participante}</td>
                    <td>{item.curso}</td>
                    <td>{item.turma}</td>
                    <td>{item.data}</td>
                    <td>
                      <span className="badge">{uiLabel(item.status)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>Nenhuma presença registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {canRegisterAttendance ? (
        <aside className="panel frequency-form-panel">
          <h2>Registrar presença</h2>
          <form className="form-grid" action={registerAttendanceAction}>
            <div className="field">
              <label htmlFor="inscricaoId">Inscrição</label>
              <select id="inscricaoId" name="inscricaoId" required>
                {availableEnrollments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.participante} - {item.turma}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="encontroId">Encontro</label>
              <select id="encontroId" name="encontroId" required>
                {availableMeetings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.data} - {item.turma}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue="presente">
                <option value="presente">Presente</option>
                <option value="ausente">Ausente</option>
                <option value="justificado">Justificado</option>
              </select>
            </div>
            <button
              className="button"
              type="submit"
              disabled={!availableEnrollments.length || !availableMeetings.length}
            >
              Registrar
            </button>
            {!availableMeetings.length ? (
              <p className="muted">Não há encontros ativos para registrar presença.</p>
            ) : null}
          </form>
          <div className="action-row">
            {availableClasses.map((item) => (
              <a
                className="button secondary"
                href={`/api/relatorios/presencas.csv?turmaId=${item.id}`}
                key={item.id}
              >
                CSV {item.nome}
              </a>
            ))}
          </div>
        </aside>
        ) : null}
      </section>
    </AppShell>
  );
}

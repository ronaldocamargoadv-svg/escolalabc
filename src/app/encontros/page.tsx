import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import { listClasses } from "@/lib/classes";
import { canUseClassForMeeting, listMeetings } from "@/lib/meetings";
import { uiLabel } from "@/lib/ui-labels";
import {
  createMeetingAction,
  updateMeetingDetailsAction,
  updateMeetingStatusAction
} from "./actions";

export default async function MeetingsPage() {
  const user = await requireAnyPermission(["classes.create", "classes.edit"]);
  const [meetings, classes] = await Promise.all([
    listMeetings(user),
    listClasses(user)
  ]);
  const availableClasses = classes.filter(
    (item) =>
      item.status === "publicada" &&
      item.cursoStatus === "publicado" &&
      !item.hasValidCertificates &&
      canUseClassForMeeting(user, item)
  );

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Agenda formativa</p>
          <h1 className="page-title">Encontros</h1>
          <p className="page-copy">
            Cadastre encontros de cada turma para permitir registro de presença
            e cálculo automático de frequência.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Encontros cadastrados</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Turma</th>
                <th>Modalidade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length ? (
                meetings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.data}</td>
                    <td>
                      {item.horarioInicio} - {item.horarioFim}
                    </td>
                    <td>
                      {item.turma}
                      <br />
                      <span className="muted-small">{item.curso}</span>
                    </td>
                    <td>{uiLabel(item.modalidade)}</td>
                    <td>
                      <span className="badge">{uiLabel(item.status)}</span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {item.status === "previsto" ? (
                          <form action={updateMeetingStatusAction}>
                            <input name="encontroId" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="realizado" />
                            <button className="text-button" type="submit">
                              Realizado
                            </button>
                          </form>
                        ) : null}
                        {item.status !== "cancelado" ? (
                          <form action={updateMeetingStatusAction}>
                            <input name="encontroId" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="cancelado" />
                            <button className="text-button danger" type="submit">
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <form action={updateMeetingStatusAction}>
                            <input name="encontroId" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="previsto" />
                            <button className="text-button" type="submit">
                              Reativar
                            </button>
                          </form>
                        )}
                        <details className="row-editor">
                          <summary className="text-button">Editar</summary>
                          <form
                            className="form-grid compact"
                            action={updateMeetingDetailsAction}
                          >
                            <input
                              name="encontroId"
                              type="hidden"
                              value={item.id}
                            />
                            <div className="field">
                              <label htmlFor={`encontro-data-${item.id}`}>
                                Data
                              </label>
                              <input
                                id={`encontro-data-${item.id}`}
                                name="data"
                                type="date"
                                defaultValue={item.dataInput}
                                required
                              />
                            </div>
                            <div className="split">
                              <div className="field">
                                <label htmlFor={`encontro-inicio-${item.id}`}>
                                  Início
                                </label>
                                <input
                                  id={`encontro-inicio-${item.id}`}
                                  name="horarioInicio"
                                  type="time"
                                  defaultValue={item.horarioInicio}
                                  required
                                />
                              </div>
                              <div className="field">
                                <label htmlFor={`encontro-fim-${item.id}`}>
                                  Fim
                                </label>
                                <input
                                  id={`encontro-fim-${item.id}`}
                                  name="horarioFim"
                                  type="time"
                                  defaultValue={item.horarioFim}
                                  required
                                />
                              </div>
                            </div>
                            <div className="field">
                              <label htmlFor={`encontro-modalidade-${item.id}`}>
                                Modalidade
                              </label>
                              <select
                                id={`encontro-modalidade-${item.id}`}
                                name="modalidade"
                                defaultValue={item.modalidade}
                              >
                                <option value="presencial">Presencial</option>
                                <option value="online">Online</option>
                                <option value="hibrido">Híbrido</option>
                              </select>
                            </div>
                            <div className="field">
                              <label htmlFor={`encontro-local-${item.id}`}>
                                Local
                              </label>
                              <input
                                id={`encontro-local-${item.id}`}
                                name="local"
                                defaultValue={item.local ?? ""}
                              />
                            </div>
                            <div className="field">
                              <label htmlFor={`encontro-link-${item.id}`}>
                                Link online
                              </label>
                              <input
                                id={`encontro-link-${item.id}`}
                                name="linkOnline"
                                defaultValue={item.linkOnline ?? ""}
                              />
                            </div>
                            <button className="button" type="submit">
                              Salvar alterações
                            </button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>Nenhum encontro cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="panel">
          <h2>Novo encontro</h2>
          <form className="form-grid" action={createMeetingAction}>
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
            <div className="field">
              <label htmlFor="data">Data</label>
              <input id="data" name="data" type="date" />
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="horarioInicio">Início</label>
                <input id="horarioInicio" name="horarioInicio" type="time" />
              </div>
              <div className="field">
                <label htmlFor="horarioFim">Fim</label>
                <input id="horarioFim" name="horarioFim" type="time" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="modalidade">Modalidade</label>
              <select id="modalidade" name="modalidade" defaultValue="hibrido">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="local">Local</label>
              <input id="local" name="local" placeholder="LaBC" />
            </div>
            <div className="field">
              <label htmlFor="linkOnline">Link online</label>
              <input id="linkOnline" name="linkOnline" placeholder="https://" />
            </div>
            <button
              className="button"
              type="submit"
              disabled={!availableClasses.length}
            >
              Salvar encontro
            </button>
            {!availableClasses.length ? (
              <p className="muted">
                Publique curso e turma sem certificado emitido antes de criar
                encontro.
              </p>
            ) : null}
          </form>
        </aside>
      </section>
    </AppShell>
  );
}

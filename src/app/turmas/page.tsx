import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import { listClasses } from "@/lib/classes";
import { listCourses } from "@/lib/courses";
import { listActiveInstructors } from "@/lib/users";
import { listInstructorAssignments } from "@/lib/instructor-assignments";
import { uiLabel } from "@/lib/ui-labels";
import {
  createClassAction,
  removeInstructorAssignmentAction,
  updateClassInstructorAction,
  updateClassStatusAction
} from "./actions";
import { CopyRegistrationLink } from "./copy-registration-link";

type PageProps = {
  searchParams?: Promise<{
    cursoId?: string;
  }>;
};

export default async function ClassesPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission(["courses.publish", "enrollments.manage"]);
  const params = await searchParams;
  const [classes, courses, instructors, assignments] = await Promise.all([
    listClasses(user),
    listCourses(user),
    listActiveInstructors(),
    listInstructorAssignments(user)
  ]);
  const availableCourses = courses.filter(
    (course) => course.status !== "arquivado"
  );
  const selectedCourseId =
    params?.cursoId && availableCourses.some((course) => course.id === params.cursoId)
      ? params.cursoId
      : availableCourses[0]?.id;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Oferta formativa</p>
          <h1 className="page-title">Turmas</h1>
          <p className="page-copy">
            Vincule turmas a cursos, defina vagas, modalidade, datas e critério
            mínimo de frequência para certificação.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Turmas cadastradas</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Turma</th>
                <th>Curso</th>
                <th>Início</th>
                <th>Vagas</th>
                <th>Instrutor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {classes.length ? (
                classes.map((item) => {
                  const registrationUrl = `${appUrl}/inscricao/${item.id}`;
                  const hasPublicRegistration =
                    item.status === "publicada" &&
                    item.cursoStatus === "publicado";

                  return (
                    <tr key={item.id}>
                      <td>{item.nome}</td>
                      <td>
                        <div>{item.cursoNome}</div>
                        {item.cursoStatus !== "publicado" ? (
                          <span className="muted">Curso {uiLabel(item.cursoStatus)}</span>
                        ) : null}
                      </td>
                      <td>{item.dataInicio}</td>
                      <td>{item.vagas}</td>
                      <td>
                        {!item.hasValidCertificates ? (
                          <form
                            className="inline-form"
                            action={updateClassInstructorAction}
                          >
                            <input name="turmaId" type="hidden" value={item.id} />
                            <select
                              aria-label={`Instrutor da turma ${item.nome}`}
                              name="instrutorId"
                              defaultValue={item.instrutorId ?? ""}
                            >
                              <option value="">Sem Instrutor vinculado</option>
                              {instructors.map((instructor) => (
                                <option key={instructor.id} value={instructor.id}>
                                  {instructor.nome}
                                </option>
                              ))}
                            </select>
                            <button className="text-button" type="submit">
                              Vincular
                            </button>
                          </form>
                        ) : null}
                        {item.instrutorNome ? (
                          <span className="muted-small">
                            {item.instrutorNome}
                          </span>
                        ) : null}
                        {item.instrutoriaStatus ? (
                          <span className="badge blue">
                            Vínculo {uiLabel(item.instrutoriaStatus)}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={
                            item.status === "publicada"
                              ? "badge"
                              : "badge warning"
                          }
                        >
                          {uiLabel(item.status)}
                        </span>
                        {item.hasValidCertificates ? (
                          <span className="muted-small">certificado emitido</span>
                        ) : null}
                      </td>
                      <td>
                        <div className="inline-actions">
                          {item.status !== "publicada" &&
                          item.cursoStatus === "publicado" ? (
                            <form action={updateClassStatusAction}>
                              <input
                                name="turmaId"
                                type="hidden"
                                value={item.id}
                              />
                              <input
                                name="status"
                                type="hidden"
                                value="publicada"
                              />
                              <button className="text-button" type="submit">
                                Publicar
                              </button>
                            </form>
                          ) : !item.hasValidCertificates ? (
                            <form action={updateClassStatusAction}>
                              <input
                                name="turmaId"
                                type="hidden"
                                value={item.id}
                              />
                              <input
                                name="status"
                                type="hidden"
                                value="rascunho"
                              />
                              <button className="text-button" type="submit">
                                Rascunho
                              </button>
                            </form>
                          ) : null}
                          {item.status !== "encerrada" ? (
                            <form action={updateClassStatusAction}>
                              <input
                                name="turmaId"
                                type="hidden"
                                value={item.id}
                              />
                              <input
                                name="status"
                                type="hidden"
                                value="encerrada"
                              />
                              <button className="text-button" type="submit">
                                Encerrar
                              </button>
                            </form>
                          ) : null}
                          {item.status !== "cancelada" &&
                          !item.hasValidCertificates ? (
                            <form action={updateClassStatusAction}>
                              <input
                                name="turmaId"
                                type="hidden"
                                value={item.id}
                              />
                              <input
                                name="status"
                                type="hidden"
                                value="cancelada"
                              />
                              <button
                                className="text-button danger"
                                type="submit"
                              >
                                Cancelar
                              </button>
                            </form>
                          ) : null}
                          {hasPublicRegistration ? (
                            <a
                              className="text-button"
                              href={`/inscricao/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir inscrição
                            </a>
                          ) : null}
                          {hasPublicRegistration ? (
                            <CopyRegistrationLink url={registrationUrl} />
                          ) : null}
                          <a className="text-button" href={`/turmas/${item.id}/editar`}>
                            Editar
                          </a>
                          {item.status !== "cancelada" &&
                          item.cursoStatus !== "arquivado" ? (
                            <a
                              className="text-button"
                              href={`/materiais?turmaId=${item.id}`}
                            >
                              Material
                            </a>
                          ) : null}
                        </div>
                        {hasPublicRegistration ? (
                          <p className="muted-small">{registrationUrl}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>Nenhuma turma cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="panel">
          <h2>Nova turma</h2>
          <p className="muted">
            Turmas podem ser preparadas enquanto o curso ainda está em rascunho.
            Para abrir inscrições, publique o curso e depois publique a turma.
          </p>
          <form className="form-grid" action={createClassAction}>
            <div className="field">
              <label htmlFor="cursoId">Curso</label>
              <select id="cursoId" name="cursoId" defaultValue={selectedCourseId} required>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.nome} ({uiLabel(course.status)})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="nome">Nome da turma</label>
              <input id="nome" name="nome" placeholder="Turma 2026.1" />
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="dataInicio">Início</label>
                <input id="dataInicio" name="dataInicio" type="date" />
              </div>
              <div className="field">
                <label htmlFor="dataFim">Fim</label>
                <input id="dataFim" name="dataFim" type="date" />
              </div>
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="vagas">Vagas</label>
                <input id="vagas" name="vagas" placeholder="40" />
              </div>
              <div className="field">
                <label htmlFor="criterioFrequenciaMinima">Frequência</label>
                <input
                  id="criterioFrequenciaMinima"
                  name="criterioFrequenciaMinima"
                  placeholder="75"
                />
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
              <label htmlFor="instrutorId">Vincular usuário como Instrutor</label>
              <select id="instrutorId" name="instrutorId" defaultValue="">
                <option value="">Selecionar depois</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.nome}
                  </option>
                ))}
              </select>
              <p className="muted-small">
                Ao selecionar um Instrutor, será criado um vínculo específico
                para esta turma e seu período.
              </p>
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
              disabled={!availableCourses.length}
            >
              Salvar turma
            </button>
            {!availableCourses.length ? (
              <p className="muted">Crie um curso ativo antes de criar uma turma.</p>
            ) : null}
          </form>
        </aside>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Governança pedagógica</p>
            <h2>Vínculos de Instrutores</h2>
            <p className="muted-small">
              Cada atuação é vinculada a uma turma e preservada no histórico
              após o encerramento.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Instrutor</th>
                <th>Curso / Turma</th>
                <th>Status</th>
                <th>Período</th>
                <th>Criado por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    {assignment.instrutorNome}
                    <span className="muted-small">{assignment.instrutorEmail}</span>
                  </td>
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
                  <td>{assignment.atribuidoPorNome}</td>
                  <td>
                    {["ativo", "agendado"].includes(assignment.status) ? (
                      <form action={removeInstructorAssignmentAction}>
                        <input name="vinculoId" type="hidden" value={assignment.id} />
                        <button className="text-button danger" type="submit">
                          Encerrar vínculo
                        </button>
                      </form>
                    ) : (
                      <span className="muted-small">
                        {assignment.motivoDesativacao ?? "Histórico preservado"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!assignments.length ? (
                <tr>
                  <td colSpan={6}>Nenhum vínculo de instrutoria registrado.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

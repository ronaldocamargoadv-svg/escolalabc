import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import { listCourses } from "@/lib/courses";
import { hasPermission } from "@/lib/permissions";
import { uiLabel } from "@/lib/ui-labels";
import {
  createCourseAction,
  updateCourseStatusAction
} from "./actions";

export default async function CoursesPage() {
  const user = await requireAnyPermission([
    "courses.create",
    "courses.edit",
    "courses.publish"
  ]);
  const courses = await listCourses(user);
  const canCreateCourse = hasPermission(user, "courses.create");
  const canEditCourse = hasPermission(user, "courses.edit");
  const canPublishCourse = hasPermission(user, "courses.publish");

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Gestão acadêmica</p>
          <h1 className="page-title">Cursos e turmas</h1>
          <p className="page-copy">
            Área inicial para cadastrar ofertas formativas, organizar turmas,
            controlar vagas e preparar critérios de certificação.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Catálogo administrativo</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Modalidade</th>
                <th>Carga horária</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.nome}</td>
                  <td>{uiLabel(course.modalidade)}</td>
                  <td>{course.cargaHoraria}h</td>
                  <td>
                    <span
                      className={
                        course.status === "publicado"
                          ? "badge"
                          : "badge warning"
                      }
                    >
                      {uiLabel(course.status)}
                    </span>
                    {course.hasValidCertificates ? (
                      <span className="muted-small">certificado emitido</span>
                    ) : null}
                  </td>
                  <td>
                    <div className="inline-actions">
                      {canPublishCourse && course.status !== "publicado" ? (
                        <form action={updateCourseStatusAction}>
                          <input name="cursoId" type="hidden" value={course.id} />
                          <input name="status" type="hidden" value="publicado" />
                          <button className="text-button" type="submit">
                            Publicar
                          </button>
                        </form>
                      ) : canPublishCourse && !course.hasValidCertificates ? (
                        <form action={updateCourseStatusAction}>
                          <input name="cursoId" type="hidden" value={course.id} />
                          <input name="status" type="hidden" value="rascunho" />
                          <button className="text-button" type="submit">
                            Rascunho
                          </button>
                        </form>
                      ) : null}
                      {canPublishCourse &&
                      course.status !== "arquivado" &&
                      !course.hasValidCertificates ? (
                        <form action={updateCourseStatusAction}>
                          <input name="cursoId" type="hidden" value={course.id} />
                          <input name="status" type="hidden" value="arquivado" />
                          <button className="text-button danger" type="submit">
                            Arquivar
                          </button>
                        </form>
                      ) : null}
                      {canEditCourse ? (
                        <a className="text-button" href={`/cursos/${course.id}/editar`}>
                          Editar
                        </a>
                      ) : null}
                      {canPublishCourse && course.status !== "arquivado" ? (
                        <a className="text-button" href={`/turmas?cursoId=${course.id}`}>
                          Criar turma
                        </a>
                      ) : null}
                      {canEditCourse && course.status !== "arquivado" ? (
                        <a className="text-button" href={`/materiais?cursoId=${course.id}`}>
                          Material
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canCreateCourse ? (
        <aside className="panel">
          <h2>Novo curso</h2>
          <form className="form-grid" action={createCourseAction}>
            <div className="field">
              <label htmlFor="nome">Nome</label>
              <input id="nome" name="nome" placeholder="Ex.: Laboratório de ideias" />
            </div>
            <div className="field">
              <label htmlFor="modalidade">Modalidade</label>
              <select id="modalidade" name="modalidade" defaultValue="hibrido">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="carga">Carga horária</label>
                <input id="carga" name="cargaHoraria" placeholder="12" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="tema">Tema</label>
              <input id="tema" name="tema" placeholder="Inovação pública" />
            </div>
            <div className="field">
              <label htmlFor="ementa">Ementa</label>
              <textarea id="ementa" name="ementa" placeholder="Resumo do conteúdo..." />
            </div>
            <button className="button" type="submit">
              Salvar rascunho
            </button>
          </form>
        </aside>
        ) : null}
      </section>
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { getCourseDetails } from "@/lib/courses";
import { updateCourseDetailsAction } from "../../actions";

type PageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function EditCoursePage({ params }: PageProps) {
  const user = await requirePermission("courses.edit");
  const { cursoId } = await params;
  const course = await getCourseDetails(cursoId);

  if (!course) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Edição administrativa</p>
          <h1 className="page-title">Editar curso</h1>
          <p className="page-copy">
            Atualize os dados essenciais do programa formativo antes de publicar
            ou compartilhar a oferta com os alunos.
          </p>
        </div>
        <a className="button secondary" href="/cursos">
          Voltar para cursos
        </a>
      </section>

      <section className="panel edit-panel">
        <form className="form-grid" action={updateCourseDetailsAction}>
          <input name="cursoId" type="hidden" value={course.id} />
          <input name="redirectTo" type="hidden" value="/cursos" />
          <div className="field">
            <label htmlFor="nome">Nome do curso</label>
            <input id="nome" name="nome" defaultValue={course.nome} required />
          </div>
          <div className="split">
            <div className="field">
              <label htmlFor="modalidade">Modalidade</label>
              <select
                id="modalidade"
                name="modalidade"
                defaultValue={course.modalidade}
              >
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="cargaHoraria">Carga horária</label>
              <input
                id="cargaHoraria"
                name="cargaHoraria"
                defaultValue={course.cargaHoraria}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="tema">Tema</label>
            <input id="tema" name="tema" defaultValue={course.tema ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="ementa">Ementa</label>
            <textarea
              id="ementa"
              name="ementa"
              defaultValue={course.ementa}
              required
            />
          </div>
          <div className="action-row">
            <button className="button" type="submit">
              Salvar alterações
            </button>
            <a className="button secondary" href="/cursos">
              Cancelar
            </a>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

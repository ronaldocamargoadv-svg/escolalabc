import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import { getClassDetails } from "@/lib/classes";
import { listActiveInstructors } from "@/lib/users";
import { updateClassDetailsAction } from "../../actions";

type PageProps = {
  params: Promise<{
    turmaId: string;
  }>;
};

export default async function EditClassPage({ params }: PageProps) {
  const user = await requireAnyPermission(["courses.publish", "enrollments.manage"]);
  const { turmaId } = await params;
  const [turma, instructors] = await Promise.all([
    getClassDetails(turmaId),
    listActiveInstructors()
  ]);

  if (!turma) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Edição da oferta</p>
          <h1 className="page-title">Editar turma</h1>
          <p className="page-copy">
            Ajuste datas, vagas, modalidade, instrutor e parâmetros de
            frequência da turma vinculada ao curso {turma.cursoNome}.
          </p>
        </div>
        <a className="button secondary" href="/turmas">
          Voltar para turmas
        </a>
      </section>

      {turma.hasValidCertificates ? (
        <section className="panel">
          <h2>Edição bloqueada</h2>
          <p className="muted">
            Esta turma já possui certificado emitido. Para preservar a
            integridade dos registros, a edição estrutural foi bloqueada.
          </p>
        </section>
      ) : (
        <section className="panel edit-panel">
          <form className="form-grid" action={updateClassDetailsAction}>
            <input name="turmaId" type="hidden" value={turma.id} />
            <input name="redirectTo" type="hidden" value="/turmas" />
            <div className="field">
              <label htmlFor="nome">Nome da turma</label>
              <input id="nome" name="nome" defaultValue={turma.nome} required />
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="dataInicio">Início</label>
                <input
                  id="dataInicio"
                  name="dataInicio"
                  type="date"
                  defaultValue={turma.dataInicioInput}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="dataFim">Fim</label>
                <input
                  id="dataFim"
                  name="dataFim"
                  type="date"
                  defaultValue={turma.dataFimInput ?? ""}
                />
              </div>
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="vagas">Vagas</label>
                <input id="vagas" name="vagas" defaultValue={turma.vagas} required />
              </div>
              <div className="field">
                <label htmlFor="criterioFrequenciaMinima">
                  Frequência mínima
                </label>
                <input
                  id="criterioFrequenciaMinima"
                  name="criterioFrequenciaMinima"
                  defaultValue={turma.criterioFrequenciaMinima}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="modalidade">Modalidade</label>
              <select
                id="modalidade"
                name="modalidade"
                defaultValue={turma.modalidade}
              >
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="instrutorId">Instrutor</label>
              <select
                id="instrutorId"
                name="instrutorId"
                defaultValue={turma.instrutorId ?? ""}
              >
                <option value="">Sem instrutor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="local">Local</label>
              <input id="local" name="local" defaultValue={turma.local ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="linkOnline">Link online</label>
              <input
                id="linkOnline"
                name="linkOnline"
                defaultValue={turma.linkOnline ?? ""}
              />
            </div>
            <div className="action-row">
              <button className="button" type="submit">
                Salvar alterações
              </button>
              <a className="button secondary" href="/turmas">
                Cancelar
              </a>
            </div>
          </form>
        </section>
      )}
    </AppShell>
  );
}

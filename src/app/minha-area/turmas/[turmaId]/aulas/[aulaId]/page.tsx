import { notFound } from "next/navigation";
import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { getLessonExperience, ProgressAccessError } from "@/lib/progress";
import { uiLabel } from "@/lib/ui-labels";
import { completeLessonAction } from "../../actions";
import { recordMaterialAccessAction } from "../../actions";

type PageProps = {
  params: Promise<{
    turmaId: string;
    aulaId: string;
  }>;
};

export default async function LessonPage({ params }: PageProps) {
  const user = await requireCurrentUser();
  const { turmaId, aulaId } = await params;
  let aula;

  try {
    aula = await getLessonExperience(user.id, turmaId, aulaId);
  } catch (error) {
    if (error instanceof ProgressAccessError) {
      notFound();
    }

    throw error;
  }

  if (!aula) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface course-hero">
        <div>
          <p className="eyebrow">Aula da turma</p>
          <h1 className="page-title">{aula.curso}</h1>
          <p className="page-copy">
            {aula.turma} - {aula.data}, das {aula.horario_inicio} às{" "}
            {aula.horario_fim}. Este acesso foi registrado no acompanhamento
            pedagógico da Escola LaBC de Inovação.
          </p>
          <div className="hero-actions">
            <a className="button secondary" href={`/minha-area/turmas/${turmaId}`}>
              Voltar ao curso
            </a>
            {!aula.concluida ? (
              <form action={completeLessonAction}>
                <input name="turmaId" type="hidden" value={turmaId} />
                <input name="aulaId" type="hidden" value={aulaId} />
                <button className="button" type="submit">
                  Marcar aula como concluída
                </button>
              </form>
            ) : (
              <span className="badge blue">Aula concluída</span>
            )}
          </div>
        </div>
        <UserPill user={user} />
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Dados da aula</h2>
          <dl className="definition-grid">
            <div>
              <dt>Data</dt>
              <dd>{aula.data}</dd>
            </div>
            <div>
              <dt>Modalidade</dt>
              <dd>{uiLabel(aula.modalidade)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{uiLabel(aula.status)}</dd>
            </div>
            <div>
              <dt>Ambiente</dt>
              <dd>{aula.local ?? aula.link_online ?? "Ambiente LaBC"}</dd>
            </div>
            <div>
              <dt>Quantidade de acessos</dt>
              <dd>{aula.quantidade_acessos ?? 0}</dd>
            </div>
            <div>
              <dt>Último acesso</dt>
              <dd>{aula.ultimo_acesso ?? "Registrado agora"}</dd>
            </div>
          </dl>

          <h3 style={{ marginTop: 22 }}>Informes da aula</h3>
          <p className="page-copy">
            Consulte os materiais vinculados ao curso, acompanhe o debate da
            turma e marque a conclusão quando finalizar o estudo desta aula.
          </p>
        </div>

        <aside className="panel">
          <h2>Próxima ação recomendada</h2>
          <ul className="checklist">
            <li>
              <span className="check">1</span>
              <span>Leia os materiais de apoio vinculados à turma.</span>
            </li>
            <li>
              <span className="check">2</span>
              <span>Participe do debate com dúvidas ou exemplos do seu setor.</span>
            </li>
            <li>
              <span className="check">3</span>
              <span>Marque a aula como concluída para atualizar seu progresso.</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <h2>Materiais de apoio</h2>
        <p className="muted">
          Conteúdos publicados pelo Instrutor para apoiar o estudo desta aula.
        </p>
        <div className="stack-list">
          {aula.materiais.length ? (
            aula.materiais.map((material: {
              id: string;
              titulo: string;
              descricao: string | null;
              tipo: string;
              url: string | null;
              publicado_em: string;
            }) => (
              <article className="list-card" key={material.id}>
                <div>
                  <strong>{material.titulo}</strong>
                  <span>
                    {uiLabel(material.tipo)} - publicado em {material.publicado_em}
                  </span>
                  {material.descricao ? <p className="muted-small">{material.descricao}</p> : null}
                </div>
                {material.url ? (
                  <div className="inline-actions">
                    <form action={recordMaterialAccessAction}>
                      <input name="turmaId" type="hidden" value={turmaId} />
                      <input name="materialId" type="hidden" value={material.id} />
                      <button className="button secondary" type="submit">
                        Acessar material
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="muted">Nenhum material de apoio foi disponibilizado para esta aula.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

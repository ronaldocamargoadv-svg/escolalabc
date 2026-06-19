import { notFound } from "next/navigation";
import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { getCatalogClassDetails } from "@/lib/catalog";
import { uiLabel } from "@/lib/ui-labels";
import { selfEnrollAction } from "../actions";

type PageProps = {
  params: Promise<{
    turmaId: string;
  }>;
};

export default async function CatalogClassDetailsPage({ params }: PageProps) {
  const user = await requireCurrentUser();
  const { turmaId } = await params;
  const item = await getCatalogClassDetails(user.id, turmaId);

  if (!item) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface course-hero">
        <div>
          <p className="eyebrow">{item.tema ?? "Oferta formativa"}</p>
          <h1 className="page-title">{item.curso}</h1>
          <p className="page-copy">
            {item.descricao ??
              "Experiência formativa da Escola LaBC de Inovação para fortalecer competências em inovação pública, governo digital e melhoria de serviços."}
          </p>
          <div className="hero-actions">
            {item.inscrito ? (
              <a className="button" href={`/minha-area/turmas/${item.id}`}>
                Iniciar curso
              </a>
            ) : item.vagasDisponiveis > 0 ? (
              <form action={selfEnrollAction}>
                <input name="turmaId" type="hidden" value={item.id} />
                <button className="button" type="submit">
                  Inscrever-se nesta turma
                </button>
              </form>
            ) : (
              <button className="button secondary" disabled type="button">
                Sem vagas
              </button>
            )}
            <a className="button secondary" href="/catalogo">
              Voltar ao catálogo
            </a>
          </div>
        </div>
        <UserPill user={user} />
      </section>

      <section className="course-facts" aria-label="Informações essenciais do curso">
        <article>
          <span>Modalidade</span>
          <strong>{uiLabel(item.modalidade)}</strong>
        </article>
        <article>
          <span>Carga horária</span>
          <strong>{item.cargaHoraria}h</strong>
        </article>
        <article>
          <span>Início</span>
          <strong>{item.dataInicio}</strong>
        </article>
        <article>
          <span>Vagas</span>
          <strong>{item.vagasDisponiveis} livres</strong>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Detalhes da experiência formativa</h2>
          <dl className="definition-grid">
            <div>
              <dt>Turma</dt>
              <dd>{item.turma}</dd>
            </div>
            <div>
              <dt>Modalidade</dt>
              <dd>{uiLabel(item.modalidade)}</dd>
            </div>
            <div>
              <dt>Início</dt>
              <dd>{item.dataInicio}</dd>
            </div>
            <div>
              <dt>Carga horária</dt>
              <dd>{item.cargaHoraria}h</dd>
            </div>
            <div>
              <dt>Instrutor</dt>
              <dd>{item.instrutor ?? "A definir"}</dd>
              {item.instrutorLattesUrl ? (
                <a
                  className="text-button"
                  href={item.instrutorLattesUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Currículo Lattes
                </a>
              ) : null}
            </div>
            <div>
              <dt>Frequência mínima</dt>
              <dd>{item.criterioFrequenciaMinima}%</dd>
            </div>
            <div>
              <dt>Vagas</dt>
              <dd>
                {item.vagasDisponiveis} disponíveis de {item.vagas}
              </dd>
            </div>
          </dl>

          <h3 style={{ marginTop: 22 }}>Objetivos</h3>
          <p className="page-copy">
            {item.objetivos ??
              "Objetivos detalhados serão publicados pela equipe responsável pela turma."}
          </p>

          <h3 style={{ marginTop: 22 }}>Ementa</h3>
          <p className="page-copy">
            {item.ementa ?? "Ementa em organização pela equipe da Escola LaBC de Inovação."}
          </p>

          <h3 style={{ marginTop: 22 }}>Público-alvo</h3>
          <p className="page-copy">
            {item.publicoAlvo ??
              "Servidores, agentes públicos e alunos vinculados às iniciativas formativas do LaBC."}
          </p>

          <div className="progress-row" style={{ marginTop: 22 }}>
            <span>Ocupação</span>
            <span>{item.vagas - item.vagasDisponiveis} inscritos</span>
          </div>
          <div className="progress-track">
            <span
              style={{
                width: `${Math.min(
                  Math.round(((item.vagas - item.vagasDisponiveis) / Math.max(item.vagas, 1)) * 100),
                  100
                )}%`
              }}
            />
          </div>
        </div>

        <aside className="panel">
          <h2>Cronograma de aulas e encontros</h2>
          <ul className="checklist">
            {item.encontros.map((meeting) => (
              <li key={meeting.id}>
                <span className="check">{meeting.modalidade.slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{meeting.data}</strong>
                  <br />
                  {meeting.horarioInicio} às {meeting.horarioFim} - {uiLabel(meeting.status)}
                  <br />
                  <span className="muted-small">
                    {meeting.local ?? meeting.linkOnline ?? "Ambiente LaBC"}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: 24 }}>Materiais</h2>
          <div className="stack-list">
            {item.materiais.length ? (
              item.materiais.map((material) => (
                <article className="list-card" key={material.id}>
                  <strong>{material.titulo}</strong>
                  <span>{uiLabel(material.tipo)}</span>
                  {material.url ? (
                    <a
                      className="table-link"
                      href={material.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Abrir material
                    </a>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="muted-small">Materiais serão liberados pela equipe.</p>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

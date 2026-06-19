import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { listCatalogClasses } from "@/lib/catalog";
import { uiLabel } from "@/lib/ui-labels";
import { selfEnrollAction } from "./actions";

type CatalogPageProps = {
  searchParams?: Promise<{
    modalidade?: string;
    status?: string;
    carga?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const user = await requireCurrentUser();
  const filters = searchParams ? await searchParams : {};
  const classes = await listCatalogClasses(user.id);
  const filteredClasses = classes.filter((item) => {
    const byModality =
      !filters.modalidade || filters.modalidade === "todas"
        ? true
        : item.modalidade === filters.modalidade;
    const byStatus =
      !filters.status || filters.status === "todos"
        ? true
        : item.status === filters.status;
    const byWorkload =
      !filters.carga || filters.carga === "todas"
        ? true
        : filters.carga === "curta"
          ? Number(item.cargaHoraria ?? 0) <= 20
          : Number(item.cargaHoraria ?? 0) > 20;

    return byModality && byStatus && byWorkload;
  });

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface catalog-hero">
        <div>
          <p className="eyebrow">Catálogo formativo</p>
          <h1 className="page-title">Aprendizagem para transformar serviços públicos</h1>
          <p className="page-copy">
            Cursos, trilhas e experiências formativas em governo digital,
            colaboração, dados e melhoria de serviços.
          </p>
        </div>
        <UserPill user={user} />
      </section>

      <form className="filter-bar" action="/catalogo">
        <label>
          <span>Modalidade</span>
          <select defaultValue={filters.modalidade ?? "todas"} name="modalidade">
            <option value="todas">Todas</option>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrida</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={filters.status ?? "todos"} name="status">
            <option value="todos">Todos</option>
            <option value="publicada">Publicada</option>
            <option value="encerrada">Encerrada</option>
          </select>
        </label>
        <label>
          <span>Carga horária</span>
          <select defaultValue={filters.carga ?? "todas"} name="carga">
            <option value="todas">Todas</option>
            <option value="curta">Até 20h</option>
            <option value="longa">Acima de 20h</option>
          </select>
        </label>
        <button className="button" type="submit">
          Filtrar cursos
        </button>
        <a className="button secondary" href="/catalogo">
          Limpar
        </a>
      </form>

      <section className="catalog-grid">
        {filteredClasses.length ? (
          filteredClasses.map((item) => (
            <article className="catalog-card" key={item.id}>
              <div>
                <div className="card-heading-row">
                  <p className="eyebrow">{item.tema ?? uiLabel(item.modalidade)}</p>
                  <span className="badge blue">{uiLabel(item.modalidade)}</span>
                </div>
                <h2>{item.curso}</h2>
                <p>{item.descricao ?? "Turma disponível para inscrição."}</p>
              </div>

              <dl className="definition-grid">
                <div>
                  <dt>Turma</dt>
                  <dd>{item.turma}</dd>
                </div>
                <div>
                  <dt>Início</dt>
                  <dd>{item.dataInicio}</dd>
                </div>
                <div>
                  <dt>Modalidade</dt>
                  <dd>{uiLabel(item.modalidade)}</dd>
                </div>
                <div>
                  <dt>Carga</dt>
                  <dd>{item.cargaHoraria}h</dd>
                </div>
                <div>
                  <dt>Vagas</dt>
                  <dd>
                    {item.vagasDisponiveis} de {item.vagas}
                  </dd>
                </div>
              </dl>

              <div>
                <div className="progress-row">
                  <span>Ocupação da turma</span>
                  <span>{item.inscritos} inscritos</span>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${Math.min(
                        Math.round((item.inscritos / Math.max(item.vagas, 1)) * 100),
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              <div className="action-row compact">
                <a className="button secondary" href={`/catalogo/${item.id}`}>
                  Ver detalhes
                </a>
                <span
                  className={
                    item.status === "publicada" ? "badge" : "badge warning"
                  }
                >
                  {uiLabel(item.status)}
                </span>
                {item.inscrito ? (
                  <span className="badge blue">Inscrito</span>
                ) : null}
              </div>

              {item.inscrito ? (
                <a className="button secondary" href="/minha-area">
                  Ver minha área
                </a>
              ) : item.vagasDisponiveis > 0 ? (
                <form action={selfEnrollAction}>
                  <input name="turmaId" type="hidden" value={item.id} />
                  <button className="button" type="submit">
                    Inscrever-se
                  </button>
                </form>
              ) : (
                <button className="button secondary" disabled type="button">
                  Sem vagas
                </button>
              )}
            </article>
          ))
        ) : (
          <div className="panel">
            <h2>Nenhuma turma encontrada</h2>
            <p className="page-copy">
              Ajuste os filtros ou acompanhe novas ofertas formativas da Escola
              LaBC.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

import { AppShell } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import {
  canManageAllMaterials,
  listMaterialLessons,
  listMaterials
} from "@/lib/materials";
import { uiLabel } from "@/lib/ui-labels";
import {
  createMaterialAction,
  deleteMaterialAction,
  updateMaterialDetailsAction
} from "./actions";

type PageProps = {
  searchParams?: Promise<{ aulaId?: string; turmaId?: string }>;
};

const materialTypes = [
  "pdf",
  "documento",
  "apresentacao",
  "planilha",
  "imagem",
  "link",
  "video",
  "texto",
  "atividade",
  "referencia"
] as const;

export default async function MaterialsPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission([
    "materials.manage_all",
    "materials.view_own_class"
  ]);
  const params = await searchParams;
  const [materials, lessons] = await Promise.all([
    listMaterials(user),
    listMaterialLessons(user)
  ]);
  const selectedLessonId =
    params?.aulaId && lessons.some((lesson) => lesson.id === params.aulaId)
      ? params.aulaId
      : params?.turmaId
        ? (lessons.find((lesson) => lesson.turmaId === params.turmaId)?.id ?? "")
      : "";
  const manager = canManageAllMaterials(user);

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Conteúdo formativo</p>
          <h1 className="page-title">Materiais da aula</h1>
          <p className="page-copy">
            Organize materiais de apoio vinculados às aulas. O aluno visualiza
            somente conteúdos publicados na turma em que está inscrito.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Materiais cadastrados</h2>
          {!manager ? (
            <p className="muted">
              Turmas concluídas permanecem disponíveis para consulta, sem alteração
              de conteúdo pelo Instrutor.
            </p>
          ) : null}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Aula / Turma</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {materials.length ? (
                  materials.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.titulo}</strong>
                        <span className="muted-small">
                          {uiLabel(item.tipo)} - {item.autor ?? "Escola LaBC"}
                        </span>
                        {item.descricao ? (
                          <span className="muted-small">{item.descricao}</span>
                        ) : null}
                      </td>
                      <td>
                        {item.aula}
                        <span className="muted-small">
                          {item.turma} - {item.curso}
                        </span>
                      </td>
                      <td>
                        <span className="badge blue">{uiLabel(item.situacao)}</span>
                      </td>
                      <td>
                        <div className="inline-actions">
                          {item.url ? (
                            <a
                              className="table-link"
                              href={item.url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              Abrir
                            </a>
                          ) : null}
                          {item.canEdit ? (
                            <>
                              <details className="row-editor">
                                <summary className="text-button">Editar</summary>
                                <form className="form-grid compact" action={updateMaterialDetailsAction}>
                                  <input name="materialId" type="hidden" value={item.id} />
                                  <div className="field">
                                    <label htmlFor={`titulo-${item.id}`}>Título</label>
                                    <input id={`titulo-${item.id}`} name="titulo" defaultValue={item.titulo} required />
                                  </div>
                                  <div className="field">
                                    <label htmlFor={`descricao-${item.id}`}>Descrição</label>
                                    <textarea id={`descricao-${item.id}`} name="descricao" defaultValue={item.descricao ?? ""} />
                                  </div>
                                  <div className="field">
                                    <label htmlFor={`url-${item.id}`}>Link do material</label>
                                    <input id={`url-${item.id}`} name="url" defaultValue={item.url ?? ""} required />
                                  </div>
                                  <div className="split">
                                    <div className="field">
                                      <label htmlFor={`tipo-${item.id}`}>Tipo</label>
                                      <select id={`tipo-${item.id}`} name="tipo" defaultValue={item.tipo}>
                                        {materialTypes.map((tipo) => (
                                          <option key={tipo} value={tipo}>{uiLabel(tipo)}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="field">
                                      <label htmlFor={`situacao-${item.id}`}>Situação</label>
                                      <select id={`situacao-${item.id}`} name="situacao" defaultValue={item.situacao}>
                                        <option value="rascunho">Rascunho</option>
                                        <option value="publicado">Publicado</option>
                                        <option value="oculto">Oculto</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="field">
                                    <label htmlFor={`ordem-${item.id}`}>Ordem</label>
                                    <input id={`ordem-${item.id}`} name="ordem" type="number" min="0" defaultValue={item.ordem} />
                                  </div>
                                  <button className="button" type="submit">Salvar alterações</button>
                                </form>
                              </details>
                              <form action={deleteMaterialAction}>
                                <input name="materialId" type="hidden" value={item.id} />
                                <button className="text-button danger" type="submit">
                                  Excluir
                                </button>
                              </form>
                            </>
                          ) : (
                            <span className="muted-small">Somente consulta</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>Nenhum material de apoio cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel">
          <h2>Adicionar material</h2>
          <p className="muted">
            Nesta etapa, os materiais são cadastrados por link seguro. O envio
            direto de arquivos será habilitado em evolução futura.
          </p>
          <form className="form-grid" action={createMaterialAction}>
            <div className="field">
              <label htmlFor="aulaId">Aula vinculada</label>
              <select id="aulaId" name="aulaId" defaultValue={selectedLessonId} required>
                <option value="">Selecionar aula</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.data} {lesson.horario} - {lesson.turma} ({lesson.curso})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="titulo">Título do material</label>
              <input id="titulo" name="titulo" placeholder="Guia de leitura da aula" required />
            </div>
            <div className="field">
              <label htmlFor="descricao">Descrição</label>
              <textarea id="descricao" name="descricao" placeholder="Orientações breves para os alunos." />
            </div>
            <div className="field">
              <label htmlFor="url">Link do material</label>
              <input id="url" name="url" placeholder="https://..." required />
            </div>
            <div className="split">
              <div className="field">
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" name="tipo" defaultValue="pdf">
                  {materialTypes.map((tipo) => (
                    <option key={tipo} value={tipo}>{uiLabel(tipo)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ordem">Ordem</label>
                <input id="ordem" name="ordem" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <div className="action-row">
              <button className="button secondary" name="situacao" value="rascunho" type="submit" disabled={!lessons.length}>
                Salvar como rascunho
              </button>
              <button className="button" name="situacao" value="publicado" type="submit" disabled={!lessons.length}>
                Publicar
              </button>
            </div>
            {!lessons.length ? (
              <p className="muted">
                Você não possui aulas de turma ativa disponíveis para novos materiais.
              </p>
            ) : null}
          </form>
        </aside>
      </section>
    </AppShell>
  );
}

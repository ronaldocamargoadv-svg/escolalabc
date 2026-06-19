import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { uiLabel } from "@/lib/ui-labels";
import {
  canModerateForum,
  ForumAccessError,
  getForumDetails,
  listForumClasses
} from "@/lib/forum";
import {
  createForumCommentAction,
  createForumTopicAction,
  moderateForumContentAction
} from "./actions";

type ForumPageProps = {
  searchParams?: Promise<{
    turmaId?: string;
  }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const user = await requireCurrentUser();
  const params = searchParams ? await searchParams : {};
  const classes = await listForumClasses(user);
  const selectedClassId = params.turmaId ?? classes[0]?.id;
  const forum = selectedClassId ? await loadForum(user, selectedClassId) : null;
  const canModerate = canModerateForum(user);

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface forum-hero">
        <div>
          <p className="eyebrow">Comunidade de aprendizagem</p>
          <h1 className="page-title">Debates e comunidades de prática</h1>
          <p className="page-copy">
            Registre dúvidas, compartilhe repertório e transforme cada turma em
            um espaço de colaboração entre servidores, instrutores e gestores.
          </p>
        </div>
        <UserPill user={user} />
      </section>

      <section className="content-grid">
        <aside className="panel">
          <h2>Turmas disponíveis</h2>
          <div className="stack-list">
            {classes.length ? (
              classes.map((item) => (
                <Link
                  className={`list-card ${item.id === selectedClassId ? "selected" : ""}`}
                  href={`/forum?turmaId=${item.id}`}
                  key={item.id}
                >
                  <div>
                    <strong>{item.nome}</strong>
                    <span>{item.curso}</span>
                  </div>
                  <div className="action-row compact">
                    <span className="badge blue">{item.topicos} tópicos</span>
                    <span className="badge">{item.inscricoesAtivas} inscritos</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted-small">
                Nenhuma turma publicada com fórum disponível para seu perfil.
              </p>
            )}
          </div>
        </aside>

        <div className="panel">
          {forum ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>{forum.turma.nome}</h2>
                  <p className="muted-small">{forum.turma.curso}</p>
                </div>
                <span className="badge blue">{forum.topicos.length} tópicos</span>
              </div>

              <form className="form-grid forum-form" action={createForumTopicAction}>
                <input name="turmaId" type="hidden" value={forum.turma.id} />
                <div className="field">
                  <label htmlFor="titulo">Novo tópico</label>
                  <input
                    id="titulo"
                    name="titulo"
                    placeholder="Ex.: Dúvida sobre a atividade final"
                  />
                </div>
                <div className="field">
                  <label htmlFor="conteudo">Mensagem</label>
                  <textarea
                    id="conteudo"
                    name="conteudo"
                    placeholder="Descreva a pergunta ou contribuição para a turma."
                  />
                </div>
                <button className="button" type="submit">
                  Publicar tópico
                </button>
              </form>

              <div className="forum-thread-list">
                {forum.topicos.length ? (
                  forum.topicos.map((topic) => (
                    <article className="forum-thread" key={topic.id}>
                      <div className="section-heading">
                        <div>
                          <h3>{topic.titulo}</h3>
                          <p className="muted-small">
                            {topic.autor} - {topic.criadoEm}
                          </p>
                        </div>
                        <div className="action-row compact">
                          <span className="badge">{uiLabel(topic.status)}</span>
                          {canModerate ? (
                            <form action={moderateForumContentAction}>
                              <input name="turmaId" type="hidden" value={forum.turma.id} />
                              <input name="tipo" type="hidden" value="topico" />
                              <input name="id" type="hidden" value={topic.id} />
                              <input
                                name="status"
                                type="hidden"
                                value={topic.status === "publicado" ? "oculto" : "publicado"}
                              />
                              <button className="text-button" type="submit">
                                {topic.status === "publicado" ? "Ocultar" : "Republicar"}
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                      <p className="forum-copy">{topic.conteudo}</p>

                      <div className="comment-list">
                        {topic.comentarios.map((comment) => (
                          <div className="comment-card" key={comment.id}>
                            <div>
                              <strong>{comment.autor}</strong>
                              <span className="muted-small">{comment.criadoEm}</span>
                            </div>
                            <p>{comment.conteudo}</p>
                            {canModerate ? (
                              <form action={moderateForumContentAction}>
                                <input name="turmaId" type="hidden" value={forum.turma.id} />
                                <input name="tipo" type="hidden" value="comentario" />
                                <input name="id" type="hidden" value={comment.id} />
                                <input
                                  name="status"
                                  type="hidden"
                                  value={
                                    comment.status === "publicado" ? "oculto" : "publicado"
                                  }
                                />
                                <button className="text-button" type="submit">
                                  {comment.status === "publicado" ? "Ocultar" : "Republicar"}
                                </button>
                              </form>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <form className="inline-form forum-comment-form" action={createForumCommentAction}>
                        <input name="turmaId" type="hidden" value={forum.turma.id} />
                        <input name="topicoId" type="hidden" value={topic.id} />
                        <input
                          aria-label={`Comentar em ${topic.titulo}`}
                          name="conteudo"
                          placeholder="Responder ao tópico"
                        />
                        <button className="button secondary" type="submit">
                          Comentar
                        </button>
                      </form>
                    </article>
                  ))
                ) : (
                  <p className="muted-small">Nenhum tópico publicado para esta turma.</p>
                )}
              </div>
            </>
          ) : (
            <p className="muted-small">Selecione uma turma para abrir o fórum.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

async function loadForum(
  user: Awaited<ReturnType<typeof requireCurrentUser>>,
  turmaId: string
) {
  try {
    return await getForumDetails(user, turmaId);
  } catch (error) {
    if (error instanceof ForumAccessError) {
      notFound();
    }

    throw error;
  }
}

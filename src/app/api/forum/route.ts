import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import {
  createForumComment,
  createForumTopic,
  ForumAccessError,
  ForumMutationError,
  getForumDetails,
  listForumClasses,
  updateForumContentStatus
} from "@/lib/forum";

const createTopicSchema = z.object({
  tipo: z.literal("topico").default("topico"),
  turmaId: z.string().uuid(),
  titulo: z.string().trim().min(5).max(160),
  conteudo: z.string().trim().min(10).max(4000)
});

const createCommentSchema = z.object({
  tipo: z.literal("comentario"),
  topicoId: z.string().uuid(),
  conteudo: z.string().trim().min(3).max(2000)
});

const moderationSchema = z.object({
  tipo: z.enum(["topico", "comentario"]),
  id: z.string().uuid(),
  status: z.enum(["publicado", "oculto"])
});

export async function GET(request: Request) {
  const auth = await requireApiPermission("forums.view");
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const turmaId = url.searchParams.get("turmaId");

  if (turmaId) {
    try {
      return NextResponse.json({
        data: await getForumDetails(auth.user, turmaId)
      });
    } catch (error) {
      if (error instanceof ForumAccessError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.status }
        );
      }

      throw error;
    }
  }

  return NextResponse.json({ data: await listForumClasses(auth.user) });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("forums.post");
  if (auth.response) return auth.response;

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;
  const parsed =
    body.tipo === "comentario"
      ? createCommentSchema.safeParse(body)
      : createTopicSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.tipo === "comentario") {
      const comment = await createForumComment({
        user: auth.user,
        topicoId: parsed.data.topicoId,
        conteudo: parsed.data.conteudo
      });

      await writeAuditLog({
        action: "forum.comentario.criado",
        entity: "comentarios",
        entityId: comment.id,
        summary: "Comentário criado via API."
      });

      return NextResponse.json({ data: comment }, { status: 201 });
    }

    const topic = await createForumTopic({
      user: auth.user,
      turmaId: parsed.data.turmaId,
      titulo: parsed.data.titulo,
      conteudo: parsed.data.conteudo
    });

    await writeAuditLog({
      action: "forum.topico.criado",
      entity: "topicos",
      entityId: topic.id,
      summary: `Tópico ${topic.titulo} criado via API.`
    });

    return NextResponse.json({ data: topic }, { status: 201 });
  } catch (error) {
    if (error instanceof ForumAccessError || error instanceof ForumMutationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiPermission("forums.moderate");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = moderationSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const updated = await updateForumContentStatus({
      user: auth.user,
      ...parsed.data
    });

    await writeAuditLog({
      action: `forum.${parsed.data.tipo}.${parsed.data.status}`,
      entity: parsed.data.tipo === "topico" ? "topicos" : "comentarios",
      entityId: updated.id,
      summary: `Conteúdo do fórum alterado para ${parsed.data.status} via API.`
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ForumAccessError || error instanceof ForumMutationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }
}

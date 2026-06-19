"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import {
  createForumComment,
  createForumTopic,
  ForumAccessError,
  ForumMutationError,
  updateForumContentStatus
} from "@/lib/forum";
import { recordForumParticipation } from "@/lib/progress";

const createTopicSchema = z.object({
  turmaId: z.string().uuid(),
  titulo: z.string().min(5),
  conteudo: z.string().min(10)
});

const createCommentSchema = z.object({
  turmaId: z.string().uuid(),
  topicoId: z.string().uuid(),
  conteudo: z.string().min(3)
});

const moderationSchema = z.object({
  turmaId: z.string().uuid(),
  tipo: z.enum(["topico", "comentario"]),
  id: z.string().uuid(),
  status: z.enum(["publicado", "oculto"])
});

export async function createForumTopicAction(formData: FormData) {
  const user = await requirePermission("forums.post");
  const parsed = createTopicSchema.safeParse({
    turmaId: formData.get("turmaId"),
    titulo: formData.get("titulo"),
    conteudo: formData.get("conteudo")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar tópico.");
  }

  let topic;
  try {
    topic = await createForumTopic({ user, ...parsed.data });
  } catch (error) {
    if (error instanceof ForumAccessError || error instanceof ForumMutationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: "forum.topico.criado",
    entity: "topicos",
    entityId: topic.id,
    summary: `Tópico ${topic.titulo} criado.`
  });
  await recordForumParticipation(user.id, parsed.data.turmaId);

  revalidatePath(`/forum?turmaId=${parsed.data.turmaId}`);
}

export async function createForumCommentAction(formData: FormData) {
  const user = await requirePermission("forums.post");
  const parsed = createCommentSchema.safeParse({
    turmaId: formData.get("turmaId"),
    topicoId: formData.get("topicoId"),
    conteudo: formData.get("conteudo")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criar comentário.");
  }

  let comment;
  try {
    comment = await createForumComment({
      user,
      topicoId: parsed.data.topicoId,
      conteudo: parsed.data.conteudo
    });
  } catch (error) {
    if (error instanceof ForumAccessError || error instanceof ForumMutationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: "forum.comentario.criado",
    entity: "comentarios",
    entityId: comment.id,
    summary: "Comentário criado no fórum."
  });
  await recordForumParticipation(user.id, parsed.data.turmaId);

  revalidatePath(`/forum?turmaId=${parsed.data.turmaId}`);
}

export async function moderateForumContentAction(formData: FormData) {
  const user = await requirePermission("forums.moderate");
  const parsed = moderationSchema.safeParse({
    turmaId: formData.get("turmaId"),
    tipo: formData.get("tipo"),
    id: formData.get("id"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para moderação.");
  }

  let updated;
  try {
    updated = await updateForumContentStatus({
      user,
      tipo: parsed.data.tipo,
      id: parsed.data.id,
      status: parsed.data.status
    });
  } catch (error) {
    if (error instanceof ForumAccessError || error instanceof ForumMutationError) {
      throw new Error(error.message);
    }

    throw error;
  }

  await writeAuditLog({
    action: `forum.${parsed.data.tipo}.${parsed.data.status}`,
    entity: parsed.data.tipo === "topico" ? "topicos" : "comentarios",
    entityId: updated.id,
    summary: `Conteúdo do fórum alterado para ${parsed.data.status}.`
  });

  revalidatePath(`/forum?turmaId=${parsed.data.turmaId}`);
}

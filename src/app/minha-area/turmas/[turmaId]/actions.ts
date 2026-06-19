"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import {
  markLessonCompleted,
  recordMaterialOpened
} from "@/lib/progress";

const lessonSchema = z.object({
  turmaId: z.string().uuid(),
  aulaId: z.string().uuid()
});

const materialSchema = z.object({
  turmaId: z.string().uuid(),
  materialId: z.string().uuid()
});

export async function openLessonAction(formData: FormData) {
  await requirePermission("progress.view_own");
  const parsed = lessonSchema.safeParse({
    turmaId: formData.get("turmaId"),
    aulaId: formData.get("aulaId")
  });

  if (!parsed.success) {
    throw new Error("Aula inválida.");
  }

  redirect(`/minha-area/turmas/${parsed.data.turmaId}/aulas/${parsed.data.aulaId}`);
}

export async function completeLessonAction(formData: FormData) {
  const user = await requirePermission("progress.view_own");
  const parsed = lessonSchema.safeParse({
    turmaId: formData.get("turmaId"),
    aulaId: formData.get("aulaId")
  });

  if (!parsed.success) {
    throw new Error("Aula inválida.");
  }

  await markLessonCompleted(user.id, parsed.data.turmaId, parsed.data.aulaId);
  revalidatePath(`/minha-area/turmas/${parsed.data.turmaId}`);
  revalidatePath(`/minha-area/turmas/${parsed.data.turmaId}/aulas/${parsed.data.aulaId}`);
  revalidatePath("/minha-area");
}

export async function recordMaterialAccessAction(formData: FormData) {
  const user = await requirePermission("progress.view_own");
  const parsed = materialSchema.safeParse({
    turmaId: formData.get("turmaId"),
    materialId: formData.get("materialId")
  });

  if (!parsed.success) {
    throw new Error("Material inválido.");
  }

  const destination = await recordMaterialOpened(
    user.id,
    parsed.data.turmaId,
    parsed.data.materialId
  );
  revalidatePath(`/minha-area/turmas/${parsed.data.turmaId}`);
  redirect(destination);
}

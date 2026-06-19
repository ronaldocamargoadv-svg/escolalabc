"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireAnyPermission } from "@/lib/auth";
import {
  createMaterial,
  deleteMaterial,
  isSafeMaterialUrl,
  MaterialCreationError,
  updateMaterialDetails
} from "@/lib/materials";

const materialType = z.enum([
  "link",
  "pdf",
  "video",
  "apresentacao",
  "documento",
  "planilha",
  "imagem",
  "texto",
  "atividade",
  "referencia"
]);
const situation = z.enum(["rascunho", "publicado", "oculto"]);
const editableFields = {
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().max(500).optional(),
  tipo: materialType,
  url: z.string().trim().url().max(500).refine(isSafeMaterialUrl, {
    message: "URL deve usar http ou https."
  }),
  situacao: situation,
  ordem: z.coerce.number().int().min(0).max(999).optional()
};
const createMaterialSchema = z.object({
  ...editableFields,
  aulaId: z.string().uuid()
});
const updateMaterialDetailsSchema = z.object({
  ...editableFields,
  materialId: z.string().uuid()
});
const materialIdSchema = z.object({ materialId: z.string().uuid() });

async function getMaterialsActor() {
  return requireAnyPermission([
    "materials.manage_all",
    "materials.create_own_class",
    "materials.edit_own_class",
    "materials.delete_own_class"
  ]);
}

function materialMutationError(error: unknown): never {
  if (error instanceof MaterialCreationError) {
    throw new Error(error.message);
  }
  throw error;
}

function revalidateMaterials() {
  revalidatePath("/materiais");
  revalidatePath("/minha-area");
  revalidatePath("/catalogo");
}

export async function createMaterialAction(formData: FormData) {
  const user = await getMaterialsActor();
  const parsed = createMaterialSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    tipo: formData.get("tipo"),
    url: formData.get("url"),
    situacao: formData.get("situacao") || "rascunho",
    aulaId: formData.get("aulaId"),
    ordem: formData.get("ordem") || 0
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para adicionar material.");
  }

  let material;
  try {
    material = await createMaterial(parsed.data, user);
  } catch (error) {
    materialMutationError(error);
  }

  await writeAuditLog({
    action:
      material.status_publicacao === "publicado"
        ? "material.publicado"
        : "material.criado",
    entity: "materiais",
    entityId: material.id,
    summary: `Material ${parsed.data.titulo} cadastrado na aula.`
  });
  revalidateMaterials();
}

export async function updateMaterialDetailsAction(formData: FormData) {
  const user = await getMaterialsActor();
  const parsed = updateMaterialDetailsSchema.safeParse({
    materialId: formData.get("materialId"),
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    tipo: formData.get("tipo"),
    url: formData.get("url"),
    situacao: formData.get("situacao"),
    ordem: formData.get("ordem") || 0
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para editar material.");
  }

  let material;
  try {
    material = await updateMaterialDetails(parsed.data.materialId, parsed.data, user);
  } catch (error) {
    materialMutationError(error);
  }

  const action =
    material.status_publicacao === "publicado"
      ? "material.publicado"
      : material.status_publicacao === "oculto"
        ? "material.ocultado"
        : "material.editado";
  await writeAuditLog({
    action,
    entity: "materiais",
    entityId: material.id,
    summary: `Material ${material.titulo} atualizado.`
  });
  revalidateMaterials();
}

export async function deleteMaterialAction(formData: FormData) {
  const user = await getMaterialsActor();
  const parsed = materialIdSchema.safeParse({
    materialId: formData.get("materialId")
  });

  if (!parsed.success) {
    throw new Error("Material inválido.");
  }

  let material;
  try {
    material = await deleteMaterial(parsed.data.materialId, user);
  } catch (error) {
    materialMutationError(error);
  }

  await writeAuditLog({
    action: "material.excluido",
    entity: "materiais",
    entityId: material.id,
    summary: `Material ${material.titulo} excluído.`
  });
  revalidateMaterials();
}

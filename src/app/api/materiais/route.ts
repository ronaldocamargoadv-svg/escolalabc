import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiAnyPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import {
  createMaterial,
  deleteMaterial,
  isSafeMaterialUrl,
  listMaterials,
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
const fields = {
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().max(500).optional(),
  tipo: materialType,
  url: z.string().trim().url().max(500).refine(isSafeMaterialUrl),
  situacao: situation,
  ordem: z.number().int().min(0).max(999).optional()
};
const createSchema = z.object({ ...fields, aulaId: z.string().uuid() }).strict();
const updateSchema = z.object({ ...fields, materialId: z.string().uuid() }).strict();
const deleteSchema = z.object({ materialId: z.string().uuid() }).strict();

async function requireMaterialReadAccess() {
  return requireApiAnyPermission(["materials.manage_all", "materials.view_own_class"]);
}

async function requireMaterialWriteAccess() {
  return requireApiAnyPermission([
    "materials.manage_all",
    "materials.create_own_class",
    "materials.edit_own_class",
    "materials.delete_own_class"
  ]);
}

function respondMaterialError(error: unknown) {
  if (error instanceof MaterialCreationError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status }
    );
  }
  throw error;
}

export async function GET() {
  const auth = await requireMaterialReadAccess();
  if (auth.response) return auth.response;
  return NextResponse.json({ data: await listMaterials(auth.user) });
}

export async function POST(request: Request) {
  const auth = await requireMaterialWriteAccess();
  if (auth.response) return auth.response;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = createSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Dados inválidos." }, { status: 400 });
  }

  try {
    const material = await createMaterial(parsed.data, auth.user);
    await writeAuditLog({
      action: material.status_publicacao === "publicado" ? "material.publicado" : "material.criado",
      entity: "materiais",
      entityId: material.id,
      summary: `Material ${material.titulo} cadastrado via API.`
    });
    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error) {
    return respondMaterialError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireMaterialWriteAccess();
  if (auth.response) return auth.response;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = updateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Dados inválidos." }, { status: 400 });
  }

  try {
    const material = await updateMaterialDetails(parsed.data.materialId, parsed.data, auth.user);
    await writeAuditLog({
      action: material.status_publicacao === "publicado" ? "material.publicado" : "material.editado",
      entity: "materiais",
      entityId: material.id,
      summary: `Material ${material.titulo} atualizado via API.`
    });
    return NextResponse.json({ data: material });
  } catch (error) {
    return respondMaterialError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireMaterialWriteAccess();
  if (auth.response) return auth.response;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = deleteSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Material inválido." }, { status: 400 });
  }

  try {
    const material = await deleteMaterial(parsed.data.materialId, auth.user);
    await writeAuditLog({
      action: "material.excluido",
      entity: "materiais",
      entityId: material.id,
      summary: `Material ${material.titulo} excluído via API.`
    });
    return NextResponse.json({ data: material });
  } catch (error) {
    return respondMaterialError(error);
  }
}

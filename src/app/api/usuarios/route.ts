import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import {
  createUser,
  maskCpf,
  resetUserTemporaryPassword,
  updateUserStatus,
  UserCreationError
} from "@/lib/users";

const createUserSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  cpf: z.string().min(11).max(20),
  email: z.string().trim().toLowerCase().email().max(160),
  perfil: z.string().trim().min(1).max(80),
  telefone: z.string().trim().max(40).optional(),
  orgaoSecretaria: z.string().trim().max(120).optional(),
  cargo: z.string().trim().max(120).optional(),
  lattesUrl: z.string().trim().max(200).optional(),
  matricula: z.string().trim().max(60).optional(),
  vinculo: z.string().trim().max(60).optional()
  ,
  turmaId: z.string().uuid().optional()
}).strict();

const updateUserStatusSchema = z.object({
  usuarioId: z.string().uuid(),
  status: z.enum(["ativo", "inativo"])
}).strict();

const resetUserPasswordSchema = z.object({
  usuarioId: z.string().uuid(),
  acao: z.literal("redefinir_senha")
}).strict();

export async function GET() {
  const auth = await requireApiPermission("users.view");
  if (auth.response) return auth.response;

  const db = getDb();
  const result = await db.query(`
    SELECT
      u.id,
      u.nome,
      u.cpf,
      u.email,
      u.status,
      u.lattes_url,
      COALESCE(array_agg(p.nome) FILTER (WHERE p.nome IS NOT NULL), '{}') AS perfis
    FROM usuarios u
    LEFT JOIN usuario_perfis up ON up.usuario_id = u.id
    LEFT JOIN perfis p ON p.id = up.perfil_id
    GROUP BY u.id
    ORDER BY u.criado_em DESC
  `);

  return NextResponse.json({
    data: result.rows.map((user) => ({
      id: user.id,
      nome: user.nome,
      cpfMascarado: user.cpf ? maskCpf(user.cpf) : null,
      email: user.email,
      status: user.status,
      lattesUrl: user.lattes_url,
      perfis: user.perfis
    }))
  });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("users.create");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = createUserSchema.safeParse(body.data);

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

  let user;
  try {
    user = await createUser(parsed.data, auth.user.id);
  } catch (error) {
    if (error instanceof UserCreationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  await writeAuditLog({
    action: "usuario.criado",
    entity: "usuarios",
    entityId: user.id,
    summary: `Usuário ${user.email} criado.`
  });

  return NextResponse.json(
    {
      data: {
        id: user.id,
        nome: user.nome,
        cpfMascarado: maskCpf(user.cpf),
        email: user.email,
        status: user.status,
        senhaTemporaria: user.senhaTemporaria
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const auth = await requireApiPermission("users.edit");
  if (auth.response) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const passwordReset = resetUserPasswordSchema.safeParse(body.data);

  if (passwordReset.success) {
    const user = await resetUserTemporaryPassword(passwordReset.data.usuarioId);

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    await writeAuditLog({
      action: "usuario.senha_redefinida",
      entity: "usuarios",
      entityId: user.id,
      summary: `Senha de ${user.email} redefinida para senha temporária via API.`
    });

    return NextResponse.json({
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        status: user.status,
        senhaTemporaria: user.senhaTemporaria
      }
    });
  }

  const parsed = updateUserStatusSchema.safeParse(body.data);

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

  let user;
  try {
    user = await updateUserStatus(
      parsed.data.usuarioId,
      parsed.data.status,
      auth.user.id
    );
  } catch (error) {
    if (error instanceof UserCreationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    throw error;
  }

  if (!user) {
    return NextResponse.json(
      { error: "USER_NOT_FOUND", message: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  await writeAuditLog({
    action: `usuario.${parsed.data.status}`,
    entity: "usuarios",
    entityId: user.id,
    summary: `Usuário ${user.email} alterado para ${user.status} via API.`
  });

  return NextResponse.json({ data: user });
}

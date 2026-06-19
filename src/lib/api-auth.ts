import { NextResponse } from "next/server";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { hasAnyPermission, hasPermission } from "@/lib/permissions";

export async function requireApiUser(roles?: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Autenticação obrigatória."
        },
        { status: 401 }
      )
    };
  }

  if (roles && !hasAnyRole(user, roles)) {
    return {
      response: NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Perfil sem permissão para esta operação."
        },
        { status: 403 }
      )
    };
  }

  return { user };
}

export async function requireApiPermission(permission: string) {
  const auth = await requireApiUser();

  if (auth.response) {
    return auth;
  }

  if (!hasPermission(auth.user, permission)) {
    return {
      response: NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Você não possui permissão para executar esta ação."
        },
        { status: 403 }
      )
    };
  }

  return auth;
}

export async function requireApiAnyPermission(permissions: string[]) {
  const auth = await requireApiUser();

  if (auth.response) {
    return auth;
  }

  if (!hasAnyPermission(auth.user, permissions)) {
    return {
      response: NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Você não possui permissão para acessar este recurso."
        },
        { status: 403 }
      )
    };
  }

  return auth;
}

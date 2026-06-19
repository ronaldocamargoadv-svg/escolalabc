import crypto from "crypto";
import { cookies } from "next/headers";

const cookieName = "labc_session";

type SessionPayload = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

const maxSessionTokenLength = 2048;
const sessionDurationMs = 1000 * 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET obrigatório em produção.");
  }

  return secret ?? "dev-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function shouldUseSecureCookie() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    return appUrl.startsWith("https://");
  }

  return process.env.NODE_ENV === "production";
}

export function createSessionToken(payload: Omit<SessionPayload, "exp" | "iat">) {
  const now = Date.now();
  const body: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + sessionDurationMs
  };
  const encoded = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  if (token.length > maxSessionTokenLength) {
    return null;
  }

  const [encoded, signature] = token.split(".");

  if (
    !encoded ||
    !signature ||
    !/^[A-Za-z0-9_-]+$/.test(encoded) ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return null;
  }

  const expectedSignature = sign(encoded ?? "");
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;

    if (
      !payload.userId ||
      !payload.email ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      payload.exp < Date.now() ||
      payload.exp - payload.iat > sessionDurationMs
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();

  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getSessionPayload() {
  const store = await cookies();
  return verifySessionToken(store.get(cookieName)?.value);
}

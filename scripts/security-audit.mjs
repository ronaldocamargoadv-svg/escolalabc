const baseUrl = process.env.APP_URL || "http://localhost:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function cookieFrom(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0];
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body, text };
}

async function login(email, senha) {
  const { response, body } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha })
  });

  assert(response.status === 200, `Login falhou para ${email}: ${response.status}`);
  assert(body?.data?.email === email, `Login retornou usuário inesperado para ${email}`);

  const cookie = cookieFrom(response);
  assert(cookie.startsWith("labc_session="), `Cookie de sessão ausente para ${email}`);
  return cookie;
}

const adminCookie = await login("admin@labc.local", "admin123");
const alunoCookie = await login("aluno@labc.local", "aluno123");
const aluno02Cookie = await login("aluno02@labc.local", "aluno123");
const instrutorCookie = await login("instrutor@labc.local", "instrutor123");

const unauthUsers = await request("/api/usuarios");
assert(unauthUsers.response.status === 401, "API de usuários deve exigir autenticação.");

const alunoUsers = await request("/api/usuarios", { cookie: alunoCookie });
assert(alunoUsers.response.status === 403, "Aluno não pode listar usuários.");

const instrutorUsers = await request("/api/usuarios", { cookie: instrutorCookie });
assert(instrutorUsers.response.status === 403, "Instrutor não pode listar usuários.");

const alunoCreateCourse = await request("/api/cursos", {
  method: "POST",
  cookie: alunoCookie,
  body: JSON.stringify({
    nome: "Tentativa indevida",
    descricao: "<script>alert(1)</script>",
    ementa: "Teste de autorização",
    cargaHoraria: 8,
    modalidade: "online",
    status: "publicado"
  })
});
assert(alunoCreateCourse.response.status === 403, "Aluno não pode criar curso.");

const adminMassAssignment = await request("/api/cursos", {
  method: "POST",
  cookie: adminCookie,
  body: JSON.stringify({
    nome: "Curso com campo extra",
    descricao: "Deve ser rejeitado por schema estrito.",
    ementa: "Teste de payload com campo inesperado.",
    cargaHoraria: 8,
    modalidade: "online",
    status: "rascunho",
    perfis: ["administrador_geral"]
  })
});
assert(
  adminMassAssignment.response.status === 400,
  "Payload com campo extra em criação de curso deve ser rejeitado."
);

const alunoIssueCertificate = await request("/api/certificados", {
  method: "POST",
  cookie: alunoCookie,
  body: JSON.stringify({ inscricaoId: "db7d22be-7826-4251-bf40-c019b905bfec" })
});
assert(
  alunoIssueCertificate.response.status === 403,
  "Aluno não pode emitir certificado por API."
);

const certificates = await request("/api/certificados", { cookie: adminCookie });
assert(certificates.response.status === 200, "Administrador deve consultar certificados.");

if (Array.isArray(certificates.body?.data) && certificates.body.data.length > 0) {
  const target = certificates.body.data[0];
  const foreignPdf = await request(`/api/certificados/${target.id}/pdf`, {
    cookie: aluno02Cookie
  });
  assert(
    foreignPdf.response.status === 403,
    "Aluno não pode baixar certificado de outro aluno."
  );
}

let lastInvalidLoginStatus = 0;
for (let index = 0; index < 6; index += 1) {
  const attempt = await request("/api/auth/login", {
    method: "POST",
    headers: { "x-forwarded-for": `203.0.113.${index}` },
    body: JSON.stringify({
      email: "security-rate-limit@example.local",
      senha: `senha-incorreta-${index}`
    })
  });
  lastInvalidLoginStatus = attempt.response.status;
}
assert(
  lastInvalidLoginStatus === 429,
  "Rate limit por e-mail deve bloquear brute force mesmo com IP alternado."
);

console.log("Auditoria automatizada de segurança concluída com sucesso.");

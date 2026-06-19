import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const baseUrl = process.env.APP_URL || "http://localhost:3000";
const email = process.env.TEST_EMAIL || "admin@labc.local";
const senha = process.env.TEST_PASSWORD || "admin123";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeSilentWav() {
  const sampleRate = 8000;
  const durationSeconds = 1;
  const data = Buffer.alloc(sampleRate * durationSeconds * 2);
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(options.headers || {})
    }
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${pathname} falhou com ${response.status}: ${JSON.stringify(body)}`
    );
  }

  return { response, body };
}

let cookie = "";

const login = await fetch(`${baseUrl}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, senha })
});

assert(login.ok, `Login falhou com status ${login.status}`);
cookie = login.headers.getSetCookie?.().join("; ") || login.headers.get("set-cookie") || "";
assert(cookie.includes("labc_session"), "Cookie de sessão não retornado.");
console.log("1. Login realizado.");

const workDir = await mkdtemp(path.join(tmpdir(), "labc-transcricao-"));
const audioPath = path.join(workDir, "reuniao-smoke.wav");
await writeFile(audioPath, makeSilentWav());

const form = new FormData();
form.set("title", "Smoke test transcrição");
form.set("audio", new Blob([await (await import("node:fs/promises")).readFile(audioPath)], {
  type: "audio/wav"
}), "reuniao-smoke.wav");

const uploaded = await request("/api/transcricoes", {
  method: "POST",
  body: form
});
const meeting = uploaded.body.data;
assert(meeting.status === "aguardando_revisao", "Status esperado aguardando_revisao.");
assert(meeting.textoBruto.includes("Falante 1"), "Transcricao bruta deve identificar Falante 1.");
assert(meeting.trechos.length >= 3, "Transcricao deve conter trechos segmentados.");
console.log("2. Upload e transcrição demonstrativa realizados.");

await request(`/api/transcricoes/${meeting.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    action: "speaker",
    speakerKey: "falante_1",
    speakerName: "Ana Souza"
  })
});

const speaker2 = await request(`/api/transcricoes/${meeting.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    action: "speaker",
    speakerKey: "falante_2",
    speakerName: "Bruno Lima"
  })
});
assert(
  speaker2.body.data.trechos
    .filter((segment) => segment.speakerKey === "falante_2")
    .every((segment) => segment.speakerName === "Bruno Lima"),
  "Nome do Falante 2 nao foi reaplicado."
);
console.log("3. Falantes nomeados e reaplicados.");

const firstSegment = speaker2.body.data.trechos[0];
await request(`/api/transcricoes/${meeting.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    action: "segment",
    segmentId: firstSegment.id,
    reviewedText: `${firstSegment.reviewedText} Encaminhamento registrado.`
  })
});
console.log("4. Trecho revisado manualmente.");

await request("/api/glossario", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    termo: "PMBC",
    categoria: "sigla",
    formaPreferida: "Prefeitura Municipal de Balneario Camboriu",
    observacao: "Smoke test"
  })
});

const glossaryApplied = await request(`/api/transcricoes/${meeting.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "apply_glossary" })
});
assert(
  glossaryApplied.body.data.textoFinal.includes("Prefeitura Municipal de Balneario Camboriu"),
  "Glossario nao foi aplicado ao texto final."
);
console.log("5. Glossário aplicado.");

const approved = await request(`/api/transcricoes/${meeting.id}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "approve" })
});
assert(approved.body.data.status === "aprovado", "Status aprovado esperado.");
assert(approved.body.data.textoFinal.includes("## "), "Texto final deve conter subtitulos.");
console.log("6. Texto final aprovado com subtítulos e parágrafos.");

for (const format of ["docx", "md", "txt"]) {
  const exported = await fetch(`${baseUrl}/api/transcricoes/${meeting.id}/export?format=${format}`, {
    headers: { cookie }
  });
  assert(exported.ok, `Exportacao ${format} falhou.`);
  assert((await exported.arrayBuffer()).byteLength > 0, `Exportacao ${format} vazia.`);
  console.log(`7. Exportação ${format} OK.`);
}

const history = await request("/api/transcricoes");
assert(
  history.body.data.some((item) => item.id === meeting.id),
  "Historico nao retornou a reuniao processada."
);
console.log("8. Histórico consultado com sucesso.");

console.log("Smoke test de transcrições concluído.");

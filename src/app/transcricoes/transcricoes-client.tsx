"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Status =
  | "pendente"
  | "processando"
  | "aguardando_revisao"
  | "revisado"
  | "aprovado"
  | "exportado";

type MeetingSummary = {
  id: string;
  titulo: string;
  status: Status;
  nomeArquivoOriginal: string;
  caminhoAudio: string;
  criadoEm: string;
  atualizadoEm: string;
};

type Segment = {
  id: string;
  order: number;
  speakerKey: string;
  speakerName: string | null;
  startSeconds: number;
  endSeconds: number;
  topic: string | null;
  rawText: string;
  reviewedText: string;
};

type MeetingDetail = MeetingSummary & {
  textoBruto: string;
  textoRevisado: string;
  textoFinal: string;
  trechos: Segment[];
};

type GlossaryEntry = {
  id: string;
  termo: string;
  categoria: string;
  formaPreferida: string;
  observacao: string | null;
};

const statusLabels: Record<Status, string> = {
  pendente: "Pendente",
  processando: "Processando",
  aguardando_revisao: "Aguardando revisão",
  revisado: "Revisado",
  aprovado: "Aprovado",
  exportado: "Exportado"
};

function speakerLabel(speakerKey: string) {
  const number = speakerKey.replace(/\D/g, "") || speakerKey;
  return `Falante ${number}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Não foi possível concluir a operação.");
  }
  return payload.data as T;
}

export function TranscricoesClient() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [selected, setSelected] = useState<MeetingDetail | null>(null);
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [title, setTitle] = useState("Reunião de demonstração");
  const [file, setFile] = useState<File | null>(null);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [glossaryForm, setGlossaryForm] = useState({
    termo: "Open IA",
    categoria: "termo_tecnico",
    formaPreferida: "OpenAI",
    observacao: "Exemplo de correção contextual do mock."
  });

  async function loadMeetings() {
    const data = await readJson<MeetingSummary[]>(await fetch("/api/transcricoes"));
    setMeetings(data);
    if (!selected && data[0]) {
      await loadMeeting(data[0].id);
    }
  }

  async function loadGlossary() {
    const data = await readJson<GlossaryEntry[]>(await fetch("/api/glossario"));
    setGlossary(data);
  }

  async function loadMeeting(id: string) {
    const data = await readJson<MeetingDetail>(await fetch(`/api/transcricoes/${id}`));
    setSelected(data);
    setSpeakerNames(
      Object.fromEntries(
        data.trechos.map((segment) => [
          segment.speakerKey,
          segment.speakerName ?? speakerLabel(segment.speakerKey)
        ])
      )
    );
  }

  useEffect(() => {
    loadMeetings().catch((caught) => setError(caught.message));
    loadGlossary().catch((caught) => setError(caught.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakers = useMemo(() => {
    if (!selected) return [];
    const keys = Array.from(new Set(selected.trechos.map((item) => item.speakerKey)));
    return keys.map((speakerKey) => {
      const first = selected.trechos.find((item) => item.speakerKey === speakerKey);
      return {
        speakerKey,
        label: first?.speakerName ?? speakerLabel(speakerKey),
        start: first?.startSeconds ?? 0
      };
    });
  }, [selected]);

  async function uploadAudio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um arquivo .mp3, .wav, .m4a, .mp4 ou .webm.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("Enviando áudio e executando transcrição mockada...");

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("audio", file);
      const data = await readJson<MeetingDetail>(
        await fetch("/api/transcricoes", { method: "POST", body: formData })
      );
      setSelected(data);
      setFile(null);
      setMessage("Áudio processado. O mock gerou falantes, assuntos e texto revisado.");
      await loadMeetings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha no upload.");
    } finally {
      setLoading(false);
    }
  }

  async function patchMeeting(payload: Record<string, unknown>) {
    if (!selected) return;
    setError("");
    const data = await readJson<MeetingDetail>(
      await fetch(`/api/transcricoes/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      })
    );
    setSelected(data);
    await loadMeetings();
  }

  async function saveSpeaker(speakerKey: string) {
    const speakerName = speakerNames[speakerKey]?.trim();
    if (!speakerName) return;
    await patchMeeting({ action: "speaker", speakerKey, speakerName });
    setMessage(`Nome "${speakerName}" reaplicado aos blocos do falante.`);
  }

  async function saveSegment(segmentId: string, reviewedText: string) {
    await patchMeeting({ action: "segment", segmentId, reviewedText });
    setMessage("Trecho revisado e texto final reconstruído.");
  }

  async function createGlossary(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await readJson<GlossaryEntry>(
        await fetch("/api/glossario", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(glossaryForm)
        })
      );
      await loadGlossary();
      setMessage("Termo salvo. Use Aplicar glossário para corrigir a transcrição.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar glossário.");
    }
  }

  function playSnippet(startSeconds: number) {
    const player = audioRef.current;
    if (!player) return;
    player.currentTime = startSeconds;
    void player.play();
    window.setTimeout(() => player.pause(), 8000);
  }

  return (
    <div className="transcription-workspace">
      <section className="panel transcription-upload">
        <div>
          <h2>Novo processamento</h2>
          <p className="muted-small">
            MVP com transcrição mockada. A camada de serviço está pronta para
            receber Whisper, OpenAI, AssemblyAI ou Deepgram.
          </p>
        </div>
        <form onSubmit={uploadAudio} className="transcription-form">
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Áudio
            <input
              type="file"
              accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4,video/webm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button className="button" disabled={loading} type="submit">
            {loading ? "Processando..." : "Enviar e transcrever"}
          </button>
        </form>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Histórico</h2>
        <div className="history-list">
          {meetings.map((meeting) => (
            <button
              className={selected?.id === meeting.id ? "history-item active" : "history-item"}
              key={meeting.id}
              onClick={() => loadMeeting(meeting.id).catch((caught) => setError(caught.message))}
              type="button"
            >
              <strong>{meeting.titulo}</strong>
              <span>{meeting.nomeArquivoOriginal}</span>
              <span className="badge blue">{statusLabels[meeting.status]}</span>
            </button>
          ))}
          {!meetings.length ? (
            <p className="muted-small">Nenhuma reunião processada ainda.</p>
          ) : null}
        </div>
      </section>

      {selected ? (
        <>
          <section className="panel transcription-main">
            <div className="transcription-header">
              <div>
                <h2>{selected.titulo}</h2>
                <p className="muted-small">
                  {selected.nomeArquivoOriginal} - {statusLabels[selected.status]} -
                  atualizado em {selected.atualizadoEm}
                </p>
              </div>
              <div className="action-row compact">
                <button
                  className="button secondary"
                  onClick={() => patchMeeting({ action: "apply_glossary" })}
                  type="button"
                >
                  Aplicar glossário
                </button>
                <button
                  className="button secondary"
                  onClick={() => patchMeeting({ action: "approve" })}
                  type="button"
                >
                  Aprovar final
                </button>
              </div>
            </div>

            <audio controls ref={audioRef} src={selected.caminhoAudio} />

            <div className="review-grid">
              <div>
                <h3>Falantes</h3>
                <div className="speaker-list">
                  {speakers.map((speaker) => (
                    <div className="speaker-card" key={speaker.speakerKey}>
                      <button
                        className="text-button"
                        onClick={() => playSnippet(speaker.start)}
                        type="button"
                      >
                        Ouvir trecho
                      </button>
                      <label>
                        {speakerLabel(speaker.speakerKey)}
                        <input
                          value={speakerNames[speaker.speakerKey] ?? speaker.label}
                          onChange={(event) =>
                            setSpeakerNames((current) => ({
                              ...current,
                              [speaker.speakerKey]: event.target.value
                            }))
                          }
                        />
                      </label>
                      <button
                        className="button secondary"
                        onClick={() => saveSpeaker(speaker.speakerKey)}
                        type="button"
                      >
                        Aplicar nome
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Trechos revisáveis</h3>
                <div className="segment-list">
                  {selected.trechos.map((segment) => (
                    <article className="segment-card" key={segment.id}>
                      <div className="segment-meta">
                        <strong>
                          {segment.speakerName ?? speakerLabel(segment.speakerKey)}
                        </strong>
                        <span>{segment.topic}</span>
                        <button
                          className="text-button"
                          onClick={() => playSnippet(segment.startSeconds)}
                          type="button"
                        >
                          {segment.startSeconds}s
                        </button>
                      </div>
                      <p className="raw-text">{segment.rawText}</p>
                      <textarea
                        defaultValue={segment.reviewedText}
                        onBlur={(event) => saveSegment(segment.id, event.target.value)}
                      />
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Texto bruto</h2>
            <pre className="transcript-output">{selected.textoBruto}</pre>
          </section>

          <section className="panel">
            <div className="transcription-header">
              <h2>Texto final revisado</h2>
              <div className="action-row compact">
                <a className="button" href={`/api/transcricoes/${selected.id}/export?format=docx`}>
                  DOCX
                </a>
                <a className="button secondary" href={`/api/transcricoes/${selected.id}/export?format=md`}>
                  MD
                </a>
                <a className="button secondary" href={`/api/transcricoes/${selected.id}/export?format=txt`}>
                  TXT
                </a>
              </div>
            </div>
            <pre className="transcript-output final">{selected.textoFinal}</pre>
          </section>
        </>
      ) : null}

      <section className="panel">
        <h2>Glossário</h2>
        <form className="glossary-form" onSubmit={createGlossary}>
          <input
            aria-label="Termo original"
            value={glossaryForm.termo}
            onChange={(event) =>
              setGlossaryForm((current) => ({ ...current, termo: event.target.value }))
            }
          />
          <select
            aria-label="Categoria"
            value={glossaryForm.categoria}
            onChange={(event) =>
              setGlossaryForm((current) => ({
                ...current,
                categoria: event.target.value
              }))
            }
          >
            <option value="pessoa">Pessoa</option>
            <option value="empresa">Empresa</option>
            <option value="orgao">Órgão</option>
            <option value="sigla">Sigla</option>
            <option value="termo_tecnico">Termo técnico</option>
          </select>
          <input
            aria-label="Forma preferida"
            value={glossaryForm.formaPreferida}
            onChange={(event) =>
              setGlossaryForm((current) => ({
                ...current,
                formaPreferida: event.target.value
              }))
            }
          />
          <button className="button secondary" type="submit">
            Salvar termo
          </button>
        </form>
        <div className="glossary-list">
          {glossary.map((item) => (
            <span className="badge" key={item.id}>
              {item.termo} {"->"} {item.formaPreferida}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

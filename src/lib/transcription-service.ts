export type TranscriptionStatus =
  | "pendente"
  | "processando"
  | "aguardando_revisao"
  | "revisado"
  | "aprovado"
  | "exportado";

export type GlossaryTerm = {
  termo: string;
  formaPreferida: string;
};

export type TranscriptSegment = {
  speakerKey: string;
  startSeconds: number;
  endSeconds: number;
  topic: string;
  rawText: string;
  reviewedText: string;
};

export type TranscriptionResult = {
  rawText: string;
  reviewedText: string;
  finalText: string;
  segments: TranscriptSegment[];
};

export type TranscriptionService = {
  transcribe(input: {
    fileName: string;
    mimeType: string;
    glossary: GlossaryTerm[];
  }): Promise<TranscriptionResult>;
};

const baseSegments: TranscriptSegment[] = [
  {
    speakerKey: "falante_1",
    startSeconds: 0,
    endSeconds: 18,
    topic: "Abertura e objetivo",
    rawText:
      "Bom dia pessoal vamos iniciar a reunião sobre o projeto de transcrição inteligente para o LaBC.",
    reviewedText:
      "Bom dia, pessoal. Vamos iniciar a reunião sobre o projeto de transcrição inteligente para o LaBC."
  },
  {
    speakerKey: "falante_2",
    startSeconds: 19,
    endSeconds: 39,
    topic: "Abertura e objetivo",
    rawText:
      "A principal necessidade é transformar áudio de reuniões em texto revisado com separação por falantes.",
    reviewedText:
      "A principal necessidade é transformar áudio de reuniões em texto revisado, com separação por falantes."
  },
  {
    speakerKey: "falante_2",
    startSeconds: 40,
    endSeconds: 58,
    topic: "Abertura e objetivo",
    rawText:
      "Também precisamos ouvir trechos curtos para confirmar quem falou antes de nomear cada pessoa.",
    reviewedText:
      "Também precisamos ouvir trechos curtos para confirmar quem falou antes de nomear cada pessoa."
  },
  {
    speakerKey: "falante_1",
    startSeconds: 59,
    endSeconds: 82,
    topic: "Revisão e glossário",
    rawText:
      "O glossário deve corrigir nomes de órgãos, siglas e termos técnicos como DTI, PMBC e Open IA.",
    reviewedText:
      "O glossário deve corrigir nomes de órgãos, siglas e termos técnicos como DTI, PMBC e OpenAI."
  },
  {
    speakerKey: "falante_3",
    startSeconds: 83,
    endSeconds: 105,
    topic: "Revisão e glossário",
    rawText:
      "No final o sistema precisa gerar um documento editável para a equipe revisar e arquivar.",
    reviewedText:
      "No final, o sistema precisa gerar um documento editável para a equipe revisar e arquivar."
  },
  {
    speakerKey: "falante_1",
    startSeconds: 106,
    endSeconds: 128,
    topic: "Encaminhamentos",
    rawText:
      "Como encaminhamento vamos validar o MVP com upload, transcrição mockada, revisão e exportação.",
    reviewedText:
      "Como encaminhamento, vamos validar o MVP com upload, transcrição mockada, revisão e exportação."
  }
];

function applyGlossary(text: string, glossary: GlossaryTerm[]) {
  return glossary.reduce((current, item) => {
    const escaped = item.termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return current.replace(new RegExp(`\\b${escaped}\\b`, "gi"), item.formaPreferida);
  }, text);
}

function buildText(segments: TranscriptSegment[], field: "rawText" | "reviewedText") {
  return segments
    .map((segment) => `${speakerLabel(segment.speakerKey)}: ${segment[field]}`)
    .join("\n");
}

function speakerLabel(speakerKey: string) {
  const number = speakerKey.replace(/\D/g, "") || speakerKey;
  return `Falante ${number}`;
}

function buildFinalText(segments: TranscriptSegment[]) {
  const lines: string[] = [];
  let lastTopic = "";
  let lastSpeaker = "";
  let paragraph = "";

  for (const segment of segments) {
    if (segment.topic !== lastTopic) {
      if (paragraph) lines.push(paragraph);
      lines.push(`## ${segment.topic}`);
      paragraph = "";
      lastTopic = segment.topic;
      lastSpeaker = "";
    }

    const label = speakerLabel(segment.speakerKey);
    if (label === lastSpeaker && paragraph) {
      paragraph += ` ${segment.reviewedText}`;
    } else {
      if (paragraph) lines.push(paragraph);
      paragraph = `**${label}:** ${segment.reviewedText}`;
      lastSpeaker = label;
    }
  }

  if (paragraph) lines.push(paragraph);

  return lines.join("\n\n");
}

export class MockTranscriptionService implements TranscriptionService {
  async transcribe({
    glossary
  }: {
    fileName: string;
    mimeType: string;
    glossary: GlossaryTerm[];
  }) {
    const segments = baseSegments.map((segment) => ({
      ...segment,
      rawText: applyGlossary(segment.rawText, glossary),
      reviewedText: applyGlossary(segment.reviewedText, glossary)
    }));

    return {
      rawText: buildText(segments, "rawText"),
      reviewedText: buildText(segments, "reviewedText"),
      finalText: buildFinalText(segments),
      segments
    };
  }
}

export function getTranscriptionService(): TranscriptionService {
  // Ponto de extensão: trocar por Whisper, OpenAI, AssemblyAI, Deepgram etc.
  return new MockTranscriptionService();
}

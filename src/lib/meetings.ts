import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { recalculateEnrollmentFrequency } from "@/lib/attendance";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";
import {
  assertActiveInstructorAssignment,
  InstructorAssignmentError
} from "@/lib/instructor-assignments";

export type MeetingSummary = {
  id: string;
  turma: string;
  curso: string;
  data: string;
  dataInput: string;
  horarioInicio: string;
  horarioFim: string;
  modalidade: string;
  local: string | null;
  linkOnline: string | null;
  status: string;
};

export type CreateMeetingInput = {
  turmaId: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  modalidade: "presencial" | "online" | "hibrido";
  local?: string;
  linkOnline?: string;
};

export type MeetingStatus = "previsto" | "realizado" | "cancelado";

export class MeetingCreationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "MeetingCreationError";
    this.code = code;
    this.status = status;
  }
}

export class MeetingStatusError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "MeetingStatusError";
    this.code = code;
    this.status = status;
  }
}

function canManageAllMeetings(user: CurrentUser) {
  return (
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "courses.publish")
  );
}

async function assertMeetingAssignment(user: CurrentUser, turmaId: string) {
  try {
    await assertActiveInstructorAssignment(user, turmaId);
  } catch (error) {
    if (error instanceof InstructorAssignmentError) {
      throw new MeetingCreationError(error.code, error.message, error.status);
    }
    throw error;
  }
}

async function assertMeetingStatusAssignment(user: CurrentUser, turmaId: string) {
  try {
    await assertActiveInstructorAssignment(user, turmaId);
  } catch (error) {
    if (error instanceof InstructorAssignmentError) {
      throw new MeetingStatusError(error.code, error.message, error.status);
    }
    throw error;
  }
}

export function canUseClassForMeeting(
  user: CurrentUser,
  item: { instrutorId?: string | null; instrutoriaStatus?: string | null }
) {
  return canManageAllMeetings(user) || item.instrutoriaStatus === "ativo";
}

export async function listMeetings(user: CurrentUser): Promise<MeetingSummary[]> {
  const db = getDb();
  const result = canManageAllMeetings(user)
    ? await db.query(`
        SELECT
          e.id,
          t.nome AS turma,
          c.nome AS curso,
          to_char(e.data, 'DD/MM/YYYY') AS data,
          to_char(e.data, 'YYYY-MM-DD') AS data_input,
          to_char(e.horario_inicio, 'HH24:MI') AS horario_inicio,
          to_char(e.horario_fim, 'HH24:MI') AS horario_fim,
          e.modalidade,
          e.local,
          e.link_online,
          e.status
        FROM encontros e
        INNER JOIN turmas t ON t.id = e.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        ORDER BY e.data DESC, e.horario_inicio DESC
      `)
    : await db.query(
        `
          SELECT
            e.id,
            t.nome AS turma,
            c.nome AS curso,
            to_char(e.data, 'DD/MM/YYYY') AS data,
            to_char(e.data, 'YYYY-MM-DD') AS data_input,
            to_char(e.horario_inicio, 'HH24:MI') AS horario_inicio,
            to_char(e.horario_fim, 'HH24:MI') AS horario_fim,
            e.modalidade,
            e.local,
            e.link_online,
            e.status
          FROM encontros e
          INNER JOIN turmas t ON t.id = e.turma_id
          INNER JOIN cursos c ON c.id = t.curso_id
          WHERE EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status = 'ativo'
          )
          ORDER BY e.data DESC, e.horario_inicio DESC
        `,
        [user.id]
      );

  return result.rows.map((item) => ({
    id: item.id,
    turma: item.turma,
    curso: item.curso,
    data: item.data,
    dataInput: item.data_input,
    horarioInicio: item.horario_inicio,
    horarioFim: item.horario_fim,
    modalidade: item.modalidade,
    local: item.local,
    linkOnline: item.link_online,
    status: item.status
  }));
}

export async function createMeeting(input: CreateMeetingInput, user: CurrentUser) {
  if (!isSafeExternalUrl(input.linkOnline)) {
    throw new MeetingCreationError("INVALID_ONLINE_LINK", SAFE_EXTERNAL_URL_MESSAGE, 422);
  }

  const db = getDb();
  const classResult = await db.query(
    `
      SELECT
        t.id,
        t.instrutor_id,
        t.status AS turma_status,
        c.status AS curso_status
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE t.id = $1
      LIMIT 1
    `,
    [input.turmaId]
  );
  const turma = classResult.rows[0] as
    | {
        id: string;
        instrutor_id: string | null;
        turma_status: string;
        curso_status: string;
      }
    | undefined;

  if (!turma) {
    throw new MeetingCreationError(
      "CLASS_NOT_FOUND",
      "Turma não encontrada.",
      404
    );
  }

  if (turma.turma_status !== "publicada") {
    throw new MeetingCreationError(
      "CLASS_UNAVAILABLE",
      "Turma não publicada não aceita encontros.",
      409
    );
  }

  if (turma.curso_status !== "publicado") {
    throw new MeetingCreationError(
      "COURSE_UNAVAILABLE",
      "Curso não publicado não aceita encontros.",
      409
    );
  }

  if (!canManageAllMeetings(user)) {
    await assertMeetingAssignment(user, turma.id);
  }

  assertValidTimeRange(input.horarioInicio, input.horarioFim);
  await assertClassHasNoValidCertificates(turma.id, "creation");
  await assertMeetingScheduleAvailable(input);

  const result = await db.query(
    `
      INSERT INTO encontros (
        id, turma_id, data, horario_inicio, horario_fim, modalidade, local,
        link_online, status, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'previsto', now()
      )
      RETURNING *
    `,
    [
      input.turmaId,
      input.data,
      input.horarioInicio,
      input.horarioFim,
      input.modalidade,
      input.local || null,
      input.linkOnline || null
    ]
  );

  return result.rows[0];
}

function assertValidTimeRange(start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    throw new MeetingCreationError(
      "INVALID_TIME_RANGE",
      "Horário final deve ser posterior ao horário inicial.",
      422
    );
  }
}

function timeToMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

async function assertMeetingScheduleAvailable(
  input: CreateMeetingInput,
  ignoreMeetingId?: string
) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT id
      FROM encontros
      WHERE turma_id = $1
        AND data = $2::date
        AND status <> 'cancelado'
        AND horario_inicio < $4::time
        AND horario_fim > $3::time
        AND ($5::uuid IS NULL OR id <> $5::uuid)
      LIMIT 1
    `,
    [
      input.turmaId,
      input.data,
      input.horarioInicio,
      input.horarioFim,
      ignoreMeetingId || null
    ]
  );

  if (result.rows[0]) {
    throw new MeetingCreationError(
      "MEETING_SCHEDULE_CONFLICT",
      "Já existe encontro ativo para esta turma neste intervalo.",
      409
    );
  }
}

export async function updateMeetingDetails(
  meetingId: string,
  input: Omit<CreateMeetingInput, "turmaId">,
  user: CurrentUser
) {
  if (!isSafeExternalUrl(input.linkOnline)) {
    throw new MeetingStatusError("INVALID_ONLINE_LINK", SAFE_EXTERNAL_URL_MESSAGE, 422);
  }

  const db = getDb();
  const context = await db.query(
    `
      SELECT e.id, e.turma_id, t.instrutor_id
      FROM encontros e
      INNER JOIN turmas t ON t.id = e.turma_id
      WHERE e.id = $1
      LIMIT 1
    `,
    [meetingId]
  );
  const meeting = context.rows[0] as
    | { id: string; turma_id: string; instrutor_id: string | null }
    | undefined;

  if (!meeting) {
    throw new MeetingStatusError(
      "MEETING_NOT_FOUND",
      "Encontro não encontrado.",
      404
    );
  }

  if (!canManageAllMeetings(user)) {
    await assertMeetingStatusAssignment(user, meeting.turma_id);
  }

  const updateInput = {
    turmaId: meeting.turma_id,
    ...input
  };

  assertValidTimeRange(updateInput.horarioInicio, updateInput.horarioFim);
  await assertClassHasNoValidCertificates(meeting.turma_id);
  await assertMeetingScheduleAvailable(updateInput, meetingId);

  const result = await db.query(
    `
      UPDATE encontros
      SET data = $2,
          horario_inicio = $3,
          horario_fim = $4,
          modalidade = $5,
          local = $6,
          link_online = $7,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, turma_id
    `,
    [
      meetingId,
      input.data,
      input.horarioInicio,
      input.horarioFim,
      input.modalidade,
      input.local || null,
      input.linkOnline || null
    ]
  );

  await recalculateClassFrequencies(meeting.turma_id);

  return result.rows[0] as { id: string; turma_id: string } | undefined;
}

export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus,
  user: CurrentUser
) {
  const db = getDb();
  const context = await db.query(
    `
      SELECT e.id, e.status, e.turma_id, t.instrutor_id
      FROM encontros e
      INNER JOIN turmas t ON t.id = e.turma_id
      WHERE e.id = $1
      LIMIT 1
    `,
    [meetingId]
  );
  const meeting = context.rows[0] as
    | {
        id: string;
        status: string;
        turma_id: string;
        instrutor_id: string | null;
      }
    | undefined;

  if (!meeting) {
    throw new MeetingStatusError(
      "MEETING_NOT_FOUND",
      "Encontro não encontrado.",
      404
    );
  }

  if (!canManageAllMeetings(user)) {
    await assertMeetingStatusAssignment(user, meeting.turma_id);
  }

  if (status === "cancelado") {
    await assertClassHasNoValidCertificates(meeting.turma_id);
  }

  const result = await db.query(
    `
      UPDATE encontros
      SET status = $2,
          atualizado_em = now()
      WHERE id = $1
      RETURNING id, status
    `,
    [meetingId, status]
  );

  await recalculateClassFrequencies(meeting.turma_id);

  return result.rows[0] as { id: string; status: MeetingStatus };
}

async function assertClassHasNoValidCertificates(
  classId: string,
  context: "creation" | "status" = "status"
) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT cert.id
      FROM certificados cert
      INNER JOIN inscricoes i ON i.id = cert.inscricao_id
      WHERE i.turma_id = $1
        AND cert.status = 'valido'
      LIMIT 1
    `,
    [classId]
  );

  if (result.rows[0]) {
    if (context === "creation") {
      throw new MeetingCreationError(
        "VALID_CERTIFICATES_EXIST",
        "Turma com certificado válido não aceita novos encontros.",
        409
      );
    }

    throw new MeetingStatusError(
      "VALID_CERTIFICATES_EXIST",
      "Encontro de turma com certificado válido não pode ser cancelado.",
      409
    );
  }
}

async function recalculateClassFrequencies(classId: string) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT id
      FROM inscricoes
      WHERE turma_id = $1
    `,
    [classId]
  );

  await Promise.all(
    result.rows.map((item) => recalculateEnrollmentFrequency(item.id))
  );
}

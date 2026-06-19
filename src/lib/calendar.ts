import { hasAnyRole, ROLES, type CurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { isSafeExternalUrl, SAFE_EXTERNAL_URL_MESSAGE } from "@/lib/external-url";

export const calendarEventTypes = [
  "aula",
  "atividade",
  "prazo",
  "encontro_presencial",
  "encontro_online",
  "forum_debate",
  "certificacao",
  "reuniao",
  "evento_institucional",
  "compromisso_pessoal"
] as const;

export type CalendarEventType = (typeof calendarEventTypes)[number];
export type CalendarVisibility = "private" | "course" | "class" | "institutional";
export type CalendarSource =
  | "manual"
  | "course"
  | "lesson"
  | "activity"
  | "certificate"
  | "institutional"
  | "external";
export type CalendarStatus = "scheduled" | "completed" | "cancelled";
export type CalendarProvider = "none" | "google" | "outlook" | "apple" | "ics";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime: string;
  startDateLabel: string;
  timeLabel: string;
  location: string | null;
  onlineLink: string | null;
  courseId: string | null;
  courseName: string | null;
  classGroupId: string | null;
  className: string | null;
  lessonId: string | null;
  ownerUserId: string | null;
  visibility: CalendarVisibility;
  source: CalendarSource;
  status: CalendarStatus;
  reminderMinutes: number | null;
  syncEnabled: boolean;
  externalProvider: CalendarProvider;
  automatic: boolean;
  canEdit: boolean;
};

export type CalendarFilters = {
  type?: string;
  courseId?: string;
  classGroupId?: string;
  status?: string;
  source?: string;
  month?: string;
};

export type CalendarScope = {
  id: string;
  nome: string;
  cursoId: string;
  cursoNome: string;
};

export type CalendarIntegrationSettings = {
  provider: CalendarProvider;
  enabled: boolean;
  syncDirection: "export_only" | "import_only" | "two_way";
  autoSyncCourseEvents: boolean;
  autoSyncPersonalEvents: boolean;
  lastSyncAt: string | null;
};

export type CalendarEventInput = {
  title: string;
  description?: string;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  onlineLink?: string;
  classGroupId?: string;
  visibility: CalendarVisibility;
  reminderMinutes?: number | null;
  syncEnabled: boolean;
};

export class CalendarMutationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 422) {
    super(message);
    this.name = "CalendarMutationError";
    this.code = code;
    this.status = status;
  }
}

function isInstitutionManager(user: CurrentUser) {
  return (
    hasAnyRole(user, [ROLES.admin, ROLES.gestor]) ||
    hasPermission(user, "calendar.create_institutional")
  );
}

function mapCalendarRow(row: Record<string, unknown>, user: CurrentUser): CalendarEvent {
  const visibility = String(row.visibilidade) as CalendarVisibility;
  const automatic = Boolean(row.automatico);
  const ownedManual =
    !automatic &&
    String(row.usuario_responsavel_id ?? "") === user.id &&
    visibility === "private";
  const sharedEditable =
    !automatic &&
    ((visibility === "institutional" &&
      hasPermission(user, "calendar.edit_institutional")) ||
      ((visibility === "course" || visibility === "class") &&
        hasPermission(user, "calendar.edit_class_event")));

  return {
    id: String(row.id),
    title: String(row.titulo),
    description: row.descricao ? String(row.descricao) : null,
    type: String(row.tipo) as CalendarEventType,
    startDateTime: String(row.inicio_iso),
    endDateTime: String(row.fim_iso),
    startDateLabel: String(row.data_label),
    timeLabel: String(row.horario_label),
    location: row.local ? String(row.local) : null,
    onlineLink: row.link_online ? String(row.link_online) : null,
    courseId: row.curso_id ? String(row.curso_id) : null,
    courseName: row.curso_nome ? String(row.curso_nome) : null,
    classGroupId: row.turma_id ? String(row.turma_id) : null,
    className: row.turma_nome ? String(row.turma_nome) : null,
    lessonId: row.encontro_id ? String(row.encontro_id) : null,
    ownerUserId: row.usuario_responsavel_id
      ? String(row.usuario_responsavel_id)
      : null,
    visibility,
    source: String(row.origem) as CalendarSource,
    status: String(row.status) as CalendarStatus,
    reminderMinutes:
      row.lembrete_minutos === null || row.lembrete_minutos === undefined
        ? null
        : Number(row.lembrete_minutos),
    syncEnabled: Boolean(row.sincronizar),
    externalProvider: String(row.provedor_externo ?? "none") as CalendarProvider,
    automatic,
    canEdit: ownedManual
      ? hasPermission(user, "calendar.edit_own")
      : sharedEditable
  };
}

export async function listCalendarEvents(
  user: CurrentUser,
  filters: CalendarFilters = {}
): Promise<CalendarEvent[]> {
  const db = getDb();
  const canSeeEverySharedEvent = isInstitutionManager(user);
  const canSeeInstitutional = hasPermission(user, "calendar.view_institutional");
  const result = await db.query(
    `
      WITH eventos_visiveis AS (
        SELECT
          ea.id::text AS id,
          ea.titulo,
          ea.descricao,
          ea.tipo,
          to_char(ea.inicio_em, 'YYYY-MM-DD"T"HH24:MI') AS inicio_iso,
          to_char(ea.fim_em, 'YYYY-MM-DD"T"HH24:MI') AS fim_iso,
          to_char(ea.inicio_em, 'DD/MM/YYYY') AS data_label,
          to_char(ea.inicio_em, 'HH24:MI') || ' - ' || to_char(ea.fim_em, 'HH24:MI') AS horario_label,
          ea.local,
          ea.link_online,
          ea.curso_id,
          c.nome AS curso_nome,
          ea.turma_id,
          t.nome AS turma_nome,
          ea.encontro_id,
          ea.usuario_responsavel_id,
          ea.visibilidade,
          ea.origem,
          ea.status,
          ea.lembrete_minutos,
          ea.sincronizar,
          ea.provedor_externo,
          false AS automatico
        FROM eventos_agenda ea
        LEFT JOIN cursos c ON c.id = ea.curso_id
        LEFT JOIN turmas t ON t.id = ea.turma_id
        WHERE ea.usuario_responsavel_id = $1
           OR (ea.visibilidade = 'institutional' AND $3::boolean)
           OR (
             ea.visibilidade IN ('course', 'class')
             AND (
               $2::boolean
               OR EXISTS (
                 SELECT 1 FROM vinculos_instrutoria vi
                 WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status IN ('ativo', 'agendado')
               )
               OR EXISTS (
                 SELECT 1 FROM inscricoes i
                 WHERE i.turma_id = ea.turma_id
                   AND i.usuario_id = $1
                   AND i.status <> 'cancelado'
               )
             )
           )
        UNION ALL
        SELECT
          'lesson:' || e.id::text AS id,
          'Aula: ' || c.nome AS titulo,
          'Este evento foi criado automaticamente a partir de uma aula do curso.' AS descricao,
          CASE
            WHEN e.modalidade = 'presencial' THEN 'encontro_presencial'
            WHEN e.modalidade = 'online' THEN 'encontro_online'
            ELSE 'aula'
          END AS tipo,
          to_char(e.data, 'YYYY-MM-DD') || 'T' || to_char(e.horario_inicio, 'HH24:MI') AS inicio_iso,
          to_char(e.data, 'YYYY-MM-DD') || 'T' || to_char(e.horario_fim, 'HH24:MI') AS fim_iso,
          to_char(e.data, 'DD/MM/YYYY') AS data_label,
          to_char(e.horario_inicio, 'HH24:MI') || ' - ' || to_char(e.horario_fim, 'HH24:MI') AS horario_label,
          e.local,
          e.link_online,
          c.id AS curso_id,
          c.nome AS curso_nome,
          t.id AS turma_id,
          t.nome AS turma_nome,
          e.id AS encontro_id,
          t.instrutor_id AS usuario_responsavel_id,
          'class' AS visibilidade,
          'lesson' AS origem,
          CASE WHEN e.status = 'cancelado' THEN 'cancelled'
               WHEN e.status = 'realizado' THEN 'completed'
               ELSE 'scheduled' END AS status,
          60 AS lembrete_minutos,
          false AS sincronizar,
          'none' AS provedor_externo,
          true AS automatico
        FROM encontros e
        INNER JOIN turmas t ON t.id = e.turma_id
        INNER JOIN cursos c ON c.id = t.curso_id
        WHERE $2::boolean
           OR EXISTS (
             SELECT 1 FROM vinculos_instrutoria vi
             WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status IN ('ativo', 'agendado')
           )
           OR EXISTS (
             SELECT 1 FROM inscricoes i
             WHERE i.turma_id = t.id
               AND i.usuario_id = $1
               AND i.status <> 'cancelado'
           )
      )
      SELECT *
      FROM eventos_visiveis
      ORDER BY inicio_iso ASC, titulo ASC
    `,
    [user.id, canSeeEverySharedEvent, canSeeInstitutional]
  );

  return result.rows
    .map((row) => mapCalendarRow(row, user))
    .filter((event) => !filters.type || event.type === filters.type)
    .filter((event) => !filters.courseId || event.courseId === filters.courseId)
    .filter(
      (event) => !filters.classGroupId || event.classGroupId === filters.classGroupId
    )
    .filter((event) => !filters.status || event.status === filters.status)
    .filter((event) => !filters.source || event.source === filters.source)
    .filter(
      (event) => !filters.month || event.startDateTime.startsWith(filters.month)
    );
}

export async function listCalendarScopes(user: CurrentUser): Promise<CalendarScope[]> {
  const db = getDb();
  const canSeeAll = isInstitutionManager(user);
  const result = await db.query(
    `
      SELECT DISTINCT t.id, t.nome, c.id AS curso_id, c.nome AS curso_nome
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      WHERE $2::boolean
         OR EXISTS (
           SELECT 1 FROM vinculos_instrutoria vi
           WHERE vi.turma_id = t.id AND vi.usuario_id = $1 AND vi.status IN ('ativo', 'agendado')
         )
         OR EXISTS (
           SELECT 1 FROM inscricoes i
           WHERE i.turma_id = t.id
             AND i.usuario_id = $1
             AND i.status <> 'cancelado'
         )
      ORDER BY c.nome, t.nome
    `,
    [user.id, canSeeAll]
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome),
    cursoId: String(row.curso_id),
    cursoNome: String(row.curso_nome)
  }));
}

async function assertWritableScope(
  user: CurrentUser,
  visibility: CalendarVisibility,
  classGroupId?: string
) {
  if (visibility === "private") {
    if (!hasPermission(user, "calendar.create_own")) {
      throw new CalendarMutationError(
        "CALENDAR_FORBIDDEN",
        "Você não possui permissão para criar compromissos pessoais.",
        403
      );
    }
    return { courseId: null, classGroupId: null, source: "manual" as const };
  }

  if (visibility === "institutional") {
    if (!hasPermission(user, "calendar.create_institutional")) {
      throw new CalendarMutationError(
        "CALENDAR_FORBIDDEN",
        "Apenas perfis autorizados podem criar eventos institucionais.",
        403
      );
    }
    return { courseId: null, classGroupId: null, source: "institutional" as const };
  }

  if (!classGroupId || !hasPermission(user, "calendar.create_class_event")) {
    throw new CalendarMutationError(
      "CLASS_EVENT_FORBIDDEN",
      "Selecione uma turma sob sua responsabilidade para publicar este evento.",
      403
    );
  }

  const db = getDb();
  const scope = await db.query(
    `
      SELECT t.id, t.curso_id
      FROM turmas t
      WHERE t.id = $1
        AND (
          $3::boolean OR EXISTS (
            SELECT 1 FROM vinculos_instrutoria vi
            WHERE vi.turma_id = t.id AND vi.usuario_id = $2 AND vi.status = 'ativo'
          )
        )
      LIMIT 1
    `,
    [classGroupId, user.id, isInstitutionManager(user)]
  );
  if (!scope.rows[0]) {
    throw new CalendarMutationError(
      "CLASS_EVENT_FORBIDDEN",
      "Você não pode criar eventos para esta turma.",
      403
    );
  }
  return {
    courseId: String(scope.rows[0].curso_id),
    classGroupId,
    source: "course" as const
  };
}

function assertValidPeriod(startDateTime: string, endDateTime: string) {
  const start = Date.parse(startDateTime);
  const end = Date.parse(endDateTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new CalendarMutationError(
      "INVALID_CALENDAR_PERIOD",
      "A data e hora de término devem ser posteriores ao início."
    );
  }
}

export async function createCalendarEvent(
  input: CalendarEventInput,
  user: CurrentUser
) {
  if (!isSafeExternalUrl(input.onlineLink)) {
    throw new CalendarMutationError("INVALID_ONLINE_LINK", SAFE_EXTERNAL_URL_MESSAGE);
  }

  assertValidPeriod(input.startDateTime, input.endDateTime);
  const scope = await assertWritableScope(user, input.visibility, input.classGroupId);
  const db = getDb();
  const result = await db.query(
    `
      INSERT INTO eventos_agenda (
        id, titulo, descricao, tipo, inicio_em, fim_em, local, link_online,
        curso_id, turma_id, usuario_responsavel_id, visibilidade, origem,
        status, lembrete_minutos, sincronizar, provedor_externo, atualizado_em
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, 'scheduled', $13, $14, 'none', now()
      )
      RETURNING id, titulo
    `,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.type,
      input.startDateTime,
      input.endDateTime,
      input.location?.trim() || null,
      input.onlineLink?.trim() || null,
      scope.courseId,
      scope.classGroupId,
      user.id,
      input.visibility,
      scope.source,
      input.reminderMinutes ?? null,
      input.syncEnabled
    ]
  );
  return result.rows[0] as { id: string; titulo: string };
}

async function findEditableEvent(eventId: string, user: CurrentUser) {
  const db = getDb();
  const result = await db.query(
    `
      SELECT ea.id, ea.visibilidade, ea.usuario_responsavel_id, ea.turma_id
      FROM eventos_agenda ea
      LEFT JOIN turmas t ON t.id = ea.turma_id
      WHERE ea.id = $1
        AND (
          (
            ea.visibilidade = 'private'
            AND ea.usuario_responsavel_id = $2
            AND $3::boolean
          )
          OR (
            ea.visibilidade = 'institutional'
            AND $4::boolean
          )
          OR (
            ea.visibilidade IN ('course', 'class')
            AND $5::boolean
            AND (
              $6::boolean OR EXISTS (
                SELECT 1 FROM vinculos_instrutoria vi
                WHERE vi.turma_id = t.id AND vi.usuario_id = $2 AND vi.status = 'ativo'
              )
            )
          )
        )
      LIMIT 1
    `,
    [
      eventId,
      user.id,
      hasPermission(user, "calendar.edit_own"),
      hasPermission(user, "calendar.edit_institutional"),
      hasPermission(user, "calendar.edit_class_event"),
      isInstitutionManager(user)
    ]
  );
  if (!result.rows[0]) {
    throw new CalendarMutationError(
      "CALENDAR_EVENT_FORBIDDEN",
      "Este evento não pode ser alterado pelo seu perfil.",
      403
    );
  }
  return result.rows[0];
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput,
  user: CurrentUser
) {
  if (!isSafeExternalUrl(input.onlineLink)) {
    throw new CalendarMutationError("INVALID_ONLINE_LINK", SAFE_EXTERNAL_URL_MESSAGE);
  }

  assertValidPeriod(input.startDateTime, input.endDateTime);
  const current = await findEditableEvent(eventId, user);
  const visibility = String(current.visibilidade) as CalendarVisibility;
  const scope = await assertWritableScope(
    user,
    visibility,
    visibility === "class" || visibility === "course"
      ? input.classGroupId
      : undefined
  );
  const db = getDb();
  const result = await db.query(
    `
      UPDATE eventos_agenda
      SET titulo = $2, descricao = $3, tipo = $4, inicio_em = $5, fim_em = $6,
          local = $7, link_online = $8, curso_id = $9, turma_id = $10,
          lembrete_minutos = $11, sincronizar = $12, atualizado_em = now()
      WHERE id = $1
      RETURNING id, titulo
    `,
    [
      eventId,
      input.title.trim(),
      input.description?.trim() || null,
      input.type,
      input.startDateTime,
      input.endDateTime,
      input.location?.trim() || null,
      input.onlineLink?.trim() || null,
      scope.courseId,
      scope.classGroupId,
      input.reminderMinutes ?? null,
      input.syncEnabled
    ]
  );
  return result.rows[0] as { id: string; titulo: string };
}

export async function updateCalendarEventStatus(
  eventId: string,
  status: CalendarStatus,
  user: CurrentUser
) {
  await findEditableEvent(eventId, user);
  const db = getDb();
  const result = await db.query(
    "UPDATE eventos_agenda SET status = $2, atualizado_em = now() WHERE id = $1 RETURNING id, titulo, status",
    [eventId, status]
  );
  return result.rows[0] as { id: string; titulo: string; status: CalendarStatus };
}

export async function deleteCalendarEvent(eventId: string, user: CurrentUser) {
  const event = await findEditableEvent(eventId, user);
  const visibility = String(event.visibilidade);
  const allowed =
    visibility === "private"
      ? hasPermission(user, "calendar.delete_own")
      : visibility === "institutional"
        ? hasPermission(user, "calendar.delete_institutional")
        : hasPermission(user, "calendar.edit_class_event");
  if (!allowed) {
    throw new CalendarMutationError(
      "CALENDAR_DELETE_FORBIDDEN",
      "Você não possui permissão para excluir este evento.",
      403
    );
  }
  const db = getDb();
  const result = await db.query(
    "DELETE FROM eventos_agenda WHERE id = $1 RETURNING id, titulo",
    [eventId]
  );
  return result.rows[0] as { id: string; titulo: string };
}

export async function getCalendarIntegrationSettings(
  userId: string
): Promise<CalendarIntegrationSettings> {
  const db = getDb();
  const result = await db.query(
    `
      SELECT provedor, habilitada, direcao_sincronizacao,
             sincronizar_eventos_curso, sincronizar_eventos_pessoais,
             to_char(ultima_sincronizacao_em, 'DD/MM/YYYY HH24:MI') AS ultima_sincronizacao
      FROM configuracoes_integracao_agenda
      WHERE usuario_id = $1
      LIMIT 1
    `,
    [userId]
  );
  const row = result.rows[0];
  return {
    provider: (row?.provedor ?? "none") as CalendarProvider,
    enabled: Boolean(row?.habilitada),
    syncDirection: (row?.direcao_sincronizacao ??
      "export_only") as CalendarIntegrationSettings["syncDirection"],
    autoSyncCourseEvents: row ? Boolean(row.sincronizar_eventos_curso) : true,
    autoSyncPersonalEvents: row
      ? Boolean(row.sincronizar_eventos_pessoais)
      : false,
    lastSyncAt: row?.ultima_sincronizacao ?? null
  };
}

export async function saveCalendarIntegrationSettings(
  settings: Omit<CalendarIntegrationSettings, "lastSyncAt">,
  user: CurrentUser
) {
  if (!hasPermission(user, "calendar.integration_configure")) {
    throw new CalendarMutationError(
      "CALENDAR_INTEGRATION_FORBIDDEN",
      "Você não possui permissão para configurar a integração.",
      403
    );
  }
  if (
    settings.enabled &&
    !hasPermission(user, "calendar.integration_enable")
  ) {
    throw new CalendarMutationError(
      "CALENDAR_INTEGRATION_FORBIDDEN",
      "Você não possui permissão para ativar a integração.",
      403
    );
  }
  if (
    !settings.enabled &&
    !hasPermission(user, "calendar.integration_disable")
  ) {
    throw new CalendarMutationError(
      "CALENDAR_INTEGRATION_FORBIDDEN",
      "Você não possui permissão para desativar a integração.",
      403
    );
  }
  const db = getDb();
  await db.query(
    `
      INSERT INTO configuracoes_integracao_agenda (
        id, usuario_id, provedor, habilitada, direcao_sincronizacao,
        sincronizar_eventos_curso, sincronizar_eventos_pessoais, atualizado_em
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (usuario_id)
      DO UPDATE SET provedor = EXCLUDED.provedor,
                    habilitada = EXCLUDED.habilitada,
                    direcao_sincronizacao = EXCLUDED.direcao_sincronizacao,
                    sincronizar_eventos_curso = EXCLUDED.sincronizar_eventos_curso,
                    sincronizar_eventos_pessoais = EXCLUDED.sincronizar_eventos_pessoais,
                    atualizado_em = now()
    `,
    [
      user.id,
      settings.enabled ? settings.provider : "none",
      settings.enabled,
      settings.syncDirection,
      settings.autoSyncCourseEvents,
      settings.autoSyncPersonalEvents
    ]
  );
}

function escapeIcs(value: string | null) {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function icsDate(value: string) {
  return value.replace(/[-:]/g, "").replace("T", "T") + "00";
}

export function exportCalendarToIcs(events: CalendarEvent[], userId: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escola LaBC de Inovacao//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(event.id)}-${userId}@agenda.labc.local`,
      `DTSTAMP:${icsDate(new Date().toISOString().slice(0, 16))}Z`,
      `DTSTART:${icsDate(event.startDateTime)}`,
      `DTEND:${icsDate(event.endDateTime)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      event.onlineLink ? `URL:${escapeIcs(event.onlineLink)}` : "",
      `STATUS:${event.status === "cancelled" ? "CANCELLED" : event.status === "completed" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export const calendarIntegrationProviders = {
  ics: {
    available: true,
    description: "Exportação real de eventos em arquivo .ics."
  },
  google: {
    available: false,
    description: "Integração simulada; conexão OAuth não configurada neste MVP."
  },
  outlook: {
    available: false,
    description: "Integração simulada; conexão OAuth não configurada neste MVP."
  },
  apple: {
    available: true,
    description: "Uso por importação do arquivo .ics no calendário do dispositivo."
  }
} as const;

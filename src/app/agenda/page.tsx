import { AppShell, UserPill } from "@/components/app-shell";
import { requireAnyPermission } from "@/lib/auth";
import {
  calendarEventTypes,
  calendarIntegrationProviders,
  getCalendarIntegrationSettings,
  listCalendarEvents,
  listCalendarScopes,
  type CalendarEvent,
  type CalendarFilters
} from "@/lib/calendar";
import { hasPermission } from "@/lib/permissions";
import { uiLabel } from "@/lib/ui-labels";
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  saveCalendarIntegrationAction,
  updateCalendarEventAction,
  updateCalendarEventStatusAction
} from "./actions";

type AgendaSearchParams = Promise<{
  tipo?: string;
  cursoId?: string;
  turmaId?: string;
  status?: string;
  origem?: string;
  mes?: string;
}>;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function addMonths(value: string, amount: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}-01T12:00:00Z`));
}

function buildMonthDays(month: string, events: CalendarEvent[]) {
  const [year, numericMonth] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, numericMonth - 1, 1));
  const total = new Date(Date.UTC(year, numericMonth, 0)).getUTCDate();
  const leading = first.getUTCDay();
  const items: Array<{ key: string; day?: number; events?: CalendarEvent[] }> = [];
  for (let count = 0; count < leading; count += 1) {
    items.push({ key: `empty-${count}` });
  }
  for (let day = 1; day <= total; day += 1) {
    const key = `${month}-${String(day).padStart(2, "0")}`;
    items.push({
      key,
      day,
      events: events.filter((event) => event.startDateTime.startsWith(key))
    });
  }
  return items;
}

function eventClass(event: CalendarEvent) {
  return `agenda-event agenda-${event.type} ${event.status === "cancelled" ? "cancelled" : ""}`;
}

export default async function AgendaPage({
  searchParams
}: {
  searchParams: AgendaSearchParams;
}) {
  const user = await requireAnyPermission([
    "calendar.view_own",
    "calendar.view_course",
    "calendar.view_institutional"
  ]);
  const query = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(query.mes ?? "") ? query.mes! : currentMonth();
  const filters: CalendarFilters = {
    type: query.tipo,
    courseId: query.cursoId,
    classGroupId: query.turmaId,
    status: query.status,
    source: query.origem
  };
  const [events, scopes, integration] = await Promise.all([
    listCalendarEvents(user, filters),
    listCalendarScopes(user),
    getCalendarIntegrationSettings(user.id)
  ]);
  const monthEvents = events.filter((event) => event.startDateTime.startsWith(month));
  const calendarDays = buildMonthDays(month, monthEvents);
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysLater = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const upcoming = events
    .filter((event) => event.startDateTime.slice(0, 10) >= today)
    .slice(0, 12);
  const metrics = [
    {
      label: "Eventos de hoje",
      value: events.filter((event) => event.startDateTime.startsWith(today)).length
    },
    {
      label: "Próximas aulas",
      value: upcoming.filter((event) =>
        ["aula", "encontro_presencial", "encontro_online"].includes(event.type)
      ).length
    },
    {
      label: "Prazos próximos",
      value: events.filter(
        (event) =>
          event.type === "prazo" &&
          event.startDateTime.slice(0, 10) >= today &&
          event.startDateTime.slice(0, 10) <= sevenDaysLater
      ).length
    },
    {
      label: "Lembretes ativos",
      value: events.filter(
        (event) => event.reminderMinutes !== null && event.status === "scheduled"
      ).length
    }
  ];
  const canCreateInstitutional = hasPermission(
    user,
    "calendar.create_institutional"
  );
  const canCreateClassEvent = hasPermission(user, "calendar.create_class_event");
  const isInstitutionalView = canCreateInstitutional;
  const exportQuery = new URLSearchParams();
  Object.entries({ ...filters, month }).forEach(([key, value]) => {
    if (value) {
      const apiKey =
        key === "type"
          ? "tipo"
          : key === "courseId"
            ? "cursoId"
            : key === "classGroupId"
              ? "turmaId"
              : key === "source"
                ? "origem"
                : key === "month"
                  ? "mes"
                  : key;
      exportQuery.set(apiKey, value);
    }
  });

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Organização formativa</p>
          <h1 className="page-title">
            {isInstitutionalView ? "Agenda Institucional" : "Minha Agenda"}
          </h1>
          <p className="page-copy">
            Organize seus compromissos, aulas e prazos em um só lugar. Eventos
            pessoais são privados por padrão.
          </p>
          <div className="hero-actions">
            {hasPermission(user, "calendar.create_own") ? (
              <a className="button" href="#novo-compromisso">
                Novo compromisso
              </a>
            ) : null}
            {hasPermission(user, "calendar.export") ? (
              <a className="button secondary" href={`/api/agenda/ics?${exportQuery}`}>
                Exportar agenda
              </a>
            ) : null}
            <a className="button secondary" href="#integracao">
              Configurar integração
            </a>
          </div>
        </div>
        <UserPill user={user} />
      </section>

      <section className="metric-grid agenda-metrics" aria-label="Resumo da agenda">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel agenda-filter-panel">
        <div className="section-heading">
          <div>
            <h2>Filtrar compromissos</h2>
            <p className="muted-small">
              Selecione tipo, turma, status ou período para concentrar sua leitura.
            </p>
          </div>
        </div>
        <form className="agenda-filters" method="get">
          <label className="field">
            <span>Tipo</span>
            <select defaultValue={query.tipo ?? ""} name="tipo">
              <option value="">Todos</option>
              {calendarEventTypes.map((type) => (
                <option key={type} value={type}>
                  {uiLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Turma</span>
            <select defaultValue={query.turmaId ?? ""} name="turmaId">
              <option value="">Todas</option>
              {scopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.cursoNome} - {scope.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select defaultValue={query.status ?? ""} name="status">
              <option value="">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label className="field">
            <span>Mês</span>
            <input defaultValue={month} name="mes" type="month" />
          </label>
          <button className="button" type="submit">
            Aplicar filtros
          </button>
        </form>
      </section>

      <section className="agenda-grid">
        <div className="panel calendar-panel">
          <div className="calendar-heading">
            <a
              aria-label="Mês anterior"
              className="text-button"
              href={`/agenda?mes=${addMonths(month, -1)}`}
            >
              Anterior
            </a>
            <h2>{monthLabel(month)}</h2>
            <a
              aria-label="Próximo mês"
              className="text-button"
              href={`/agenda?mes=${addMonths(month, 1)}`}
            >
              Próximo
            </a>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="month-calendar" aria-label={`Calendário de ${monthLabel(month)}`}>
            {calendarDays.map((day) => (
              <article
                className={`calendar-day ${day.day ? "" : "empty"}`}
                key={day.key}
              >
                {day.day ? <strong>{day.day}</strong> : null}
                {day.events?.slice(0, 2).map((event) => (
                  <span className={eventClass(event)} key={event.id} title={event.title}>
                    {event.title}
                  </span>
                ))}
                {(day.events?.length ?? 0) > 2 ? (
                  <small>+{day.events!.length - 2} eventos</small>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <aside className="panel agenda-upcoming">
          <h2>Próximos compromissos</h2>
          <div className="stack-list">
            {upcoming.length ? (
              upcoming.map((event) => (
                <article className="agenda-list-card" key={event.id}>
                  <div className="card-heading-row">
                    <span className={`badge agenda-type-${event.type}`}>
                      {uiLabel(event.type)}
                    </span>
                    <span className={event.status === "cancelled" ? "badge warning" : "badge"}>
                      {uiLabel(event.status)}
                    </span>
                  </div>
                  <strong>{event.title}</strong>
                  <p>
                    {event.startDateLabel} | {event.timeLabel}
                  </p>
                  {event.courseName ? (
                    <p className="muted-small">
                      {event.courseName} {event.className ? `- ${event.className}` : ""}
                    </p>
                  ) : null}
                  {event.automatic ? (
                    <p className="privacy-note">Evento automático da turma.</p>
                  ) : event.visibility === "private" ? (
                    <p className="privacy-note">Privado e visível apenas para você.</p>
                  ) : null}
                  <div className="inline-actions">
                    {hasPermission(user, "calendar.export") ? (
                      <a
                        className="text-button"
                        href={`/api/agenda/ics?eventoId=${encodeURIComponent(event.id)}`}
                      >
                        Exportar .ics
                      </a>
                    ) : null}
                    {event.canEdit ? (
                      <details className="row-editor agenda-editor">
                        <summary className="text-button">Editar</summary>
                        <CalendarEventForm
                          event={event}
                          scopes={scopes}
                          canCreateClassEvent={canCreateClassEvent}
                          canCreateInstitutional={canCreateInstitutional}
                          submitAction={updateCalendarEventAction}
                        />
                      </details>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-small">
                Nenhum compromisso próximo para os filtros selecionados.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="content-grid agenda-lower-grid">
        <div className="panel" id="novo-compromisso">
          <h2>{canCreateInstitutional ? "Novo evento" : "Novo compromisso"}</h2>
          <p className="muted-small">
            Compromissos pessoais permanecem privados. Eventos compartilhados
            exigem vínculo e permissão compatíveis.
          </p>
          <CalendarEventForm
            scopes={scopes}
            canCreateClassEvent={canCreateClassEvent}
            canCreateInstitutional={canCreateInstitutional}
            submitAction={createCalendarEventAction}
          />
        </div>

        <aside className="panel" id="integracao">
          <h2>Configurações de integração da agenda</h2>
          <p className="muted-small">
            A integração com agendas externas é opcional. Você pode usar a
            agenda apenas dentro da Escola LaBC ou autorizar a exportação para
            sua agenda pessoal.
          </p>
          <form action={saveCalendarIntegrationAction} className="form-grid agenda-settings">
            <label className="field">
              <span>Forma de integração</span>
              <select defaultValue={integration.provider} name="provedor">
                <option value="none">Usar apenas na Escola LaBC</option>
                <option value="ics">Exportar via arquivo .ics</option>
                <option value="apple">Apple Calendar via .ics</option>
                <option value="google">Google Calendar (simulado)</option>
                <option value="outlook">Outlook/Microsoft 365 (simulado)</option>
              </select>
            </label>
            <label className="check-row agenda-check">
              <input
                defaultChecked={integration.enabled}
                name="habilitada"
                type="checkbox"
              />
              <span>
                <strong>Ativar configuração opcional</strong>
                <small>
                  Você pode desativar esta preferência a qualquer momento.
                </small>
              </span>
            </label>
            <label className="check-row agenda-check">
              <input
                defaultChecked={integration.autoSyncCourseEvents}
                name="sincronizarEventosCurso"
                type="checkbox"
              />
              <span>Preparar sincronização futura de eventos de cursos.</span>
            </label>
            <label className="check-row agenda-check">
              <input
                defaultChecked={integration.autoSyncPersonalEvents}
                name="sincronizarEventosPessoais"
                type="checkbox"
              />
              <span>Preparar sincronização futura de compromissos pessoais.</span>
            </label>
            <div className="integration-notice">
              <strong>Privacidade e integração externa</strong>
              <p>
                Google Calendar e Outlook estão preparados como simulação neste
                MVP. Nenhum dado ou token é enviado a serviço externo.
              </p>
              <p>{calendarIntegrationProviders.ics.description}</p>
            </div>
            <button className="button" type="submit">
              Salvar configuração
            </button>
          </form>
        </aside>
      </section>
    </AppShell>
  );
}

function CalendarEventForm({
  event,
  scopes,
  canCreateClassEvent,
  canCreateInstitutional,
  submitAction
}: {
  event?: CalendarEvent;
  scopes: Awaited<ReturnType<typeof listCalendarScopes>>;
  canCreateClassEvent: boolean;
  canCreateInstitutional: boolean;
  submitAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={submitAction} className="form-grid agenda-event-form">
      {event ? <input name="eventoId" type="hidden" value={event.id} /> : null}
      <div className="field">
        <label htmlFor={`titulo-${event?.id ?? "novo"}`}>Título</label>
        <input
          defaultValue={event?.title ?? ""}
          id={`titulo-${event?.id ?? "novo"}`}
          maxLength={140}
          name="titulo"
          placeholder="Revisar material da próxima aula"
          required
        />
      </div>
      <div className="field">
        <label htmlFor={`descricao-${event?.id ?? "novo"}`}>Descrição</label>
        <textarea
          defaultValue={event?.description ?? ""}
          id={`descricao-${event?.id ?? "novo"}`}
          name="descricao"
          placeholder="Informações úteis para este compromisso."
        />
      </div>
      <div className="agenda-form-columns">
        <div className="field">
          <label htmlFor={`tipo-${event?.id ?? "novo"}`}>Tipo</label>
          <select defaultValue={event?.type ?? "compromisso_pessoal"} id={`tipo-${event?.id ?? "novo"}`} name="tipo">
            {calendarEventTypes.map((type) => (
              <option key={type} value={type}>
                {uiLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`visibilidade-${event?.id ?? "novo"}`}>Visibilidade</label>
          <select
            defaultValue={event?.visibility ?? "private"}
            disabled={Boolean(event)}
            id={`visibilidade-${event?.id ?? "novo"}`}
            name="visibilidade"
          >
            <option value="private">Privado - apenas eu</option>
            {canCreateClassEvent ? <option value="class">Turma vinculada</option> : null}
            {canCreateInstitutional ? (
              <option value="institutional">Institucional</option>
            ) : null}
          </select>
          {event ? (
            <input name="visibilidade" type="hidden" value={event.visibility} />
          ) : null}
        </div>
      </div>
      {canCreateClassEvent ? (
        <div className="field">
          <label htmlFor={`turma-${event?.id ?? "novo"}`}>Turma vinculada, quando compartilhado</label>
          <select
            defaultValue={event?.classGroupId ?? ""}
            id={`turma-${event?.id ?? "novo"}`}
            name="turmaId"
          >
            <option value="">Sem vínculo</option>
            {scopes.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.cursoNome} - {scope.nome}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="agenda-form-columns">
        <div className="field">
          <label htmlFor={`inicio-${event?.id ?? "novo"}`}>Início</label>
          <input
            defaultValue={event?.startDateTime ?? ""}
            id={`inicio-${event?.id ?? "novo"}`}
            name="inicioEm"
            required
            type="datetime-local"
          />
        </div>
        <div className="field">
          <label htmlFor={`fim-${event?.id ?? "novo"}`}>Término</label>
          <input
            defaultValue={event?.endDateTime ?? ""}
            id={`fim-${event?.id ?? "novo"}`}
            name="fimEm"
            required
            type="datetime-local"
          />
        </div>
      </div>
      <div className="agenda-form-columns">
        <div className="field">
          <label htmlFor={`local-${event?.id ?? "novo"}`}>Local</label>
          <input defaultValue={event?.location ?? ""} id={`local-${event?.id ?? "novo"}`} name="local" />
        </div>
        <div className="field">
          <label htmlFor={`link-${event?.id ?? "novo"}`}>Link online</label>
          <input defaultValue={event?.onlineLink ?? ""} id={`link-${event?.id ?? "novo"}`} name="linkOnline" placeholder="https://" type="url" />
        </div>
      </div>
      <label className="field">
        <span>Lembrete</span>
        <select defaultValue={event?.reminderMinutes ?? ""} name="lembreteMinutos">
          <option value="">Sem lembrete</option>
          <option value="10">10 minutos antes</option>
          <option value="30">30 minutos antes</option>
          <option value="60">1 hora antes</option>
          <option value="1440">1 dia antes</option>
        </select>
      </label>
      <label className="check-row agenda-check">
        <input defaultChecked={event?.syncEnabled ?? false} name="sincronizar" type="checkbox" />
        <span>Marcar este evento para sincronização futura, se ativada.</span>
      </label>
      <div className="action-row compact">
        <button className="button" type="submit">
          {event ? "Salvar alterações" : "Salvar compromisso"}
        </button>
        {event ? (
          <>
            <input
              name="status"
              type="hidden"
              value={event.status === "completed" ? "scheduled" : "completed"}
            />
            <button
              className="button secondary"
              formAction={updateCalendarEventStatusAction}
              type="submit"
            >
              {event.status === "completed" ? "Reabrir" : "Concluir"}
            </button>
            <button
              className="text-button danger"
              formAction={deleteCalendarEventAction}
              type="submit"
            >
              Excluir
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

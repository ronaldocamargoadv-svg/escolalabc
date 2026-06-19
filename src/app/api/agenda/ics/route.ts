import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { exportCalendarToIcs, listCalendarEvents } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  const user = await requirePermission("calendar.export");
  const params = request.nextUrl.searchParams;
  const events = await listCalendarEvents(user, {
    type: params.get("tipo") ?? undefined,
    courseId: params.get("cursoId") ?? undefined,
    classGroupId: params.get("turmaId") ?? undefined,
    status: params.get("status") ?? undefined,
    source: params.get("origem") ?? undefined,
    month: params.get("mes") ?? undefined
  });
  const eventId = params.get("eventoId");
  const selectedEvents = eventId
    ? events.filter((event) => event.id === eventId)
    : events;

  return new Response(exportCalendarToIcs(selectedEvents, user.id), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agenda-escola-labc.ics"',
      "Cache-Control": "private, no-store"
    }
  });
}

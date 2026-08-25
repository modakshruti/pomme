import { requireUserId } from "@/app/lib/auth";
import {
  readDay,
  readSettings,
  writeDay,
  writeSettings,
} from "@/app/lib/repository";
import { isoDaySchema, stateRequestSchema } from "@/app/lib/schemas";

const unauthorized = () =>
  Response.json({ error: "Authentication required" }, { status: 401 });

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const requested = new URL(request.url).searchParams.get("day");
  if (requested === "settings")
    return Response.json(await readSettings(userId));
  const day = requested ?? new Date().toISOString().slice(0, 10);
  const parsed = isoDaySchema.safeParse(day);
  if (!parsed.success)
    return Response.json({ error: "Invalid date" }, { status: 400 });
  return Response.json(await readDay(userId, parsed.data));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const parsed = stateRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Invalid state", issues: parsed.error.issues },
      { status: 400 },
    );
  if (parsed.data.day === "settings")
    await writeSettings(userId, parsed.data.data);
  else await writeDay(userId, parsed.data.day, parsed.data.data);
  return Response.json({ ok: true });
}

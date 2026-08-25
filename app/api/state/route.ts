import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

async function userId() {
  const h = await headers();
  return h.get('oai-authenticated-user-id') ?? 'local-preview';
}

export async function GET(request: Request) {
  const day = new URL(request.url).searchParams.get('day') ?? new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare('SELECT data_json FROM tracker_state WHERE user_id = ? AND day = ?').bind(await userId(), day).first<{ data_json: string }>();
  return Response.json(row ? JSON.parse(row.data_json) : null);
}

export async function POST(request: Request) {
  const body = await request.json();
  const day = typeof body.day === 'string' ? body.day : new Date().toISOString().slice(0, 10);
  await env.DB.prepare(`INSERT INTO tracker_state (user_id, day, data_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, day) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP`)
    .bind(await userId(), day, JSON.stringify(body.data ?? {})).run();
  return Response.json({ ok: true });
}

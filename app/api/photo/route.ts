import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const h = await headers();
  const user = h.get('oai-authenticated-user-id') ?? 'local-preview';
  const form = await request.formData();
  const file = form.get('photo');
  if (!(file instanceof File)) return Response.json({ error: 'Photo required' }, { status: 400 });
  const key = `${user}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  await env.UPLOADS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ key });
}

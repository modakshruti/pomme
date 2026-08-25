import { headers } from "next/headers";

export async function requireUserId() {
  const userId = (await headers()).get("oai-authenticated-user-id");
  return userId || null;
}

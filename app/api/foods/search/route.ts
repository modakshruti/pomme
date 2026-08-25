import { normalizeFoods, type OpenFoodFactsProduct } from "@/app/lib/food";
import { foodQuerySchema } from "@/app/lib/schemas";

export async function GET(request: Request) {
  const parsed = foodQuerySchema.safeParse(
    new URL(request.url).searchParams.get("q"),
  );
  if (!parsed.success)
    return Response.json({ error: "Enter 2–100 characters" }, { status: 400 });
  const upstream = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  upstream.search = new URLSearchParams({
    search_terms: parsed.data,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "8",
    fields: "product_name,brands,nutriments,serving_size",
  }).toString();
  try {
    const response = await fetch(upstream, {
      headers: { "user-agent": "Pomme/1.0 (github.com/modakshruti/pomme)" },
    });
    if (!response.ok)
      throw new Error(`Open Food Facts returned ${response.status}`);
    const json = (await response.json()) as {
      products?: OpenFoodFactsProduct[];
    };
    const foods = normalizeFoods(json.products ?? [], parsed.data);
    return Response.json(
      { foods },
      { headers: { "cache-control": "public, max-age=300" } },
    );
  } catch {
    return Response.json(
      { error: "Food search is temporarily unavailable" },
      { status: 502 },
    );
  }
}

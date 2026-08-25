import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/foods/search/route";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/foods/search", () => {
  it("rejects a short query without calling the provider", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await GET(
      new Request("https://pomme.test/api/foods/search?q=x"),
    );
    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("returns a normalized provider response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        products: [
          {
            product_name: "Greek yogurt",
            brands: "Example",
            serving_size: "170 g",
            nutriments: { proteins_serving: 17 },
          },
        ],
      }),
    );
    const response = await GET(
      new Request("https://pomme.test/api/foods/search?q=yogurt"),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      foods: [
        {
          name: "Greek yogurt · Example",
          protein: 17,
          basis: "per serving (170 g)",
        },
      ],
    });
  });
});

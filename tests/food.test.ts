import { describe, expect, it } from "vitest";
import { normalizeFoods } from "../app/lib/food";

describe("Open Food Facts normalization", () => {
  it("prefers serving protein and labels the serving", () => {
    expect(
      normalizeFoods(
        [
          {
            product_name: "Greek yogurt",
            serving_size: "170 g",
            nutriments: { proteins_serving: 17, proteins_100g: 10 },
          },
        ],
        "yogurt",
      ),
    ).toEqual([
      { name: "Greek yogurt", protein: 17, basis: "per serving (170 g)" },
    ]);
  });

  it("falls back to protein per 100 g and removes empty results", () => {
    expect(
      normalizeFoods(
        [
          { product_name: "Tofu", nutriments: { proteins_100g: 12.34 } },
          { product_name: "Water", nutriments: {} },
        ],
        "food",
      ),
    ).toEqual([{ name: "Tofu", protein: 12.3, basis: "per 100 g" }]);
  });
});

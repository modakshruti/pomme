import type { FoodResult } from "./schemas";

export type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number>;
};

export function normalizeFoods(
  products: OpenFoodFactsProduct[],
  fallbackName: string,
): FoodResult[] {
  return products
    .map((product) => {
      const serving = product.nutriments?.proteins_serving;
      const per100 = product.nutriments?.proteins_100g;
      return {
        name:
          [product.product_name, product.brands].filter(Boolean).join(" · ") ||
          fallbackName,
        protein: Math.round((serving ?? per100 ?? 0) * 10) / 10,
        basis:
          serving != null
            ? `per serving${product.serving_size ? ` (${product.serving_size})` : ""}`
            : "per 100 g",
      };
    })
    .filter((food) => food.protein > 0);
}

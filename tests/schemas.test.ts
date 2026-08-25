import { describe, expect, it } from "vitest";
import {
  dayStateSchema,
  settingsSchema,
  stateRequestSchema,
} from "../app/lib/schemas";

describe("tracker validation", () => {
  it("accepts a valid daily record", () => {
    expect(
      dayStateSchema.parse({
        water: 4,
        protein: 62.5,
        weight: "78.4",
        vitamins: ["Vitamin D"],
      }),
    ).toBeTruthy();
  });

  it("rejects impossible hydration totals", () => {
    expect(
      dayStateSchema.safeParse({
        water: 9,
        protein: 20,
        weight: "",
        vitamins: [],
      }).success,
    ).toBe(false);
  });

  it("rejects arbitrary state keys and invalid dates", () => {
    expect(
      stateRequestSchema.safeParse({ day: "today", data: {} }).success,
    ).toBe(false);
  });

  it("validates medication schedule input", () => {
    expect(
      settingsSchema.safeParse({
        proteinGoal: 90,
        dose: "2",
        doseDay: "Thursday",
        doseTime: "19:30",
        supplements: [],
        lastDoseDate: "",
      }).success,
    ).toBe(true);
  });
});

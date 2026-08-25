import { z } from "zod";

export const isoDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const dayStateSchema = z.object({
  water: z.number().int().min(0).max(8),
  protein: z.number().min(0).max(1000),
  weight: z.string().max(16),
  vitamins: z.array(z.string().trim().min(1).max(80)).max(50),
});
export const settingsSchema = z.object({
  proteinGoal: z.number().int().min(20).max(300),
  dose: z.string().regex(/^\d+(\.\d{1,3})?$/),
  doseDay: z.enum([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
  doseTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  supplements: z.array(z.string().trim().min(1).max(80)).max(50),
  lastDoseDate: z.union([isoDaySchema, z.literal("")]),
});
export const stateRequestSchema = z.union([
  z.object({ day: z.literal("settings"), data: settingsSchema }),
  z.object({ day: isoDaySchema, data: dayStateSchema }),
]);
export const foodQuerySchema = z.string().trim().min(2).max(100);

export type DayState = z.infer<typeof dayStateSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type FoodResult = { name: string; protein: number; basis: string };

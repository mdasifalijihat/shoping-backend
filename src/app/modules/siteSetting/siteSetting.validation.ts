import { z } from "zod";

export const byKeySchema = z.object({
  params: z.object({ key: z.string().trim().min(1) }),
});
export const upsertSchema = byKeySchema.extend({
  body: z.strictObject({ value: z.json() }),
});

export type SettingValue = z.output<typeof upsertSchema>["body"]["value"];

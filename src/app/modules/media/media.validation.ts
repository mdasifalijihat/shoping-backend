import { z } from "zod";

export const deleteSchema = z.object({
  body: z.strictObject({ publicId: z.string().trim().min(1).max(255) }),
});
export type DeleteImage = z.output<typeof deleteSchema>["body"];

import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

const id = z.string().trim().min(1);
export const byIdSchema = z.object({ params: z.object({ id }) });
export const submitSchema = z.object({
  body: z.strictObject({
    productId: id,
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().nullable().exactOptional(),
  }),
});
export const listSchema = z.object({
  params: z.object({ productId: id }),
  query: paginationSchema,
});
export const approveSchema = byIdSchema.extend({
  body: z.strictObject({ isApproved: z.boolean().exactOptional() }).default({}),
});
export type SubmitReview = z.output<typeof submitSchema>["body"];

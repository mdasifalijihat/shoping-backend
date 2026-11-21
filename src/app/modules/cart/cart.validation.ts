import { z } from "zod";

export const cartItemSchema = z.strictObject({
  productId: z.string().trim().min(1),
  quantity: z.int32().positive(),
  selectedVariant: z.record(z.string(), z.json()).nullable().exactOptional(),
});
export const addSchema = z.object({ body: cartItemSchema });
export const byItemSchema = z.object({
  params: z.object({ itemId: z.string().trim().min(1) }),
});
export const updateSchema = byItemSchema.extend({
  body: z.strictObject({ quantity: z.int32() }),
});

export type CartItemInput = z.output<typeof cartItemSchema>;

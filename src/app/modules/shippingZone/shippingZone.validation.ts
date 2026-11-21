import { z } from "zod";

const id = z.string().trim().min(1);
const orderIndex = z.int32().nonnegative();
const fields = {
  name: z.string().trim().min(1),
  charge: z.number().nonnegative(),
  isActive: z.boolean().exactOptional(),
  orderIndex: orderIndex.exactOptional(),
};

export const byIdSchema = z.object({ params: z.object({ id }) });
export const createSchema = z.object({ body: z.strictObject(fields) });
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({
      ...fields,
      name: fields.name.exactOptional(),
      charge: fields.charge.exactOptional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update"
    ),
});
export const reorderSchema = z.object({
  body: z.strictObject({
    items: z
      .array(z.strictObject({ id, orderIndex }))
      .min(1)
      .refine(
        (items) => new Set(items.map(({ id }) => id)).size === items.length,
        "Shipping zone IDs must be unique"
      ),
  }),
});

export type CreateShippingZone = z.output<typeof createSchema>["body"];
export type UpdateShippingZone = z.output<typeof updateSchema>["body"];
export type ShippingZoneOrder = z.output<typeof reorderSchema>["body"];

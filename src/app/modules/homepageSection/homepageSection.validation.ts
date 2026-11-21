import { z } from "zod";
import { SectionType } from "../../../generated/prisma/enums.js";

const id = z.string().trim().min(1);
const orderIndex = z.int32().nonnegative();
const fields = {
  title: z.string().trim().min(1),
  subtitle: z.string().trim().nullable().exactOptional(),
  type: z.enum(SectionType),
  orderIndex: orderIndex.exactOptional(),
  isActive: z.boolean().exactOptional(),
  config: z.json().exactOptional(),
};

export const byIdSchema = z.object({ params: z.object({ id }) });
export const createSchema = z.object({ body: z.strictObject(fields) });
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({
      ...fields,
      title: fields.title.exactOptional(),
      type: fields.type.exactOptional(),
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
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "Item IDs must be unique"
      ),
  }),
});

export type CreateSection = z.output<typeof createSchema>["body"];
export type UpdateSection = z.output<typeof updateSchema>["body"];
export type SectionOrder = z.output<typeof reorderSchema>["body"];

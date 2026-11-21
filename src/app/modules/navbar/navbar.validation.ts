import { z } from "zod";

const id = z.string().trim().min(1);
const orderIndex = z.int32().nonnegative();
const url = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    const parsed = URL.parse(value, "https://example.invalid");
    return (
      parsed !== null &&
      ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)
    );
  }, "Use a relative link or an HTTP, HTTPS, mailto, or tel URL");

const fields = {
  title: z.string().trim().min(1),
  url: url.nullable().exactOptional(),
  icon: z.string().trim().nullable().exactOptional(),
  orderIndex: orderIndex.exactOptional(),
  isActive: z.boolean().exactOptional(),
  openInNew: z.boolean().exactOptional(),
  parentId: id.nullable().exactOptional(),
};

export const byIdSchema = z.object({ params: z.object({ id }) });
export const createSchema = z.object({ body: z.strictObject(fields) });
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({ ...fields, title: fields.title.exactOptional() })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update"
    ),
});
export const reorderSchema = z.object({
  body: z.strictObject({
    items: z
      .array(z.strictObject({ id, orderIndex, parentId: fields.parentId }))
      .min(1)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "Item IDs must be unique"
      ),
  }),
});

export type CreateNavbarItem = z.output<typeof createSchema>["body"];
export type UpdateNavbarItem = z.output<typeof updateSchema>["body"];
export type NavbarOrder = z.output<typeof reorderSchema>["body"];

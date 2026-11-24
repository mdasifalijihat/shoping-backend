import { z } from "zod";

const id = z.string().trim().min(1);
const orderIndex = z.int32().nonnegative();
const imageUrl = z
  .url({ protocol: /^https?$/ })
  .nullable()
  .exactOptional();
const slug = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens"
  )
  .refine((value) => value !== "admin", "This category slug is reserved");
const fields = {
  slug: slug.exactOptional(),
  name: z.string().trim().min(1),
  description: z.string().nullable().exactOptional(),
  iconUrl: imageUrl,
  bannerUrl: imageUrl,
  orderIndex: orderIndex.exactOptional(),
  isFeatured: z.boolean().exactOptional(),
  isActive: z.boolean().exactOptional(),
  parentId: id.nullable().exactOptional(),
};

export const listSchema = z.object({
  query: z.object({ featured: z.enum(["true", "false"]).exactOptional() }),
});
export const bySlugSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1) }),
});
export const byIdSchema = z.object({ params: z.object({ id }) });
export const createSchema = z.object({ body: z.strictObject(fields) });
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({ ...fields, name: fields.name.exactOptional() })
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
        (items) => new Set(items.map(({ id }) => id)).size === items.length,
        "Category IDs must be unique"
      ),
  }),
});

export type CategoryQuery = z.output<typeof listSchema>["query"];
export type CreateCategory = z.output<typeof createSchema>["body"];
export type UpdateCategory = z.output<typeof updateSchema>["body"];
export type CategoryOrder = z.output<typeof reorderSchema>["body"];

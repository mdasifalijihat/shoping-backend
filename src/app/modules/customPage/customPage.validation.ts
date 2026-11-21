import { z } from "zod";

const slug = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens"
  );
const fields = {
  title: z.string().trim().min(1),
  slug: slug.exactOptional(),
  content: z.string(),
  isActive: z.boolean().exactOptional(),
};

export const byIdSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});
export const bySlugSchema = z.object({ params: z.object({ slug }) });
export const createSchema = z.object({ body: z.strictObject(fields) });
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({
      ...fields,
      title: fields.title.exactOptional(),
      content: fields.content.exactOptional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update"
    ),
});

export type CreatePage = z.output<typeof createSchema>["body"];
export type UpdatePage = z.output<typeof updateSchema>["body"];

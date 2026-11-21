import { z } from "zod";

const name = z.string().trim().min(1);
const values = z
  .array(z.string().trim().min(1))
  .refine(
    (options) => new Set(options).size === options.length,
    "Attribute values must be unique"
  );

export const byIdSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});
export const createSchema = z.object({
  body: z.strictObject({ name, values }),
});
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({
      name: name.exactOptional(),
      values: values.exactOptional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update"
    ),
});

export type CreateAttribute = z.output<typeof createSchema>["body"];
export type UpdateAttribute = z.output<typeof updateSchema>["body"];

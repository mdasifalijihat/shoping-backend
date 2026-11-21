import { z } from "zod";

const id = z.string().trim().min(1);
const orderIndex = z.int32().nonnegative();
const fieldType = z.enum([
  "text",
  "number",
  "tel",
  "textarea",
  "file",
  "select",
]);
const fieldOptions = z
  .array(z.string().trim().min(1))
  .min(1)
  .refine(
    (options) => new Set(options).size === options.length,
    "Select options must be unique"
  );
const customField = z
  .strictObject({
    name: z
      .string()
      .trim()
      .regex(
        /^[a-z][a-zA-Z0-9]*$/,
        "Use an alphanumeric key starting with a lowercase letter"
      ),
    label: z.string().trim().min(1),
    type: fieldType,
    placeholder: z.string().exactOptional(),
    required: z.boolean().default(true),
    options: fieldOptions.exactOptional(),
  })
  .refine(
    ({ type, options }) =>
      type === "select" ? options !== undefined : options === undefined,
    {
      path: ["options"],
      message:
        "Select fields require options. Options are only allowed for select fields",
    }
  );

export const customFieldsSchema = z
  .array(customField)
  .refine(
    (fields) => new Set(fields.map(({ name }) => name)).size === fields.length,
    "Payment field names must be unique"
  );

const fields = {
  name: z.string().trim().min(1),
  logoUrl: z
    .url({ protocol: /^https?$/ })
    .nullable()
    .exactOptional(),
  accountNumber: z.string().trim().min(1).nullable().exactOptional(),
  instructions: z.string().nullable().exactOptional(),
  customFieldsSchema: customFieldsSchema.exactOptional(),
  orderIndex: orderIndex.exactOptional(),
  isActive: z.boolean().exactOptional(),
};

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
      .array(z.strictObject({ id, orderIndex }))
      .min(1)
      .refine(
        (items) => new Set(items.map(({ id }) => id)).size === items.length,
        "Payment method IDs must be unique"
      ),
  }),
});

export type CreatePaymentMethod = z.output<typeof createSchema>["body"];
export type UpdatePaymentMethod = z.output<typeof updateSchema>["body"];
export type PaymentMethodOrder = z.output<typeof reorderSchema>["body"];

import { z } from "zod";

const id = z.string().trim().min(1);
const name = z.string().trim().min(1);
const price = z.number().nonnegative();
const stock = z.int32().nonnegative();
const url = z.url({ protocol: /^https?$/ });
const attributes = z.record(
  name,
  z.union([z.string(), z.number(), z.boolean()])
);
export const variantSchema = z.strictObject({
  sku: name,
  attributes,
  price,
  stock,
});
const variants = z
  .array(variantSchema)
  .refine(
    (options) => new Set(options.map(({ sku }) => sku)).size === options.length,
    "Variant SKUs must be unique within the product"
  );
const fields = {
  title: name,
  description: z.string(),
  basePrice: price,
  discountPrice: price.nullable().exactOptional(),
  sku: name.nullable().exactOptional(),
  stock: stock.exactOptional(),
  thumbnail: url,
  images: z.array(url).exactOptional(),
  customAttributes: attributes.exactOptional(),
  variants: variants.exactOptional(),
  isFeatured: z.boolean().exactOptional(),
  isActive: z.boolean().exactOptional(),
  categoryId: id,
};

const queryBoolean = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .exactOptional();
const queryPrice = z
  .string()
  .trim()
  .min(1)
  .pipe(z.coerce.number<string>().nonnegative())
  .exactOptional();
const pagination = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .pipe(z.coerce.number<string>().int().min(1).max(10_000_000))
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .pipe(z.coerce.number<string>().int().min(1).max(100))
    .default(20),
  searchTerm: z.string().trim().exactOptional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "basePrice", "stock"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const listAdminSchema = z.object({ query: pagination });
export const listSchema = z.object({
  query: pagination
    .extend({
      categorySlug: name.exactOptional(),
      minPrice: queryPrice,
      maxPrice: queryPrice,
      isFeatured: queryBoolean,
      inStock: queryBoolean,
    })
    .refine(
      ({ minPrice, maxPrice }) =>
        minPrice === undefined ||
        maxPrice === undefined ||
        minPrice <= maxPrice,
      {
        path: ["maxPrice"],
        message: "Maximum price must be at least the minimum price",
      }
    ),
});
export const bySlugSchema = z.object({ params: z.object({ slug: name }) });
export const byIdSchema = z.object({ params: z.object({ id }) });
export const createSchema = z.object({
  body: z
    .strictObject(fields)
    .refine(
      ({ basePrice, discountPrice }) =>
        discountPrice == null || discountPrice <= basePrice,
      {
        path: ["discountPrice"],
        message: "Discount price cannot exceed base price",
      }
    ),
});
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({
      ...fields,
      title: fields.title.exactOptional(),
      description: fields.description.exactOptional(),
      basePrice: fields.basePrice.exactOptional(),
      thumbnail: fields.thumbnail.exactOptional(),
      categoryId: fields.categoryId.exactOptional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update"
    )
    .refine(
      ({ basePrice, discountPrice }) =>
        basePrice === undefined ||
        discountPrice == null ||
        discountPrice <= basePrice,
      {
        path: ["discountPrice"],
        message: "Discount price cannot exceed base price",
      }
    ),
});

export type ProductQuery = z.output<typeof listSchema>["query"];
export type AdminProductQuery = z.output<typeof listAdminSchema>["query"];
export type CreateProduct = z.output<typeof createSchema>["body"];
export type UpdateProduct = z.output<typeof updateSchema>["body"];

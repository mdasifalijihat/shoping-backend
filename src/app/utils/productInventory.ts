import { isDeepStrictEqual } from "node:util";
import type { Prisma, Product } from "../../generated/prisma/client.js";
import AppError from "../errors/AppError.js";
import { variantSchema } from "../modules/product/product.validation.js";

export type InventoryProduct = Pick<
  Product,
  "id" | "title" | "stock" | "basePrice" | "discountPrice" | "variants"
>;

export function jsonObject(
  value: Prisma.JsonValue | undefined
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const storedVariantSchema = variantSchema.strip();

export function findVariant(
  product: InventoryProduct,
  selection: Prisma.JsonValue | undefined
) {
  if (!jsonObject(selection) || !Array.isArray(product.variants))
    return undefined;
  for (const [index, raw] of product.variants.entries()) {
    const parsed = storedVariantSchema.safeParse(raw);
    if (!parsed.success) continue;
    const variant = parsed.data;
    const attributes = jsonObject(selection.attributes)
      ? selection.attributes
      : selection;
    const matches =
      typeof selection.sku === "string"
        ? variant.sku === selection.sku
        : isDeepStrictEqual(variant.attributes, attributes);
    if (matches) return { ...variant, index };
  }
  return undefined;
}

export function unitPrice(
  product: InventoryProduct,
  selection: Prisma.JsonValue | undefined
) {
  return (
    findVariant(product, selection)?.price ??
    product.discountPrice ??
    product.basePrice
  );
}

export function assertStock(
  title: string,
  requested: number,
  available: number
) {
  if (requested > available)
    throw new AppError(409, `Insufficient stock for ${title}`);
}

export function withVariantStock(
  variants: Prisma.JsonValue,
  stockChanges: ReadonlyMap<number, number>
) {
  if (!Array.isArray(variants)) return undefined;
  return variants.map((variant, index) => {
    const stock = stockChanges.get(index);
    return stock !== undefined && jsonObject(variant)
      ? { ...variant, stock }
      : variant;
  });
}

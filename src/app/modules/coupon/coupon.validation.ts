import { z } from "zod";
import { DiscountType } from "../../../generated/prisma/enums.js";

const code = z.string().trim().min(1).toUpperCase();
const amount = z.number().nonnegative();
const fields = {
  code,
  discountType: z.enum(DiscountType),
  discountValue: z.number().positive(),
  minOrderAmount: amount.nullable().exactOptional(),
  maxDiscount: amount.nullable().exactOptional(),
  usageLimit: z.int32().nonnegative().nullable().exactOptional(),
  expiresAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .nullable()
    .exactOptional(),
  isActive: z.boolean().exactOptional(),
};

export function validDiscount(
  discountType?: DiscountType,
  discountValue?: number
) {
  return (
    discountType !== DiscountType.PERCENTAGE ||
    discountValue === undefined ||
    discountValue <= 100
  );
}

const discountIssue = {
  path: ["discountValue"],
  message: "Percentage discounts cannot exceed 100",
};

export const byIdSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});
export const createSchema = z.object({
  body: z
    .strictObject(fields)
    .refine(
      ({ discountType, discountValue }) =>
        validDiscount(discountType, discountValue),
      discountIssue
    ),
});
export const updateSchema = byIdSchema.extend({
  body: z
    .strictObject({
      ...fields,
      code: fields.code.exactOptional(),
      discountType: fields.discountType.exactOptional(),
      discountValue: fields.discountValue.exactOptional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update"
    )
    .refine(
      ({ discountType, discountValue }) =>
        validDiscount(discountType, discountValue),
      discountIssue
    ),
});
export const applySchema = z.object({
  body: z.strictObject({ code, subTotal: amount }),
});

export type CreateCoupon = z.output<typeof createSchema>["body"];
export type UpdateCoupon = z.output<typeof updateSchema>["body"];
export type ApplyCoupon = z.output<typeof applySchema>["body"];

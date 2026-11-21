import { Prisma, type Coupon } from "../../../generated/prisma/client.js";
import { DiscountType } from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import {
  validDiscount,
  type ApplyCoupon,
  type CreateCoupon,
  type UpdateCoupon,
} from "./coupon.validation.js";

export function create(data: CreateCoupon) {
  return prisma.coupon.create({ data });
}

export function listAdmin() {
  return prisma.coupon.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

export async function apply({ code, subTotal }: ApplyCoupon) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  return calculateCoupon(coupon, subTotal);
}

export function calculateCoupon(
  coupon: Coupon | null,
  subTotal: number | Prisma.Decimal
) {
  if (!coupon) throw new AppError(404, "Coupon code not found");
  const subtotal = new Prisma.Decimal(subTotal);
  if (!coupon.isActive) throw new AppError(400, "This coupon is inactive");
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
    throw new AppError(400, "This coupon has expired");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(400, "This coupon has reached its usage limit");
  }
  if (coupon.minOrderAmount !== null && subtotal.lt(coupon.minOrderAmount)) {
    throw new AppError(
      400,
      `Order subtotal must be at least ${coupon.minOrderAmount} to use this coupon`
    );
  }

  const percentage = coupon.discountType === DiscountType.PERCENTAGE;
  const rawDiscount = percentage
    ? subtotal.times(coupon.discountValue).div(100)
    : new Prisma.Decimal(coupon.discountValue);
  const cap =
    percentage && coupon.maxDiscount !== null
      ? Prisma.Decimal.min(subtotal, coupon.maxDiscount)
      : subtotal;
  const discount = Prisma.Decimal.min(
    rawDiscount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
    cap
  );

  return {
    valid: true as const,
    couponId: coupon.id,
    code: coupon.code,
    discountAmount: discount.toNumber(),
    finalAmount: subtotal.minus(discount).toNumber(),
  };
}

export async function update(id: string, data: UpdateCoupon) {
  const { discountType, discountValue } = data;
  if ((discountType === undefined) === (discountValue === undefined)) {
    return prisma.coupon.update({ where: { id }, data });
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const current = await tx.coupon.findUniqueOrThrow({
          where: { id },
          select: { discountType: true, discountValue: true },
        });
        if (
          !validDiscount(
            discountType ?? current.discountType,
            discountValue ?? current.discountValue
          )
        ) {
          throw new AppError(400, "Percentage discounts cannot exceed 100");
        }
        return tx.coupon.update({ where: { id }, data });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AppError(
        409,
        "The coupon changed concurrently. Retry the update."
      );
    }
    throw error;
  }
}

export async function remove(id: string) {
  await prisma.coupon.delete({ where: { id } });
}

import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import { paginationMeta, type Pagination } from "../../utils/pagination.js";
import serializable from "../../utils/serializable.js";
import type { SubmitReview } from "./review.validation.js";

export function submit(
  userId: string,
  { productId, rating, comment }: SubmitReview
) {
  return serializable(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) throw new AppError(404, "Product not found");
    const existing = await tx.review.findFirst({
      where: { userId, productId },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    const data = {
      rating,
      isApproved: false,
      ...(comment === undefined ? {} : { comment }),
    };
    if (existing) return tx.review.update({ where: { id: existing.id }, data });
    return tx.review.create({ data: { ...data, userId, productId } });
  });
}

export async function list(productId: string, pagination: Pagination) {
  const { page, limit } = pagination;
  const where = { productId, isApproved: true, product: { isActive: true } };
  const [reviews, summary] = await prisma.$transaction(
    [
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { name: true, image: true } },
        },
      }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );
  const reviewCount = summary._count._all;
  return {
    meta: paginationMeta(pagination, reviewCount),
    data: {
      reviews,
      summary: { averageRating: summary._avg.rating, reviewCount },
    },
  };
}

export async function approve(id: string, isApproved?: boolean) {
  if (isApproved !== undefined)
    return prisma.review.update({ where: { id }, data: { isApproved } });
  return serializable(async (tx) => {
    const review = await tx.review.findUniqueOrThrow({
      where: { id },
      select: { isApproved: true },
    });
    return tx.review.update({
      where: { id },
      data: { isApproved: !review.isApproved },
    });
  });
}

export async function remove(id: string, userId: string, admin: boolean) {
  const { count } = await prisma.review.deleteMany({
    where: admin ? { id } : { id, userId },
  });
  if (!count) throw new AppError(404, "Review not found");
}

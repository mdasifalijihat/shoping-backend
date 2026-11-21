import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import slugGenerator from "../../utils/slugGenerator.js";
import {
  categoryAncestors,
  descendantIds,
  requireCategory,
} from "../category/category.service.js";
import type {
  AdminProductQuery,
  CreateProduct,
  ProductQuery,
  UpdateProduct,
} from "./product.validation.js";

export async function create({ images = [], ...fields }: CreateProduct) {
  await requireCategory(fields.categoryId);
  return prisma.product.create({
    data: { ...fields, images, slug: slugGenerator(fields.title) },
  });
}

async function paginate(
  query: AdminProductQuery,
  filters: Prisma.ProductWhereInput
) {
  const { page, limit, searchTerm, sortBy, sortOrder } = query;
  const match = searchTerm
    ? {
        contains: searchTerm.replace(/[\\%_]/g, "\\$&"),
        mode: "insensitive" as const,
      }
    : undefined;
  const search = match
    ? { OR: [{ title: match }, { description: match }] }
    : {};
  const where = { AND: [filters, search] };
  const [data, total] = await prisma.$transaction(
    [
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }],
      }),
      prisma.product.count({ where }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );
  return {
    data,
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
}

export async function list(query: ProductQuery) {
  const { categorySlug, minPrice, maxPrice, isFeatured, inStock } = query;
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, parentId: true },
  });
  const root = categories.find(({ slug }) => slug === categorySlug);
  const byId = new Map(categories.map((category) => [category.id, category]));
  const categoryIds =
    categorySlug === undefined
      ? descendantIds(categories, null)
      : root && categoryAncestors(root, byId) !== null
        ? descendantIds(categories, root.id)
        : [];
  const filters: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: { in: categoryIds },
  };
  if (isFeatured !== undefined) filters.isFeatured = isFeatured;
  if (inStock !== undefined) filters.stock = inStock ? { gt: 0 } : 0;
  if (minPrice !== undefined || maxPrice !== undefined) {
    const range = {
      ...(minPrice === undefined ? {} : { gte: minPrice }),
      ...(maxPrice === undefined ? {} : { lte: maxPrice }),
    };
    filters.OR = [
      { discountPrice: range },
      { discountPrice: null, basePrice: range },
    ];
  }
  return paginate(query, filters);
}

export function listAdmin(query: AdminProductQuery) {
  return paginate(query, {});
}

export async function getBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true, category: { isActive: true } },
    include: {
      category: true,
      reviews: {
        where: { isApproved: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
      },
    },
  });
  if (!product) throw new AppError(404, "Product not found");

  const categories = await prisma.category.findMany({
    where: { isActive: true },
  });
  const byId = new Map(categories.map((category) => [category.id, category]));
  const category = byId.get(product.categoryId);
  const ancestors = category ? categoryAncestors(category, byId) : null;
  if (!category || !ancestors) throw new AppError(404, "Product not found");

  const reviewCount = product.reviews.length;
  const averageRating = reviewCount
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviewCount
    : null;
  return {
    ...product,
    category: { ...category, ancestors },
    averageRating,
    reviewCount,
  };
}

export async function update(id: string, data: UpdateProduct) {
  if (data.categoryId !== undefined) await requireCategory(data.categoryId);
  if (data.basePrice === undefined && data.discountPrice === undefined) {
    return prisma.product.update({ where: { id }, data });
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const current = await tx.product.findUniqueOrThrow({
          where: { id },
          select: { basePrice: true, discountPrice: true },
        });
        const basePrice = data.basePrice ?? current.basePrice;
        const discountPrice =
          data.discountPrice === undefined
            ? current.discountPrice
            : data.discountPrice;
        if (discountPrice !== null && discountPrice > basePrice) {
          throw new AppError(400, "Discount price cannot exceed base price");
        }
        return tx.product.update({ where: { id }, data });
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
        "The product changed concurrently. Retry the update."
      );
    }
    throw error;
  }
}

export async function remove(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    return { deactivated: false };
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2003"
    )
      throw error;
    await prisma.product.update({
      where: { id, orderItems: { some: {} } },
      data: { isActive: false },
    });
    return { deactivated: true };
  }
}

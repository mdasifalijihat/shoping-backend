import { Prisma } from "../../../generated/prisma/client.js";
import {
  OrderStatus,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import { isAdmin } from "../../middlewares/auth.js";
import { paginationMeta } from "../../utils/pagination.js";
import serializable from "../../utils/serializable.js";
import { profileSelect } from "../user/user.service.js";
import type { UsersQuery } from "./admin.validation.js";

const newestFirst = [{ createdAt: "desc" }, { id: "asc" }] as const;

export async function dashboardStats() {
  const [
    revenue,
    orders,
    pendingPaymentVerifications,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    recentOrders,
  ] = await prisma.$transaction(
    [
      prisma.order.aggregate({
        where: {
          OR: [
            { paymentStatus: PaymentStatus.PAID },
            { orderStatus: OrderStatus.DELIVERED },
          ],
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({ by: ["orderStatus"], _count: { _all: true } }),
      prisma.order.count({
        where: { paymentStatus: PaymentStatus.PENDING_VERIFICATION },
      }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.product.count(),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        orderBy: [{ stock: "asc" }, { id: "asc" }],
        select: { id: true, title: true, slug: true, stock: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: [...newestFirst],
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          createdAt: true,
          orderStatus: true,
          paymentStatus: true,
          paymentMethod: { select: { name: true } },
        },
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );

  const orderStatusCounts = {
    PENDING: 0,
    PAYMENT_VERIFIED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    RETURNED: 0,
  } satisfies Record<OrderStatus, number>;
  for (const order of orders)
    orderStatusCounts[order.orderStatus] = order._count._all;

  return {
    totalRevenue: revenue._sum.totalAmount ?? 0,
    totalOrders: orders.reduce((sum, order) => sum + order._count._all, 0),
    orderStatusCounts,
    pendingPaymentVerifications,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    lowStockCount: lowStockProducts.length,
    recentOrders,
  };
}

export async function listUsers({
  page,
  limit,
  searchTerm,
  role,
  isBlocked,
}: UsersQuery) {
  const where: Prisma.UserWhereInput = {
    ...(role === undefined ? {} : { role }),
    ...(isBlocked === undefined ? {} : { isBlocked }),
  };
  if (searchTerm) {
    const match = {
      contains: searchTerm.replace(/[\\%_]/g, "\\$&"),
      mode: "insensitive" as const,
    };
    where.OR = [{ name: match }, { email: match }, { phone: match }];
  }
  const [data, total] = await prisma.$transaction(
    [
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [...newestFirst],
        select: profileSelect,
      }),
      prisma.user.count({ where }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );
  return { data, meta: paginationMeta({ page, limit }, total) };
}

async function requireActiveAdmin(
  tx: Prisma.TransactionClient,
  actorId: string
) {
  const actor = await tx.user.findUnique({
    where: { id: actorId },
    select: { role: true, isBlocked: true },
  });
  if (!actor || actor.isBlocked || !isAdmin(actor.role))
    throw new AppError(403, "Insufficient permissions");
  return actor.role;
}

export function updateRole(actorId: string, id: string, role: Role) {
  return serializable(async (tx) => {
    if ((await requireActiveAdmin(tx, actorId)) !== Role.SUPER_ADMIN) {
      throw new AppError(403, "Only super admins can change user roles");
    }
    if (actorId === id && role !== Role.SUPER_ADMIN)
      throw new AppError(400, "You cannot demote yourself");
    return tx.user.update({
      where: { id },
      data: { role },
      select: profileSelect,
    });
  });
}

export function updateStatus(actorId: string, id: string, isBlocked?: boolean) {
  return serializable(async (tx) => {
    const actorRole = await requireActiveAdmin(tx, actorId);
    const target = await tx.user.findUnique({
      where: { id },
      select: { role: true, isBlocked: true },
    });
    if (!target) throw new AppError(404, "User not found");
    const nextStatus = isBlocked ?? !target.isBlocked;
    if (actorId === id && nextStatus)
      throw new AppError(400, "You cannot block yourself");
    if (actorRole === Role.ADMIN && target.role !== Role.CUSTOMER) {
      throw new AppError(
        403,
        "Admins can only change a customer's blocked status"
      );
    }
    return tx.user.update({
      where: { id },
      data: { isBlocked: nextStatus },
      select: profileSelect,
    });
  });
}

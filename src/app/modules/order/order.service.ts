import { randomBytes } from "node:crypto";
import { Prisma } from "../../../generated/prisma/client.js";
import { OrderStatus, PaymentStatus } from "../../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import { paginationMeta, type Pagination } from "../../utils/pagination.js";
import {
  assertStock,
  findVariant,
  jsonObject,
  withVariantStock,
  type InventoryProduct,
} from "../../utils/productInventory.js";
import serializable from "../../utils/serializable.js";
import { calculateCoupon } from "../coupon/coupon.service.js";
import { customFieldsSchema } from "../paymentMethod/paymentMethod.validation.js";
import type {
  AdminOrderQuery,
  CreateOrder,
  OrderStatusUpdate,
} from "./order.validation.js";

const detail = {
  items: true,
  paymentMethod: true,
  shippingZone: true,
} satisfies Prisma.OrderInclude;

function nextOrderNumber() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
  return `ORD-${date}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function verifyPayment(
  method: { name: string; customFieldsSchema: Prisma.JsonValue },
  paymentData: CreateOrder["paymentData"]
) {
  const fields = customFieldsSchema.safeParse(method.customFieldsSchema);
  if (!fields.success)
    throw new AppError(
      409,
      "This payment method has an invalid checkout configuration"
    );
  for (const field of fields.data) {
    if (!field.required) continue;
    const value = Object.hasOwn(paymentData, field.name)
      ? paymentData[field.name]
      : undefined;
    if (
      value == null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      (jsonObject(value) && Object.keys(value).length === 0)
    ) {
      throw new AppError(400, `${field.label} is required for ${method.name}`);
    }
  }
  return fields.data.length
    ? PaymentStatus.PENDING_VERIFICATION
    : PaymentStatus.UNPAID;
}

type StockState = {
  product: InventoryProduct;
  stock: number;
  variantStocks: Map<number, number>;
};

function stockStates(products: InventoryProduct[]) {
  return new Map<string, StockState>(
    products.map((product) => [
      product.id,
      { product, stock: product.stock, variantStocks: new Map() },
    ])
  );
}

async function saveStock(
  tx: Prisma.TransactionClient,
  states: Map<string, StockState>
) {
  for (const [id, { product, stock, variantStocks }] of states) {
    const variants = variantStocks.size
      ? withVariantStock(product.variants, variantStocks)
      : undefined;
    await tx.product.update({
      where: { id },
      data: { stock, ...(variants === undefined ? {} : { variants }) },
    });
  }
}

function reserveStock(
  states: Map<string, StockState>,
  items: CreateOrder["items"]
) {
  const lines = items.map((item) => {
    const state = states.get(item.productId);
    if (!state)
      throw new AppError(404, `Product ${item.productId} is unavailable`);
    return {
      item,
      state,
      variant: findVariant(state.product, item.selectedVariant),
    };
  });
  // Base-stock purchases reserve their units before variant purchases draw down shared stock.
  lines.sort(
    (left, right) =>
      Number(left.variant !== undefined) - Number(right.variant !== undefined)
  );
  return lines.map(
    ({
      item,
      state,
      variant,
    }): Prisma.OrderItemUncheckedCreateWithoutOrderInput => {
      const { product } = state;
      if (variant) {
        const stock = state.variantStocks.get(variant.index) ?? variant.stock;
        assertStock(product.title, item.quantity, stock);
        state.variantStocks.set(variant.index, stock - item.quantity);
      } else {
        assertStock(product.title, item.quantity, state.stock);
      }

      const productStock = Math.min(state.stock, item.quantity);
      state.stock -= productStock;
      const selection = variant
        ? { sku: variant.sku, attributes: variant.attributes }
        : item.selectedVariant;
      const selectedVariant = selection
        ? {
            ...selection,
            inventory: { variantSku: variant?.sku ?? null, productStock },
          }
        : Prisma.DbNull;

      return {
        productId: product.id,
        productTitle: product.title,
        quantity: item.quantity,
        unitPrice: variant?.price ?? product.discountPrice ?? product.basePrice,
        selectedVariant,
      };
    }
  );
}

export function create(userId: string | undefined, input: CreateOrder) {
  const { items, couponCode, ...checkout } = input;
  return serializable(async (tx) => {
    const paymentMethod = await tx.paymentMethod.findUnique({
      where: { id: checkout.paymentMethodId, isActive: true },
    });
    if (!paymentMethod) throw new AppError(404, "Payment method not available");
    const paymentStatus = verifyPayment(paymentMethod, checkout.paymentData);
    const shippingZone = await tx.shippingZone.findUnique({
      where: { id: checkout.shippingZoneId, isActive: true },
    });
    if (!shippingZone) throw new AppError(404, "Shipping zone not available");

    const products = await tx.product.findMany({
      where: {
        id: { in: items.map(({ productId }) => productId) },
        isActive: true,
      },
      orderBy: { id: "asc" },
    });
    const states = stockStates(products);
    const orderItems = reserveStock(states, items);
    const subtotal = orderItems.reduce(
      (sum, item) =>
        sum.plus(new Prisma.Decimal(item.unitPrice).times(item.quantity)),
      new Prisma.Decimal(0)
    );

    const promotion = couponCode
      ? calculateCoupon(
          await tx.coupon.findUnique({ where: { code: couponCode } }),
          subtotal
        )
      : undefined;
    const totalAmount = subtotal
      .minus(promotion?.discountAmount ?? 0)
      .plus(shippingZone.charge)
      .toNumber();
    const subTotal = subtotal.toNumber();
    if (!Number.isFinite(totalAmount) || !Number.isFinite(subTotal))
      throw new AppError(400, "Order total is too large");

    await saveStock(tx, states);
    if (promotion)
      await tx.coupon.update({
        where: { id: promotion.couponId },
        data: { usedCount: { increment: 1 } },
      });
    const order = await tx.order.create({
      data: {
        ...checkout,
        userId: userId ?? null,
        orderNumber: nextOrderNumber(),
        paymentStatus,
        subTotal,
        shippingCharge: shippingZone.charge,
        couponId: promotion?.couponId ?? null,
        discountAmount: promotion?.discountAmount ?? 0,
        totalAmount,
        items: { create: orderItems },
      },
      include: detail,
    });
    if (userId) await tx.cartItem.deleteMany({ where: { cart: { userId } } });
    return order;
  });
}

async function paginate(where: Prisma.OrderWhereInput, pagination: Pagination) {
  const { page, limit } = pagination;
  const [data, total] = await prisma.$transaction(
    [
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        omit: { paymentData: true },
        include: { _count: { select: { items: true } } },
      }),
      prisma.order.count({ where }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );
  return { data, meta: paginationMeta(pagination, total) };
}

export function history(userId: string, pagination: Pagination) {
  return paginate({ userId }, pagination);
}

export function listAdmin({
  page,
  limit,
  searchTerm,
  ...filters
}: AdminOrderQuery) {
  const where: Prisma.OrderWhereInput = { ...filters };
  if (searchTerm) {
    const match = {
      contains: searchTerm.replace(/[\\%_]/g, "\\$&"),
      mode: "insensitive" as const,
    };
    where.OR = [
      { orderNumber: match },
      { customerPhone: match },
      { customerName: match },
    ];
  }
  return paginate(where, { page, limit });
}

export async function track(orderNumber: string, customerPhone: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber, customerPhone },
    select: {
      orderNumber: true,
      orderStatus: true,
      paymentStatus: true,
      createdAt: true,
      updatedAt: true,
      subTotal: true,
      shippingCharge: true,
      discountAmount: true,
      totalAmount: true,
      items: {
        select: {
          id: true,
          productTitle: true,
          selectedVariant: true,
          quantity: true,
          unitPrice: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!order) throw new AppError(404, "Order not found");
  const items = order.items.map(({ selectedVariant, ...item }) => {
    const variant = jsonObject(selectedVariant) ? selectedVariant : null;
    const sku = typeof variant?.sku === "string" ? variant.sku : undefined;
    const attributes = jsonObject(variant?.attributes)
      ? Object.fromEntries(
          Object.entries(variant.attributes).filter(
            ([, value]) =>
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
          )
        )
      : undefined;
    return {
      ...item,
      selectedVariant:
        sku || attributes
          ? { ...(sku && { sku }), ...(attributes && { attributes }) }
          : null,
    };
  });
  return { ...order, items };
}

export async function get(id: string, userId: string, admin: boolean) {
  const order = await prisma.order.findUnique({
    where: admin ? { id } : { id, userId },
    include: detail,
  });
  if (!order) throw new AppError(404, "Order not found");
  return order;
}

async function restoreStock(
  tx: Prisma.TransactionClient,
  items: {
    productId: string;
    quantity: number;
    selectedVariant: Prisma.JsonValue;
  }[]
) {
  const products = await tx.product.findMany({
    where: { id: { in: items.map(({ productId }) => productId) } },
    orderBy: { id: "asc" },
  });
  const states = stockStates(products);
  for (const { productId, quantity, selectedVariant } of items) {
    const state = states.get(productId);
    if (!state)
      throw new AppError(409, "Unable to restore stock for a missing product");
    const inventory =
      jsonObject(selectedVariant) && jsonObject(selectedVariant.inventory)
        ? selectedVariant.inventory
        : undefined;
    const variant = inventory
      ? typeof inventory.variantSku === "string"
        ? findVariant(state.product, { sku: inventory.variantSku })
        : undefined
      : findVariant(state.product, selectedVariant);

    state.stock +=
      typeof inventory?.productStock === "number"
        ? inventory.productStock
        : quantity;
    if (variant) {
      const stock = state.variantStocks.get(variant.index) ?? variant.stock;
      state.variantStocks.set(variant.index, stock + quantity);
    }
  }
  await saveStock(tx, states);
}

export function updateStatus(id: string, data: OrderStatusUpdate) {
  if (data.orderStatus === undefined)
    return prisma.order.update({ where: { id }, data, include: detail });
  return serializable(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id },
      select: { orderStatus: true, items: true },
    });
    if (!current) throw new AppError(404, "Order not found");
    if (
      current.orderStatus === OrderStatus.CANCELLED &&
      data.orderStatus !== OrderStatus.CANCELLED
    ) {
      throw new AppError(409, "A cancelled order cannot be reopened");
    }
    if (
      data.orderStatus === OrderStatus.CANCELLED &&
      current.orderStatus !== OrderStatus.CANCELLED
    ) {
      await restoreStock(tx, current.items);
    }
    return tx.order.update({ where: { id }, data, include: detail });
  });
}

import { isDeepStrictEqual } from "node:util";
import { Prisma } from "../../../generated/prisma/client.js";
import AppError from "../../errors/AppError.js";
import {
  assertStock,
  findVariant,
  unitPrice,
  type InventoryProduct,
} from "../../utils/productInventory.js";
import serializable from "../../utils/serializable.js";
import type { CartItemInput } from "./cart.validation.js";

const include = {
  items: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          basePrice: true,
          discountPrice: true,
          stock: true,
          variants: true,
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

async function ensureCart(db: Prisma.TransactionClient, userId: string) {
  const cart = await db.cart.findUnique({ where: { userId } });
  return (
    cart ??
    db.cart.upsert({
      where: { userId },
      create: { userId },
      update: { userId },
    })
  );
}

async function readCart(db: Prisma.TransactionClient, userId: string) {
  const cart = await db.cart.findUniqueOrThrow({ where: { userId }, include });
  const subTotal = cart.items.reduce(
    (sum, item) =>
      sum.plus(
        new Prisma.Decimal(unitPrice(item.product, item.selectedVariant)).times(
          item.quantity
        )
      ),
    new Prisma.Decimal(0)
  );
  return { ...cart, subTotal: subTotal.toNumber() };
}

export function get(userId: string) {
  return serializable(async (tx) => {
    await ensureCart(tx, userId);
    return readCart(tx, userId);
  });
}

function checkCartStock(
  product: InventoryProduct,
  selection: Prisma.JsonValue,
  quantity: number,
  otherItems: { quantity: number; selectedVariant: Prisma.JsonValue }[]
) {
  const variant = findVariant(product, selection);
  const reserved = otherItems.reduce(
    (total, item) =>
      findVariant(product, item.selectedVariant)?.index === variant?.index
        ? total + item.quantity
        : total,
    0
  );
  assertStock(
    product.title,
    quantity + reserved,
    variant?.stock ?? product.stock
  );
}

export function add(
  userId: string,
  { productId, quantity, selectedVariant = null }: CartItemInput
) {
  return serializable(async (tx) => {
    const cart = await ensureCart(tx, userId);
    const product = await tx.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new AppError(404, "Product not found");
    const siblings = await tx.cartItem.findMany({
      where: { cartId: cart.id, productId },
    });
    const existing = siblings.find((item) =>
      isDeepStrictEqual(item.selectedVariant, selectedVariant)
    );
    checkCartStock(
      product,
      selectedVariant,
      quantity + (existing?.quantity ?? 0),
      siblings.filter((item) => item.id !== existing?.id)
    );

    if (existing)
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
      });
    else
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          selectedVariant: selectedVariant ?? Prisma.DbNull,
        },
      });
    return readCart(tx, userId);
  });
}

export function update(userId: string, itemId: string, quantity: number) {
  if (quantity <= 0) return remove(userId, itemId);
  return serializable(async (tx) => {
    const item = await tx.cartItem.findUnique({
      where: { id: itemId, cart: { userId } },
      include: { product: true },
    });
    if (!item) throw new AppError(404, "Cart item not found");
    if (!item.product.isActive)
      throw new AppError(409, "This product is no longer available");
    const siblings = await tx.cartItem.findMany({
      where: {
        cartId: item.cartId,
        productId: item.productId,
        id: { not: itemId },
      },
    });
    checkCartStock(item.product, item.selectedVariant, quantity, siblings);
    await tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return readCart(tx, userId);
  });
}

export function remove(userId: string, itemId: string) {
  return serializable(async (tx) => {
    const { count } = await tx.cartItem.deleteMany({
      where: { id: itemId, cart: { userId } },
    });
    if (!count) throw new AppError(404, "Cart item not found");
    return readCart(tx, userId);
  });
}

export function clear(userId: string) {
  return serializable(async (tx) => {
    const cart = await ensureCart(tx, userId);
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return readCart(tx, userId);
  });
}

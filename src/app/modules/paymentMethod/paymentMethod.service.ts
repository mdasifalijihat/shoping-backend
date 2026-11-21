import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import slugGenerator from "../../utils/slugGenerator.js";
import type {
  CreatePaymentMethod,
  UpdatePaymentMethod,
  PaymentMethodOrder,
} from "./paymentMethod.validation.js";

export function create(data: CreatePaymentMethod) {
  return prisma.paymentMethod.create({
    data: { ...data, slug: slugGenerator(data.name) },
  });
}

export function list(activeOnly: boolean) {
  return prisma.paymentMethod.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
  });
}

export function update(id: string, data: UpdatePaymentMethod) {
  return prisma.paymentMethod.update({ where: { id }, data });
}

export function reorder({ items }: PaymentMethodOrder) {
  return prisma.$transaction(
    items.map(({ id, orderIndex }) =>
      prisma.paymentMethod.update({ where: { id }, data: { orderIndex } })
    )
  );
}

export async function remove(id: string) {
  try {
    await prisma.paymentMethod.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new AppError(
        409,
        "This payment method is linked to orders. Deactivate it instead."
      );
    }
    throw error;
  }
}

import { prisma } from "../../config/prisma.js";
import type {
  CreateShippingZone,
  UpdateShippingZone,
  ShippingZoneOrder,
} from "./shippingZone.validation.js";

export function create(data: CreateShippingZone) {
  return prisma.shippingZone.create({ data });
}

export function list(activeOnly: boolean) {
  return prisma.shippingZone.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
  });
}

export function update(id: string, data: UpdateShippingZone) {
  return prisma.shippingZone.update({ where: { id }, data });
}

export function reorder({ items }: ShippingZoneOrder) {
  return prisma.$transaction(
    items.map(({ id, orderIndex }) =>
      prisma.shippingZone.update({ where: { id }, data: { orderIndex } })
    )
  );
}

export async function remove(id: string) {
  await prisma.shippingZone.delete({ where: { id } });
}

import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import type {
  CreateSection,
  SectionOrder,
  UpdateSection,
} from "./homepageSection.validation.js";

export function list(activeOnly: boolean) {
  return prisma.homepageSection.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
  });
}

export function create({ config, ...fields }: CreateSection) {
  const data =
    config === undefined
      ? fields
      : { ...fields, config: config ?? Prisma.JsonNull };
  return prisma.homepageSection.create({ data });
}

export function update(id: string, { config, ...fields }: UpdateSection) {
  const data =
    config === undefined
      ? fields
      : { ...fields, config: config ?? Prisma.JsonNull };
  return prisma.homepageSection.update({ where: { id }, data });
}

export function reorder({ items }: SectionOrder) {
  return prisma.$transaction(
    items.map(({ id, orderIndex }) =>
      prisma.homepageSection.update({ where: { id }, data: { orderIndex } })
    )
  );
}

export async function remove(id: string) {
  await prisma.homepageSection.delete({ where: { id } });
}

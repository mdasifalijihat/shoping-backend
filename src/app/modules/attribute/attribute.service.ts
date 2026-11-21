import { prisma } from "../../config/prisma.js";
import type {
  CreateAttribute,
  UpdateAttribute,
} from "./attribute.validation.js";

export function create(data: CreateAttribute) {
  return prisma.attribute.create({ data });
}

export function list() {
  return prisma.attribute.findMany({ orderBy: { name: "asc" } });
}

export function update(id: string, data: UpdateAttribute) {
  return prisma.attribute.update({ where: { id }, data });
}

export async function remove(id: string) {
  await prisma.attribute.delete({ where: { id } });
}

import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import slugGenerator from "../../utils/slugGenerator.js";
import type { CreatePage, UpdatePage } from "./customPage.validation.js";

export function create({ slug, ...fields }: CreatePage) {
  return prisma.customPage.create({
    data: { ...fields, slug: slug ?? slugGenerator(fields.title) },
  });
}

export function list() {
  return prisma.customPage.findMany({
    where: { isActive: true },
    select: { id: true, title: true, slug: true },
    orderBy: [{ title: "asc" }, { id: "asc" }],
  });
}

export function listAdmin() {
  return prisma.customPage.findMany({
    orderBy: [{ title: "asc" }, { id: "asc" }],
  });
}

export async function getBySlug(slug: string) {
  const page = await prisma.customPage.findUnique({
    where: { slug, isActive: true },
  });
  if (!page) throw new AppError(404, "Page not found");
  return page;
}

export function update(id: string, data: UpdatePage) {
  return prisma.customPage.update({ where: { id }, data });
}

export async function remove(id: string) {
  await prisma.customPage.delete({ where: { id } });
}

import { prisma } from "../../config/prisma.js";
import AppError from "../../errors/AppError.js";
import { Prisma } from "../../../generated/prisma/client.js";
import type { SettingValue } from "./siteSetting.validation.js";

const select = { key: true, value: true } as const;

export function upsert(key: string, value: SettingValue) {
  const json = value ?? Prisma.JsonNull;
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
    select,
  });
}

export async function list() {
  const settings = await prisma.siteSetting.findMany({
    select,
    orderBy: { key: "asc" },
  });
  return Object.fromEntries(settings.map(({ key, value }) => [key, value]));
}

export async function getByKey(key: string) {
  const setting = await prisma.siteSetting.findUnique({
    where: { key },
    select,
  });
  if (!setting) throw new AppError(404, "Site setting not found");
  return setting;
}

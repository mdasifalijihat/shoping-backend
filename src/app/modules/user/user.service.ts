import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { ProfileUpdate } from "./user.validation.js";

export const profileSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  phone: true,
  address: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export function getProfile(id: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id },
    select: profileSelect,
  });
}

export function updateProfile(id: string, data: ProfileUpdate) {
  return prisma.user.update({ where: { id }, data, select: profileSelect });
}

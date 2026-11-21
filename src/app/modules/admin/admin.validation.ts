import { z } from "zod";
import { Role } from "../../../generated/prisma/enums.js";
import { paginationSchema } from "../../utils/pagination.js";

const userIdSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

export const usersSchema = z.object({
  query: paginationSchema.extend({
    searchTerm: z.string().trim().exactOptional(),
    role: z.enum(Role).exactOptional(),
    isBlocked: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .exactOptional(),
  }),
});
export const roleSchema = userIdSchema.extend({
  body: z.strictObject({ role: z.enum(Role) }),
});
export const statusSchema = userIdSchema.extend({
  body: z.strictObject({ isBlocked: z.boolean().exactOptional() }).default({}),
});

export type UsersQuery = z.output<typeof usersSchema>["query"];
export type RoleUpdate = z.output<typeof roleSchema>["body"];
export type StatusUpdate = z.output<typeof statusSchema>["body"];

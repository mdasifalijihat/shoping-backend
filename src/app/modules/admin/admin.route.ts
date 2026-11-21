import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./admin.controller.js";
import { roleSchema, statusSchema, usersSchema } from "./admin.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.get("/dashboard-stats", adminOnly, controller.dashboardStats);
router.get(
  "/users",
  adminOnly,
  validateRequest(usersSchema),
  controller.listUsers
);
router.patch(
  "/users/:id/role",
  auth(Role.SUPER_ADMIN),
  validateRequest(roleSchema),
  controller.updateRole
);
router.patch(
  "/users/:id/status",
  adminOnly,
  validateRequest(statusSchema),
  controller.updateStatus
);

export default router;

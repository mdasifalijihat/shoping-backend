import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth, { optionalAuth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./order.controller.js";
import * as validation from "./order.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.post(
  "/",
  optionalAuth,
  validateRequest(validation.createSchema),
  controller.create
);
router.get(
  "/my-orders",
  auth(Role.CUSTOMER),
  validateRequest(validation.historySchema),
  controller.history
);
router.get(
  "/track/:orderNumber",
  validateRequest(validation.trackSchema),
  controller.track
);
router.get(
  "/admin",
  adminOnly,
  validateRequest(validation.adminListSchema),
  controller.listAdmin
);
router.get(
  "/:id",
  auth(),
  validateRequest(validation.byIdSchema),
  controller.get
);
router.patch(
  "/:id/status",
  adminOnly,
  validateRequest(validation.updateStatusSchema),
  controller.updateStatus
);

export default router;

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./coupon.controller.js";
import * as validation from "./coupon.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.post(
  "/",
  adminOnly,
  validateRequest(validation.createSchema),
  controller.create
);
router.get("/admin", adminOnly, controller.listAdmin);
router.post(
  "/apply",
  validateRequest(validation.applySchema),
  controller.apply
);
router.patch(
  "/:id",
  adminOnly,
  validateRequest(validation.updateSchema),
  controller.update
);
router.delete(
  "/:id",
  adminOnly,
  validateRequest(validation.byIdSchema),
  controller.remove
);

export default router;

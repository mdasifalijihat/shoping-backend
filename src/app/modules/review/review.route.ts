import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./review.controller.js";
import * as validation from "./review.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(validation.submitSchema),
  controller.submit
);
router.get(
  "/product/:productId",
  validateRequest(validation.listSchema),
  controller.list
);
router.patch(
  "/:id/approve",
  adminOnly,
  validateRequest(validation.approveSchema),
  controller.approve
);
router.delete(
  "/:id",
  auth(),
  validateRequest(validation.byIdSchema),
  controller.remove
);

export default router;

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./navbar.controller.js";
import * as validation from "./navbar.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.post(
  "/",
  adminOnly,
  validateRequest(validation.createSchema),
  controller.create
);
router.get("/", controller.list);
router.get("/admin", adminOnly, controller.listAdmin);
router.patch(
  "/reorder",
  adminOnly,
  validateRequest(validation.reorderSchema),
  controller.reorder
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

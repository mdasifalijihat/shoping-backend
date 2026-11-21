import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./category.controller.js";
import * as validation from "./category.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.post(
  "/",
  adminOnly,
  validateRequest(validation.createSchema),
  controller.create
);
router.get("/", validateRequest(validation.listSchema), controller.list);
router.get("/admin", adminOnly, controller.listAdmin);
router.get(
  "/:slug",
  validateRequest(validation.bySlugSchema),
  controller.getBySlug
);
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

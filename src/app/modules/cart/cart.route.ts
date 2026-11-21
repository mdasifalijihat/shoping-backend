import { Router } from "express";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./cart.controller.js";
import * as validation from "./cart.validation.js";

const router = Router();

router.get("/", auth(), controller.get);
router.post(
  "/items",
  auth(),
  validateRequest(validation.addSchema),
  controller.add
);
router.patch(
  "/items/:itemId",
  auth(),
  validateRequest(validation.updateSchema),
  controller.update
);
router.delete(
  "/items/:itemId",
  auth(),
  validateRequest(validation.byItemSchema),
  controller.remove
);
router.delete("/", auth(), controller.clear);

export default router;

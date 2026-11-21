import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./siteSetting.controller.js";
import * as validation from "./siteSetting.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.put(
  "/:key",
  adminOnly,
  validateRequest(validation.upsertSchema),
  controller.upsert
);
router.get("/", controller.list);
router.get(
  "/:key",
  validateRequest(validation.byKeySchema),
  controller.getByKey
);

export default router;

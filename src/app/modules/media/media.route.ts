import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import auth from "../../middlewares/auth.js";
import { uploadMultiple, uploadSingle } from "../../middlewares/upload.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./media.controller.js";
import { deleteSchema } from "./media.validation.js";

const router = Router();
const adminOnly = auth(Role.ADMIN, Role.SUPER_ADMIN);

router.post("/upload-single", uploadSingle, controller.uploadSingle);
router.post(
  "/upload-multiple",
  adminOnly,
  uploadMultiple,
  controller.uploadMultiple
);
router.delete(
  "/delete",
  adminOnly,
  validateRequest(deleteSchema),
  controller.remove
);

export default router;

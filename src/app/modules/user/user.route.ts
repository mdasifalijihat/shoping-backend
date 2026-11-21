import { Router } from "express";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./user.controller.js";
import { updateProfileSchema } from "./user.validation.js";

const router = Router();

router.get("/me", auth(), controller.getProfile);
router.patch(
  "/me",
  auth(),
  validateRequest(updateProfileSchema),
  controller.updateProfile
);

export default router;

import type { Request } from "express";
import { requireUser } from "../../middlewares/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./user.service.js";
import type { ProfileUpdate } from "./user.validation.js";

export const getProfile = catchAsync(async (req, res) => {
  const data = await service.getProfile(requireUser(req).id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Profile retrieved",
    data,
  });
});

export const updateProfile = catchAsync<Request["params"], ProfileUpdate>(
  async (req, res) => {
    const data = await service.updateProfile(requireUser(req).id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Profile updated",
      data,
    });
  }
);

import type { Request } from "express";
import AppError from "../../errors/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./media.service.js";
import type { DeleteImage } from "./media.validation.js";

export const uploadSingle = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError(400, "Image file is required");
  const data = await service.uploadImage(req.file.buffer);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Image uploaded",
    data,
  });
});

export const uploadMultiple = catchAsync(async (req, res) => {
  if (!Array.isArray(req.files) || !req.files.length)
    throw new AppError(400, "Image files are required");
  const data = await service.uploadImages(req.files.map((file) => file.buffer));
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Images uploaded",
    data,
  });
});

export const remove = catchAsync<Request["params"], DeleteImage>(
  async (req, res) => {
    await service.deleteImage(req.body.publicId);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Image deleted",
      data: null,
    });
  }
);

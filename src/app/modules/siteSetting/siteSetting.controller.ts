import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./siteSetting.service.js";
import type { SettingValue } from "./siteSetting.validation.js";

export const upsert = catchAsync<{ key: string }, { value: SettingValue }>(
  async (req, res) => {
    const data = await service.upsert(req.params.key, req.body.value);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Site setting saved",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Site settings retrieved",
    data,
  });
});

export const getByKey = catchAsync<{ key: string }>(async (req, res) => {
  const data = await service.getByKey(req.params.key);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Site setting retrieved",
    data,
  });
});

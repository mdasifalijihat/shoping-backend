import type { Request } from "express";
import { isAdmin, requireUser } from "../../middlewares/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import type { Pagination } from "../../utils/pagination.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./review.service.js";
import type { SubmitReview } from "./review.validation.js";

export const submit = catchAsync<Request["params"], SubmitReview>(
  async (req, res) => {
    const data = await service.submit(requireUser(req).id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Review submitted",
      data,
    });
  }
);
export const list = catchAsync<{ productId: string }, unknown, Pagination>(
  async (req, res) => {
    const { data, meta } = await service.list(req.params.productId, req.query);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Reviews retrieved",
      data,
      meta,
    });
  }
);
export const approve = catchAsync<{ id: string }, { isApproved?: boolean }>(
  async (req, res) => {
    const data = await service.approve(req.params.id, req.body.isApproved);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Review approval updated",
      data,
    });
  }
);
export const remove = catchAsync<{ id: string }>(async (req, res) => {
  const user = requireUser(req);
  await service.remove(req.params.id, user.id, isAdmin(user.role));
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review deleted",
    data: null,
  });
});

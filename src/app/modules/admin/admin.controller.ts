import type { Request } from "express";
import { requireUser } from "../../middlewares/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./admin.service.js";
import type {
  RoleUpdate,
  StatusUpdate,
  UsersQuery,
} from "./admin.validation.js";

export const dashboardStats = catchAsync(async (_req, res) => {
  const data = await service.dashboardStats();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Dashboard stats retrieved",
    data,
  });
});

export const listUsers = catchAsync<Request["params"], unknown, UsersQuery>(
  async (req, res) => {
    const { data, meta } = await service.listUsers(req.query);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Users retrieved",
      data,
      meta,
    });
  }
);

export const updateRole = catchAsync<{ id: string }, RoleUpdate>(
  async (req, res) => {
    const data = await service.updateRole(
      requireUser(req).id,
      req.params.id,
      req.body.role
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User role updated",
      data,
    });
  }
);

export const updateStatus = catchAsync<{ id: string }, StatusUpdate>(
  async (req, res) => {
    const data = await service.updateStatus(
      requireUser(req).id,
      req.params.id,
      req.body.isBlocked
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User status updated",
      data,
    });
  }
);

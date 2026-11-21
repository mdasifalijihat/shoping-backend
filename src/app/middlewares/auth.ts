import type { Request } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { Role } from "../../generated/prisma/enums.js";
import { auth as betterAuth } from "../config/auth.js";
import AppError from "../errors/AppError.js";
import catchAsync from "../utils/catchAsync.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express exposes this interface for request augmentation.
  namespace Express {
    interface Request {
      user?: typeof betterAuth.$Infer.Session.user;
    }
  }
}

export function requireUser(req: { user?: Express.Request["user"] }) {
  if (!req.user) throw new AppError(401, "Authentication required");
  return req.user;
}

export function isAdmin(role: Role) {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

function sessionMiddleware(optional: boolean, requiredRoles: Role[]) {
  return catchAsync<Request["params"], unknown, unknown>(
    async (req, _res, next) => {
      const session = await betterAuth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (!session) {
        if (!optional) throw new AppError(401, "Authentication required");
        next();
        return;
      }
      if (session.user.isBlocked)
        throw new AppError(403, "This account is blocked");
      if (requiredRoles.length && !requiredRoles.includes(session.user.role)) {
        throw new AppError(403, "Insufficient permissions");
      }
      req.user = session.user;
      next();
    }
  );
}

export const optionalAuth = sessionMiddleware(true, []);

export default function auth(...requiredRoles: Role[]) {
  return sessionMiddleware(false, requiredRoles);
}

import "dotenv/config";
import { z } from "zod";

const httpUrl = z.url({ protocol: /^https?$/ });

export const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: httpUrl,
    FRONTEND_URL: httpUrl.transform((url) => new URL(url).origin),
    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
  })
  .parse({
    ...process.env,
    FRONTEND_URL:
      process.env.FRONTEND_URL ??
      process.env.CORS_ORIGIN ??
      "http://localhost:3000",
  });

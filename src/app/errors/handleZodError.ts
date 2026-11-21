import type { ZodError } from "zod";

export default function handleZodError(error: ZodError) {
  return {
    statusCode: 400,
    message: "Request validation failed",
    errors: error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}

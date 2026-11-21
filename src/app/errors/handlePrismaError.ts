import { Prisma } from "../../generated/prisma/client.js";

export default function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, message: "Invalid database input" };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { statusCode: 503, message: "Database unavailable" };
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return undefined;
  }

  switch (error.code) {
    case "P2002":
      return {
        statusCode: 409,
        message: "A record with that value already exists",
      };
    case "P2003":
      return {
        statusCode: 409,
        message: "The operation conflicts with a related record",
      };
    case "P2025":
      return { statusCode: 404, message: "Record not found" };
    case "P2024":
      return { statusCode: 503, message: "Database unavailable" };
    default:
      return undefined;
  }
}

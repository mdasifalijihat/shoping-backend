import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import AppError from "../errors/AppError.js";

export default async function serializable<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034"
      )
        throw error;
      if (attempt === 2)
        throw new AppError(
          409,
          "Data changed concurrently. Retry the request."
        );
    }
  }
}

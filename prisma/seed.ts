import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { prisma } from "../src/app/config/prisma.js";
import { Prisma } from "../src/generated/prisma/client.js";
import { Role } from "../src/generated/prisma/enums.js";

async function seed() {
  const superAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
    select: { id: true },
  });
  if (superAdmin) return;

  const {
    SUPER_ADMIN_EMAIL: email,
    SUPER_ADMIN_PASSWORD: password,
    SUPER_ADMIN_NAME: name,
  } = z
    .object({
      SUPER_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
      SUPER_ADMIN_PASSWORD: z.string().min(8).max(128),
      SUPER_ADMIN_NAME: z.string().trim().min(1).default("Super Admin"),
    })
    .parse(process.env);

  const hashedPassword = await hashPassword(password);

  try {
    await prisma.$transaction(
      async (tx) => {
        const existingAdmin = await tx.user.findFirst({
          where: { role: Role.SUPER_ADMIN },
          select: { id: true },
        });
        if (existingAdmin) return;

        const user = await tx.user.create({
          data: { name, email, role: Role.SUPER_ADMIN },
          select: { id: true },
        });
        await tx.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" || error.code === "P2034") {
        const existingAdmin = await prisma.user.findFirst({
          where: { role: Role.SUPER_ADMIN },
          select: { id: true },
        });
        if (existingAdmin) return;
      }
      if (error.code === "P2002") {
        throw new Error(
          "SUPER_ADMIN_EMAIL already belongs to an existing user",
          { cause: error }
        );
      }
    }
    throw error;
  }
}

try {
  await seed();
  console.log("Super admin account is ready");
} catch (error) {
  console.error("Super admin seed failed", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

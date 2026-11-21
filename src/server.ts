import app from "./app.js";
import { env } from "./app/config/index.js";
import { prisma } from "./app/config/prisma.js";

try {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });

  server.once("error", (error) => {
    console.error("HTTP server failed", error);
    process.exitCode = 1;
    void prisma.$disconnect().catch(console.error);
  });

  function shutdown() {
    server.close((error) => {
      if (error) {
        console.error("HTTP shutdown failed", error);
        process.exitCode = 1;
      }
      void prisma.$disconnect().catch((disconnectError: unknown) => {
        console.error("Database disconnect failed", disconnectError);
        process.exitCode = 1;
      });
    });
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch (error) {
  console.error("Failed to start server", error);
  process.exitCode = 1;
  await prisma.$disconnect().catch(console.error);
}

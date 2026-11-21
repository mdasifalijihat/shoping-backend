import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    // Database connection (e.g., await connectDB())
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

bootstrap();

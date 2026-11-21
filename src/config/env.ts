import "dotenv/config";

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  PORT: Number(getEnvVar("PORT", "5000")),
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  CORS_ORIGIN: getEnvVar("CORS_ORIGIN", "http://localhost:3000"),
  JWT_SECRET: getEnvVar("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnvVar("JWT_EXPIRES_IN", "7d"),
};

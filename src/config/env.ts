import { load } from "ts-dotenv";

const env = load({
  ENVIRONMENT: ["development", "production", "test"],
  SOCKET_PORT: Number,
  APP_HOST: String,
  HTTP_PORT: String,
  AUTH_MS_HOST: String,
  AUTH_MS_PORT: String,
  DATABASE_USER: String,
  DATABASE_PASSWORD: String,
  DATABASE_HOST: String,
  DATABASE_PORT: Number,
  DATABASE_NAME: String,
  GOOGLE_CLIENT_ID: String,
  GOOGLE_CLIENT_SECRET: String,
  API_PREFIX: String,
  API_VERSION: String,
  API_HOST: String,
  LOGS_PATH: String,
  COOKIE_SECRET: String,
});

export default env;

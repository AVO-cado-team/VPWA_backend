import type { FastifyCorsOptions } from "@fastify/cors";
// import env from "#config/env.js";

export const corsOptions: FastifyCorsOptions = {
  origin: [
    "http://localhost:9000",
    "http://localhost:9001",
    "http://10.62.45.180:9000",
  ],
  methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
  credentials: true,
  preflight: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Credentials",
  ],
  exposedHeaders: "Authorization",
  optionsSuccessStatus: 204,
  preflightContinue: false,
  strictPreflight: false,
  hideOptionsRoute: false,
};

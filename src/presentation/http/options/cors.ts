import type { FastifyCorsOptions } from "@fastify/cors";
// import env from "#config/env.js";

export const corsOptions: FastifyCorsOptions = {
  origin: "*",
  methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
  // allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: "Authorization",
  optionsSuccessStatus: 204,
  preflightContinue: false,
  // hideOptionsRoute: false,
  // strictPreflight: true,
};

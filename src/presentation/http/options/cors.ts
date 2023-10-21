import type { FastifyCorsOptions } from "@fastify/cors";
// import env from "#config/env.js";

export const corsOptions: FastifyCorsOptions = {
  origin: "*",
  methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  hideOptionsRoute: false,
  strictPreflight: true,
};

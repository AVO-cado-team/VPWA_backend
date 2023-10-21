import type { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import env from "#config/env.js";

const openapi: Partial<OpenAPIV3.Document | OpenAPIV3_1.Document> = {
  openapi: "3.1.0",
  info: {
    title: "GrabTheWord API",
    version: "1.0.0",
    description:
      "API to create, store, retrieve and update word-cards you want to learn",
  },
  servers: [
    {
      url: env.API_HOST,
      description: "Remote server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  tags: [
    { name: "auth", description: "Sign In/Up/Out" },
    { name: "dictionary", description: "Words" },
  ],
};

export const fastifySwaggerOptions: FastifyDynamicSwaggerOptions = {
  mode: "dynamic",
  openapi,
  refResolver: {
    buildLocalReference(json) {
      return String(json.title);
    },
  },
};

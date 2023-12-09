import { gracefulShutdownHandler } from "./utils/utils.js";
import type { ProcessMessage } from "./utils/types.js";
import { ProcessMessagesType } from "./utils/types.js";
import underPressure from "@fastify/under-pressure";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyUserAgent from "fastify-user-agent";
import fastifyAutoload from "@fastify/autoload";
import fastifySwagger from "@fastify/swagger";
import { log } from "#infrastructure/log.js";
import rateLimit from "@fastify/rate-limit";
import fastifyCookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import oauth2 from "@fastify/oauth2";
import process from "node:process";
import { fastify } from "fastify";
import env from "#config/env.js";
import cors from "@fastify/cors";

import errorHandler from "./plugins/errorHandler.js";
import authPlugin from "./plugins/auth.js";

import { oAuth2Options } from "./options/oauth2.js";
import { corsOptions } from "./options/cors.js";
import { fastifySwaggerOptions } from "./options/swagger.js";
import { cookieOptions } from "./options/cookies.js";
import { fastifyOptions } from "./options/fasify.js";
import { autoloadOptions } from "./options/autoload.js";
import { rateLimitOptions } from "./options/rateLimit.js";
import { underPressureOptions } from "./options/underPressure.js";

const server = fastify(fastifyOptions);

try {
  server.setErrorHandler(errorHandler);
  await server.register(fastifyCookie, cookieOptions);
  await server.register(cors, corsOptions);
  await server.register(underPressure, underPressureOptions);
  await server.register(rateLimit, rateLimitOptions);
  await server.register(fastifySwagger, fastifySwaggerOptions);
  // await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(fastifySwaggerUi, { routePrefix: "/docs" });
  await server.register(oauth2, oAuth2Options);
  await server.register(fastifyUserAgent);
  await server.register(fastifyAutoload, autoloadOptions);
  await server.register(authPlugin);
  await server.ready();

  server.swagger({ yaml: true });
} catch (error) {
  log.error(error);
  process.exit(1);
}
log.system(
  `HTTP server started: ${await server.listen({
    port: Number(env.HTTP_PORT),
    host: env.APP_HOST,
  })}`,
);
log.info({}, server.printRoutes());

process.on(
  "uncaughtException",
  async (error: NodeJS.ErrnoException, origin) => {
    if (
      error.code === "ECONNRESET" ||
      error.code === "ERR_SSL_APPLICATION_DATA_AFTER_CLOSE_NOTIFY" ||
      error.code === "ERR_SSL_TLSV1_ALERT_DECODE_ERROR"
    )
      return;

    log.system(error, origin);
    await gracefulShutdownHandler(server, "uncaughtException");
  },
);

process.on("message", async (message: ProcessMessage) => {
  if (message.status === ProcessMessagesType.FORCE_GRACEFUL_SHUTDOWN) {
    await gracefulShutdownHandler(server, "Forced shutdown");
  }
});

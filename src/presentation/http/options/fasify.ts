import type { ConnectionError, FastifyInstance } from "fastify";
import { fileURLToPath } from "node:url";
import env from "#config/env.js";
import path from "node:path";
import type { Socket } from "net";
import fs from "node:fs";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devTargets = [
  {
    level: "trace",
    target: "pino-pretty",
    options: { colorize: true, ignore: "pid,hostname" },
  },
];

const prodTargets = [
  {
    level: "debug",
    target: "pino/file",
    options: {
      ignore: "pid,hostname",
      destination: `${env.LOGS_PATH}/fastify-debug.log`,
    },
  },
];

const fastifyBaseOptions = {
  logger: {
    transport: {
      targets: [...devTargets],
    },
  },
  ajv: {
    customOptions: {
      removeAdditional: true,
      useDefaults: false,
      coerceTypes: false,
      allErrors: false,
    },
  },
};

export const fastifyOptions = {
  ...fastifyBaseOptions,
  ...(env.ENVIRONMENT === "production"
    ? {
        http2: true,
        https: {
          key: fs.readFileSync(path.join(__dirname, "../../../../key.pem")),
          cert: fs.readFileSync(path.join(__dirname, "../../../../cert.pem")),
          // ca: fs.readFileSync(path.join(__dirname, "../../../ssl.ca")),
        },
        clientErrorHandler: function clientErrorHandler(
          err: ConnectionError,
          socket: Socket,
        ) {
          if (
            err.code === "ECONNRESET" ||
            err.code === "ERR_SSL_NO_SUITABLE_SIGNATURE_ALGORITHM"
          ) {
            return;
          }

          const body = JSON.stringify({
            error: http.STATUS_CODES["400"],
            message: "Client Error",
            statusCode: 400,
          });
          (this as any as FastifyInstance).log.info(err);

          if (socket.writable) {
            socket.end(
              [
                "HTTP/1.1 400 Bad Request",
                `Content-Length: ${body.length}`,
                `Content-Type: application/json\r\n\r\n${body}`,
              ].join("\r\n"),
            );
          }
        },
      }
    : {}),
};

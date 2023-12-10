import pinoPretty from "pino-pretty";
import env from "#config/env.js";
import pino from "pino";

const devTargets = [
  {
    level: "trace",
    target: "pino-pretty",
    options: {
      ignore: "pid,hostname",
      colorize: true,
    },
  },
];

const prodTargets = [
  {
    level: "debug",
    target: "pino/file",
    options: {
      ignore: "pid,hostname",
      destination: `${env.LOGS_PATH}/server-debug.log`,
    },
  },
  {
    level: "error",
    target: "pino/file",
    options: {
      ignore: "pid,hostname",
      destination: `${env.LOGS_PATH}/server-error.log`,
    },
  },
  {
    level: "error",
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "hostname",
    },
  },
];

export const log = pino.pino({
  customLevels: {
    system: 100,
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  },
  level: "debug",
  prettifier: pinoPretty,
  transport: {
    targets: devTargets,
  },
});

import type { CookieSerializeOptions } from "@fastify/cookie";
import type { ProcessMessage } from "./types.js";
import { ProcessMessagesType } from "./types.js";
import type { FastifyInstance } from "fastify";
import { log } from "#infrastructure/log.js";
import timers from "node:timers/promises";
import process from "node:process";
import env from "#config/env.js";

// TODO: comsider moving to a dtos
export const enum MessageType {
  Auth = "auth",
  AuthResponse = "auth-response",
  GoogleAuthStart = "google-auth-start",
}

export const refreshTokenCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 2,
  path: `/${env.API_PREFIX}/${env.API_VERSION}/auth`,
  // secure: env.ENVIRONMENT === "production",
  secure: env.ENVIRONMENT === "production",
  // domain: "10.62.29.242",
  sameSite: env.ENVIRONMENT === "production" ? "none" : "lax",
};

export const REFRESH_TOKEN = "refreshToken";

const filterNonEnglishCharacters = (string_: string): string =>
  string_.replaceAll(/[^\u0000-\u007F]/g, "");
// Remove all non word characters and convert to lower case, remove all non English characters
export const sanitizeString = (string_: string): string =>
  filterNonEnglishCharacters(string_).replaceAll(/\W/g, "").toLowerCase();

type DateToStrDeep<T> = T extends Date
  ? string
  : T extends object
  ? { [K in keyof T]: DateToStrDeep<T[K]> }
  : T;

export const dateToStrDeepFunc = <T>(input: T): DateToStrDeep<T> => {
  if (input instanceof Date) {
    return input.toISOString() as DateToStrDeep<T>;
  } else if (typeof input === "object") {
    if (input === null) return null as DateToStrDeep<T>;
    const result = {} as any;
    for (const key in input) {
      result[key] = dateToStrDeepFunc(input[key]);
    }
    return result;
  } else {
    return input as DateToStrDeep<T>;
  }
};

export const gracefulShutdownHandler = async (
  server: FastifyInstance,
  reason: string,
) => {
  log.system(`Graceful shutdown: ${reason}`);
  log.info("Wait 5 seconds before closing server");
  const serverCloneWaitTime = 5000;
  await timers.setTimeout(serverCloneWaitTime);
  // TODO: think about resources that are not closed

  try {
    if (process.send) {
      const message: ProcessMessage = { status: ProcessMessagesType.EXITING };
      process.send(message);
    } else {
      throw new Error("Process is not a child process");
    }

    await server.close();
    log.system("Close server, exit process successfully");
    process.exit(0);
  } catch (error: any) {
    log.fatal(error, "Close server, exit process with error");
    process.exit(1);
  }
};

export class UserNotAuthenticatedError extends Error {
  userNotAuthenticatedError = true as const;
  constructor() {
    super("User is not authenticated in this request");
  }
}

import type { FastifyCookieOptions } from "@fastify/cookie";
import env from "#config/env.js";

export const cookieOptions: FastifyCookieOptions = {
  secret: env.COOKIE_SECRET,
  hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
};

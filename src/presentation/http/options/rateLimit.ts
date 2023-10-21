import type { RateLimitOptions } from "@fastify/rate-limit";

export const rateLimitOptions: RateLimitOptions = {
  max: 100, // default 1000
  ban: 10, // default null
  timeWindow: 1000 * 60, // default 1000 * 60
};

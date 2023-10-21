import type { UnderPressureOptions } from "@fastify/under-pressure";
import { log } from "#infrastructure/log.js";

export const underPressureOptions: UnderPressureOptions = {
  maxEventLoopDelay: 1000,
  maxEventLoopUtilization: 0.98,
  // maxHeapUsedBytes: 100000000,
  // maxRssBytes: 100000000,
  message: "Under pressure!",
  retryAfter: 50,
  healthCheck: async () => true,
  healthCheckInterval: 30 * 1000,
  pressureHandler: async (request, reply, type, value) => {
    log.system("Under pressure", type, value);
  },
  sampleInterval: 0,
  exposeStatusRoute: "/status",
};

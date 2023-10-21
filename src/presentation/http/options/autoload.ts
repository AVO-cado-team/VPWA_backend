import type { AutoloadPluginOptions } from "@fastify/autoload";
import { fileURLToPath } from "node:url";
import env from "#config/env.js";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const autoloadOptions: AutoloadPluginOptions = {
  dir: path.join(__dirname, "../routes"),
  forceESM: true,
  options: { prefix: `/${env.API_PREFIX}/${env.API_VERSION}/` },
};

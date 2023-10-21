import type { AccessTokenPayloadDTO } from "#application/dtos.js";
import type { OAuth2Namespace } from "@fastify/oauth2";
import type { Agent } from "useragent";

declare module "fastify" {
  interface FastifyRequest {
    user?: AccessTokenPayloadDTO | undefined;
  }
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    userAgent: Agent | undefined;
  }
  interface FastifyHandler {
    (request: FastifyRequest, reply: FastifyReply): Promise<any>;
  }
}

export const enum ProcessMessagesType {
  EXITING = "EXITING",
  FORCE_GRACEFUL_SHUTDOWN = "FORCE_GRACEFUL_SHUTDOWN",
}

export type ProcessMessage = {
  status: ProcessMessagesType;
};

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {}

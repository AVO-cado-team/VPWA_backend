import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  ChatActionNotPermitted,
  ChatNotFoundError,
} from "#domain/model/chat.js";
import { UserNotFoundError } from "#domain/model/user.js";
import { MESSAGE_TYPE } from "#domain/model/message.js";
import { StatusCodes as SC } from "http-status-codes";
import type { UserId } from "#domain/model/user.js";
import type { ChatId } from "#domain/model/chat.js";
import application from "#presentation/context.js";
import type { FastifyPluginAsync } from "fastify";
import schema from "./schema.js";
import { create } from "ts-opaque";

const messageRoutes: FastifyPluginAsync = async (fastify) => {
  const fastifyT = fastify.withTypeProvider<TypeBoxTypeProvider>();
  fastifyT.addHook("onRequest", async (request, reply) => {
    await fastifyT.authenticate(request, reply);
  });
  fastifyT.post("/", { schema: schema.sendMessage }, async (request, reply) => {
    if (!request.user) throw new Error("User is not authenticated");
    const { text, chatId } = request.body;
    const result = await application.sendMessage(
      create<UserId>(request.user.id),
      create<ChatId>(chatId),
      text,
      MESSAGE_TYPE.TEXT,
    );

    if (result.isErr()) {
      if (result.error instanceof ChatNotFoundError) {
        return await reply.status(SC.NOT_FOUND).send({
          message: result.error.message,
        });
      } else if (result.error instanceof UserNotFoundError) {
        return await reply.status(SC.NOT_FOUND).send({
          message: result.error.message,
        });
      } else if (result.error instanceof ChatActionNotPermitted) {
        return await reply.status(SC.FORBIDDEN).send({
          message: result.error.message,
        });
      }
      return await reply
        .status(SC.INTERNAL_SERVER_ERROR)
        .send({ message: "Internal server error" });
    }

    return await reply.status(SC.OK).send({
      ...result.value,
      date: result.value.date.toISOString(),
    });
  });
};

export default messageRoutes;

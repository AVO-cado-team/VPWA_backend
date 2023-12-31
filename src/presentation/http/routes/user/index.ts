import type { UserId } from "#domain/model/user.js";
import {
  UsernameAlreadyExistsError,
  UserNotFoundError,
} from "#domain/model/user.js";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { StatusCodes as SC } from "http-status-codes";
import application from "#presentation/context.js";
import type { FastifyPluginAsync } from "fastify";
import { create } from "ts-opaque";
import schema from "./schema.js";
import { log } from "#infrastructure/log.js";

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const fastifyT = fastify.withTypeProvider<TypeBoxTypeProvider>();
  fastifyT.addHook("onRequest", async (request, reply) => {
    await fastifyT.authenticate(request, reply);
  });

  fastifyT.patch(
    "/username",
    { schema: schema.updateUsername },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const newUsername = request.body.username;
      const result = await application.updateUsername(
        create<UserId>(request.user.id),
        newUsername,
      );
      if (result.isErr()) {
        if (result instanceof UsernameAlreadyExistsError) {
          return reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else {
          return reply
            .code(SC.INTERNAL_SERVER_ERROR)
            .send({ message: result.error.message });
        }
      }

      return reply.code(SC.OK).send({ message: "Username updated" });
    },
  );
  fastifyT.get(
    "/chats",
    { schema: schema.getChats },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { limit, offset } = request.query;
      const result = await application.getAllChats(
        create<UserId>(request.user.id),
        Number(limit),
        Number(offset),
      );
      // TODO: check if all errors handled
      if (result.isErr()) {
        return await reply
          .code(SC.INTERNAL_SERVER_ERROR)
          .send({ message: result.error.message });
      }

      return await reply.code(SC.OK).send(
        result.value.map((chat) => ({
          ...chat,
          messages: chat.messages.map((message) => ({
            ...message,
            date: message.date.toISOString(),
          })),
        })),
      );
    },
  );

  fastifyT.get(
    "/:userId",
    { schema: schema.getUserById },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { userId } = request.params;
      const result = await application.getUserById(create<UserId>(userId));
      if (result.isErr()) {
        if (result.error instanceof UserNotFoundError) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        }
        log.error(result.error);
        return await reply
          .code(SC.INTERNAL_SERVER_ERROR)
          .send({ message: "Internal server error" });
      }

      return await reply.code(SC.OK).send(result.value);
    },
  );
};

export default userRoutes;

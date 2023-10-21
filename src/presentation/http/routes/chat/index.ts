import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { UserNotFoundError } from "#domain/model/user.js";
import { StatusCodes as SC } from "http-status-codes";
import type { UserId } from "#domain/model/user.js";
import type { ChatId } from "#domain/model/chat.js";
import application from "#presentation/context.js";
import type { FastifyPluginAsync } from "fastify";
import schema from "./schema.js";
import { create } from "ts-opaque";
import {
  ChatActionNotPermitted,
  ChatNameAlreadyExistsError,
  ChatNotFoundError,
} from "#domain/model/chat.js";
import { InviteNotFoundError } from "#domain/model/invite.js";

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  const fastifyT = fastify.withTypeProvider<TypeBoxTypeProvider>();
  fastifyT.addHook("onRequest", async (request, reply) => {
    await fastifyT.authenticate(request, reply);
  });
  fastifyT.post("/", { schema: schema.createChat }, async (request, reply) => {
    if (!request.user) throw new Error("User is not authenticated");
    const { chatname, isPrivate, title } = request.body;
    const result = await application.createChat(
      create<UserId>(request.user.id),
      chatname,
      isPrivate,
      title,
    );

    if (result.isErr()) {
      if (result.error instanceof ChatNameAlreadyExistsError) {
        return reply
          .code(SC.BAD_REQUEST)
          .send({ message: result.error.message });
      } else if (result.error instanceof UserNotFoundError) {
        throw new Error(
          "User not found in request in createChat endpoint while endpoint must be protected by authentication",
        );
      } else {
        throw new Error("Unknown error in createChat endpoint");
      }
    }

    const chat = result.value;
    return reply.code(SC.OK).send({ chat });
  });
  fastifyT.delete(
    "/id",
    { schema: schema.deleteChatById },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { id } = request.body;
      const result = await application.deleteChatById(
        create<UserId>(request.user.id),
        create<ChatId>(id),
      );

      if (result.isErr()) {
        if (
          result.error instanceof ChatNotFoundError ||
          result.error instanceof UserNotFoundError
        ) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof ChatActionNotPermitted) {
          return await reply
            .code(SC.FORBIDDEN)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error in deleteChatById endpoint");
        }
      }

      return await reply.code(SC.OK).send({ message: "Chat deleted" });
    },
  );
  fastifyT.patch(
    "/invite/username",
    { schema: schema.inviteUserByUsername },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { chatId, username } = request.body;
      const result = await application.inviteUserByUsername(
        create<UserId>(request.user.id),
        create<ChatId>(chatId),
        username,
      );

      if (result.isErr()) {
        if (
          result.error instanceof ChatNotFoundError ||
          result.error instanceof UserNotFoundError
        ) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof ChatActionNotPermitted) {
          return await reply
            .code(SC.FORBIDDEN)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error in inviteUserByUsername endpoint");
        }
      }

      return await reply.code(SC.OK).send({ message: "User invited" });
    },
  );
  fastifyT.patch(
    "/invite/id",
    { schema: schema.inviteUserById },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { chatId, userId } = request.body;
      const result = await application.inviteUserById(
        // TODO: consider making request.user.id of type UserId instead of string
        create<UserId>(request.user.id),
        create<ChatId>(chatId),
        create<UserId>(userId),
      );

      if (result.isErr()) {
        if (
          result.error instanceof ChatNotFoundError ||
          result.error instanceof UserNotFoundError
        ) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof ChatActionNotPermitted) {
          return await reply
            .code(SC.FORBIDDEN)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error in inviteUserById endpoint");
        }
      }

      return await reply.code(SC.OK).send({ message: "User invited" });
    },
  );
  fastifyT.patch(
    "/invite/accept",
    { schema: schema.acceptInvite },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { chatId } = request.body;
      const result = await application.acceptInvite(
        create<UserId>(request.user.id),
        create<ChatId>(chatId),
      );

      if (result.isErr()) {
        if (result.error instanceof InviteNotFoundError) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof ChatActionNotPermitted) {
          return await reply
            .code(SC.FORBIDDEN)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error in acceptInvite endpoint");
        }
      }

      return await reply.code(SC.OK).send({ message: "Invite accepted" });
    },
  );
  fastifyT.patch(
    "/invite/decline",
    { schema: schema.declineInvite },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { chatId } = request.body;
      const result = await application.declineInvite(
        create<UserId>(request.user.id),
        create<ChatId>(chatId),
      );

      if (result.isErr()) {
        if (result.error instanceof InviteNotFoundError) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof ChatActionNotPermitted) {
          return await reply
            .code(SC.FORBIDDEN)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error in declineInvite endpoint");
        }
      }

      return await reply.code(SC.OK).send({ message: "Invite declined" });
    },
  );
  fastifyT.get(
    "/:chatId",
    { schema: schema.getMessagesById },
    async (request, reply) => {
      if (!request.user) throw new Error("User is not authenticated");
      const { chatId } = request.params;
      const { limit, offset } = request.query;

      const result = await application.getMessages(
        create<UserId>(request.user.id),
        create<ChatId>(chatId),
        limit,
        offset,
      );

      if (result.isErr()) {
        if (
          result.error instanceof ChatNotFoundError ||
          result.error instanceof UserNotFoundError
        ) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof ChatActionNotPermitted) {
          return await reply
            .code(SC.FORBIDDEN)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error in getMessagesById endpoint");
        }
      }
      const messages = result.value.map((message) => ({
        id: message.id,
        text: message.text,
        date: message.date.toISOString(),
        userId: message.userId,
        chatId: message.chatId,
      }));

      return await reply.code(SC.OK).send(messages);
    },
  );
};

export default chatRoutes;

import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes as SC } from "http-status-codes";
import { InternalError } from "#domain/error.js";
import application from "#presentation/context.js";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
  fastify.decorateRequest("user", null);
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = (request.headers.authorization ?? "").split(" ");
      if (token[0] !== "Bearer" || !token[1])
        return reply.code(SC.UNAUTHORIZED).send({
          message: "Token format is invalid. It shoud be: `Bearer __token__`",
        });

      const userResult = await application.validateAccessToken(token[1]);
      if (userResult.isErr()) {
        if (userResult.error instanceof InternalError)
          return reply
            .code(SC.INTERNAL_SERVER_ERROR)
            .send({ message: userResult.error.message });
        else
          return reply
            .code(SC.UNAUTHORIZED)
            .send({ message: userResult.error.message });
      }

      request.user = userResult.value;
    },
  );
});

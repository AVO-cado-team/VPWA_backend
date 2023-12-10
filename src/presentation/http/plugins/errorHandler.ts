import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes as SC } from "http-status-codes";
import { log } from "#infrastructure/log.js";

async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  log.fatal(error, "Unhandled error");
  request.log.error(error);
  if (error.statusCode && error.statusCode < SC.INTERNAL_SERVER_ERROR) {
    return reply.code(error.statusCode).send({ message: error.message });
  } else {
    return await reply.status(SC.INTERNAL_SERVER_ERROR).send({
      message:
        "Something went wrong on the server, please try again later, we are working on it.",
    });
  }
}

export default errorHandler;

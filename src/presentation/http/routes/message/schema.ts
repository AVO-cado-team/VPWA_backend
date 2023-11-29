import { ChatMessageDTO, GeneralErrorDTO, Id } from "#application/dtos.js";
import { Type } from "@sinclair/typebox";

const ChatMessageBody = Type.Object({
  text: Type.String({
    minLength: 1,
    maxLength: 1000,
  }),
  chatId: Id,
});

const sendMessage = {
  operationId: "sendMessage",
  title: "Send message",
  description: "Send message",
  body: ChatMessageBody,
  response: {
    200: ChatMessageDTO,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["message"],
};

export default { sendMessage };

import { ChatMessageDTO, GeneralErrorDTO } from "#application/dtos.js";
import { Type } from "@sinclair/typebox";

const DateTime = Type.Transform(Type.String({ format: "datetime" }))
  .Decode((value) => new Date(value))
  .Encode((value) => value.toISOString());

export const ChatMessageBody = Type.Object({
  text: Type.String(),
  chatId: Type.String(),
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

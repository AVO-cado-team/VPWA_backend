import type { Opaque } from "ts-opaque";
import type { ChatEntity, ChatId } from "./chat.js";
import type { UserEntity, UserId } from "./user.js";
import type { MESSAGE_TYPE } from "@prisma/client";

export type { MESSAGE_TYPE } from "@prisma/client";
export type MessageId = Opaque<string, "MessageId">;
export type MessageEntity = {
  id: MessageId;
  text: string;
  date: Date;
  chatId: ChatId;
  messageType: MESSAGE_TYPE;
  userId: UserId;
};

export type MessageWithUserEntity = MessageEntity & {
  user: UserEntity;
};

export type MessageWithChatEntity = MessageEntity & {
  chat: ChatEntity;
};

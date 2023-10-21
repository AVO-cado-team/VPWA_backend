import { CHAT_USER_RELATION } from "@prisma/client";
import type { MessageEntity } from "./message.js";
import type { UserEntity } from "./user.js";
import type { Opaque } from "ts-opaque";

export type ChatId = Opaque<string, "ChatId">;
export { CHAT_USER_RELATION } from "@prisma/client";

export const MAX_USER_KICKS_TOLERABLE = 3;
export type ChatEntity = {
  id: ChatId;
  chatname: string;
  title: string;
  isPrivate: boolean;
  adminId: string;
};

export type ChatEntityWithRelation = ChatEntity & {
  relation: CHAT_USER_RELATION;
};

export type UserInChat = UserEntity & {
  relation: CHAT_USER_RELATION;
};

export type ChatEntityWithUsers = ChatEntity & {
  users: UserInChat[];
};

export type ChatEntityWithMessages = ChatEntity & {
  messages: MessageEntity[];
};

export type ChatEntityWithUsersAndMessages = ChatEntity & {
  users: UserInChat[];
  messages: MessageEntity[];
};

export class ChatNameAlreadyExistsError extends Error {
  chatNameAlreadyExistsError: true = true;
  constructor(chatName: string) {
    super(`Chat name ${chatName} already exists.`);
  }
}

export class ChatNotFoundError extends Error {
  chatNotFoundError: true = true;
  constructor(chat: string) {
    super("Chat not found. " + chat);
  }
}

export class ChatActionNotPermitted extends Error {
  chatActionNotPermitted: true = true;
  constructor(chat: string, explanation?: string) {
    super("Chat action not permitted. " + chat + " " + explanation);
  }
}

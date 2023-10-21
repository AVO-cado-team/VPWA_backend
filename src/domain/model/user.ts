import type { ChatEntityWithRelation } from "#model/chat.js";
import type { Opaque } from "ts-opaque";

export type UserId = Opaque<string, "UserId">;
export type UserEntity = {
  id: UserId;
  username: string;
};

export const enum USER_ONLINE_STATUS {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  DND = "DND",
}

export type UserEntityWithChats = UserEntity & {
  chats: ChatEntityWithRelation[];
};

export class UserNotFoundError extends Error {
  userNotFound: true = true;
  constructor(name: string) {
    super("User not found: " + name);
  }
}

export class UsernameAlreadyExistsError extends Error {
  usernameAlreadyExists: true = true;
  constructor(username: string) {
    super("User with Username already exists: " + username);
  }
}

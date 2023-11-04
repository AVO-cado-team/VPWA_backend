import type { ChatEntity } from "./chat.js";
import type { UserId } from "./user.js";

export type InviteEntity = {
  userId: UserId;
  chat: ChatEntity;
  createdAt: Date;
};

export class InviteNotFoundError extends Error {
  inviteNotFoundError = true as const;
  constructor(chatId: string, userId: string) {
    super("Invite not found. Chat: " + chatId + " Uset: " + userId);
  }
}

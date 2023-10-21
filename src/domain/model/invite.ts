import { ChatEntity } from "./chat.js";
import { UserId } from "./user.js";

export type InviteEntity = {
  userId: UserId;
  chat: ChatEntity;
  createdAt: Date;
};

export class InviteNotFoundError extends Error {
  inviteNotFoundError: true = true;
  constructor(chatId: string, userId: string) {
    super("Invite not found. Chat: " + chatId + " Uset: " + userId);
  }
}

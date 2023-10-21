import type { UserId } from "./user.js";

export class UserNotFoundInMapError extends Error {
  userNotFoundInMapError: true = true;
  constructor(userId: UserId) {
    super(`User with id ${userId} not found in map`);
  }
}

export class ChatNotFoundInMapError extends Error {
  chatNotFoundInMapError: true = true;
  constructor(chatId: string) {
    super(`Chat with id ${chatId} not found in map`);
  }
}

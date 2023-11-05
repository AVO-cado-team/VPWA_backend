import type { USER_ONLINE_STATUS, UserId } from "#domain/model/user.js";
import type { MESSAGE_TYPE, MessageId } from "#domain/model/message.js";
import type { ChatId } from "#domain/model/chat.js";
import type { Socket } from "socket.io";

export interface RTCService {
  sendMessage(
    userId: UserId,
    chatId: ChatId,
    message: string,
    messageType: MESSAGE_TYPE,
    id: MessageId,
    date: Date,
  ): void;
  sendInvite(inviter: UserId, invitee: UserId, chatName: string): void;
  updateUserStatus(userId: UserId, status: USER_ONLINE_STATUS): void;
  getUserStatus(userId: UserId): USER_ONLINE_STATUS;
  getChatUserStatus(chatId: ChatId): Map<UserId, USER_ONLINE_STATUS>;
  initUsersStatus(userId: UserId, socket: Socket): void;
  connectUser(userId: UserId, socket: Socket): Promise<void>;
  disconnectUser(userId: UserId): void;
  joinUserToChat(userId: UserId, chatId: ChatId): void;
  // sendUserCurrentText(roomId: string, message: string): Promise<void>;
}

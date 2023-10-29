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
    messageId: MessageId,
  ): void;
  sendInvite(inviter: UserId, invitee: UserId, chatName: string): void;
  updateUserStatus(
    userId: UserId,
    status: USER_ONLINE_STATUS,
    socket: Socket,
  ): void;
  getUserStatus(userId: UserId): USER_ONLINE_STATUS;
  getChatUserStatus(chatId: ChatId): Map<UserId, USER_ONLINE_STATUS>;
  // sendUserCurrentText(roomId: string, message: string): Promise<void>;
}

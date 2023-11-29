import type { USER_ONLINE_STATUS, UserId } from "#domain/model/user.js";
import type { MESSAGE_TYPE } from "#domain/model/message.js";
import type { Server, Socket } from "socket.io";
import type { ChatId } from "#domain/model/chat.js";

export type NewMessage = {
  id: string;
  text: string;
  messageType: MESSAGE_TYPE;
  chatId: string;
  userId: string;
  date: Date;
};

export type Invite = {
  inviter: string;
  chatId: string;
};

export type ChatsToUsers = {
  chatId: string;
  userIds: string[];
};

export type ChatToUsersStatus = {
  chatToUsers: ChatsToUsers[];
};

export type UserStatusUpdate = {
  userId: string;
  status: USER_ONLINE_STATUS;
};

export type UserTypingMessage = {
  authorId: UserId;
  chatId: ChatId;
  text: string | undefined;
};

export type SubscribeTyping = {
  chatId: ChatId;
  authorId: UserId;
};

export type InitUserStatus = Record<string, USER_ONLINE_STATUS>;

export type meTyping = {
  text: string;
  chatId: ChatId;
};

interface RTCClientToServerEvents {
  changeOnlineStatus: (status: USER_ONLINE_STATUS) => void;
  meTyping: (data: meTyping) => void;
  subscribeTyping: (msg: SubscribeTyping) => void;
  unsubscribeTyping: (msg: SubscribeTyping) => void;
}

interface RTCServerToClientEvents {
  newMessage: (msg: NewMessage) => void;
  chatsToUsersStatus: (msg: ChatToUsersStatus) => void;
  invite: (msg: Invite) => void;
  userStatusUpdate: (msg: UserStatusUpdate) => void;
  initUsersStatus: (msg: InitUserStatus) => void;
  userTyping: (msg: UserTypingMessage) => void;
  // TODO: Add init online status for user. Send all users
}

interface RTCInterServerEvents {
  // ...
}

interface RTCSocketData {
  // ...
}

export type RTCServer = Server<
  RTCClientToServerEvents,
  RTCServerToClientEvents,
  RTCInterServerEvents,
  RTCSocketData
>;

export type RTCSocket = Socket<
  RTCClientToServerEvents,
  RTCServerToClientEvents,
  RTCInterServerEvents,
  RTCSocketData
>;

import type { USER_ONLINE_STATUS } from "#domain/model/user.js";
import type { MESSAGE_TYPE } from "#domain/model/message.js";
import type { Server, Socket } from "socket.io";

type NewMessage = {
  id: string;
  text: string;
  messageType: MESSAGE_TYPE;
  chatId: string;
  userId: string;
  date: Date;
};

type Invite = {
  inviter: string;
  chatId: string;
};

type ChatsToUsers = {
  chatId: string;
  userIds: string[];
};

type ChatToUsersStatus = {
  chatToUsers: ChatsToUsers[];
};

type UserStatusUpdate = {
  userId: string;
  status: USER_ONLINE_STATUS;
};

interface RTCClientToServerEvents {
  changeOnlineStatus: (status: USER_ONLINE_STATUS) => void;
}

interface RTCServerToClientEvents {
  newMessage: (msg: NewMessage) => void;
  chatsToUsersStatus: (msg: ChatToUsersStatus) => void;
  invite: (msg: Invite) => void;
  userStatusUpdate: (msg: UserStatusUpdate) => void;
  initUsersStatus: (msg: UserStatusUpdate[]) => void;
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

import { USER_ONLINE_STATUS, UserNotFoundError } from "#domain/model/user.js";
import type { RTCSocket } from "#presentation/socket/types.js";
import type { MESSAGE_TYPE, MessageId } from "#domain/model/message.js";
import type { UserRepo } from "#domain/repo/user.js";
import type { UserId } from "#domain/model/user.js";
import type { ChatId } from "#domain/model/chat.js";
import type { RTCService } from "#service/RTC.js";
import { log } from "#infrastructure/log.js";
import {
  ChatNotFoundInMapError,
  UserNotFoundInMapError,
} from "#domain/model/RTC.js";

// TODO: Send message to all users in chats that user left from the chat
export class RTCServiceImpl implements RTCService {
  // NOTE: One user can have only one opened socket???. So there are no android + pc sessions at the same time.
  userToSocket: Map<UserId, RTCSocket> = new Map();
  // PERF:  UserToSocket size = (UserID + Socket) * N = N * (36B + sizeof(Socket))
  // Socket.io memory usage scale linearly. LINK: https://socket.io/docs/v4/memory-usage/
  userToOnlineStatus: Map<UserId, USER_ONLINE_STATUS> = new Map();
  // PERF: UserToOnlineStatus = (UserId + USER_ONLINE_SATUS) = N * (36B + 7B) = N * 43B
  userToChats: Map<UserId, Set<ChatId>> = new Map();
  chatToUsers: Map<ChatId, Set<UserId>> = new Map();
  // TODO: User external dependency for bidirectional map
  // PERF: ChatToUsers = ()
  constructor(public userRepo: UserRepo) {}
  sendMessage(
    authorId: UserId,
    chatId: ChatId,
    message: string,
    messageType: MESSAGE_TYPE,
    id: MessageId,
    date: Date,
  ) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    // Send message to all users in chat
    for (const userId of chatUsers) {
      const socket = this.userToSocket.get(userId);
      if (!socket) throw new UserNotFoundInMapError(userId);
      // Consider adding Date to message
      socket.emit("newMessage", {
        text: message,
        messageType,
        chatId,
        userId: authorId,
        id,
        date,
      });
    }
  }
  // TODO: Consider situation when user accepts invite. In this case we need to send message to all users in chat about new user. And add this user to chatToUsers map
  sendInvite(inviter: UserId, invitee: UserId, chatId: ChatId) {
    log.info({ inviter, invitee, chatId });
    const socket = this.userToSocket.get(invitee);
    if (!socket) throw new UserNotFoundInMapError(invitee);
    socket.emit("invite", { inviter, chatId });
  }
  // async initUsersStatus(
  //   userId: UserId,
  //   status: USER_ONLINE_STATUS,
  //   socket: RTCSocket,
  // ) {}
  async updateUserStatus(
    userId: UserId,
    status: USER_ONLINE_STATUS,
    socket: RTCSocket,
  ) {
    log.info({ userId, status, socketId: socket.id });
    if (status === USER_ONLINE_STATUS.OFFLINE) {
      this.notifyAboutNewUserStatus(userId, status);
      this.userToOnlineStatus.delete(userId);
      this.userToSocket.delete(userId);
      this.removeUsersToChats(userId);
    } else if (status === USER_ONLINE_STATUS.ONLINE) {
      this.userToOnlineStatus.set(userId, USER_ONLINE_STATUS.ONLINE);
      this.userToSocket.set(userId, socket);
      await this.addUsersToChats(userId);
      const initState = this.getInitStateForUser(userId);
      socket.emit("chatsToUsersStatus", {
        chatToUsers: initState,
      });
      this.notifyAboutNewUserStatus(userId, status);
    } else {
      // DND
      this.userToOnlineStatus.set(userId, USER_ONLINE_STATUS.DND);
      this.notifyAboutNewUserStatus(userId, status);
    }
  }

  getInitStateForUser(userId: UserId) {
    const userChats = this.userToChats.get(userId);
    const chatsToUsers = [];
    for (const chatId of userChats ?? []) {
      const users = this.chatToUsers.get(chatId);
      if (!users) throw new ChatNotFoundInMapError(chatId);
      chatsToUsers.push({ chatId, userIds: [...users] });
    }

    return chatsToUsers;
  }

  getUserStatus(userId: UserId) {
    return this.userToOnlineStatus.get(userId) ?? USER_ONLINE_STATUS.OFFLINE;
  }

  getChatUserStatus(chatId: ChatId) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    const chatUserStatus = new Map<UserId, USER_ONLINE_STATUS>();
    for (const userId of chatUsers) {
      chatUserStatus.set(userId, this.getUserStatus(userId));
    }
    return chatUserStatus;
  }

  private notifyAboutNewUserStatus(userId: UserId, status: USER_ONLINE_STATUS) {
    const userChats = this.userToChats.get(userId);
    if (!userChats) throw new UserNotFoundInMapError(userId);
    for (const chatId of userChats) {
      const chatUsers = this.chatToUsers.get(chatId);
      if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
      for (const chatUserId of chatUsers) {
        const socket = this.userToSocket.get(chatUserId);
        if (!socket) throw new UserNotFoundInMapError(chatUserId);
        socket.emit("userStatusUpdate", { userId, status });
      }
    }
  }

  private async addUsersToChats(userId: UserId) {
    const userChats = await this.userRepo.findByIdWithChats(userId);
    if (!userChats) throw new UserNotFoundError(userId);
    for (const chat of userChats.chats) {
      const chatInMap = this.chatToUsers.get(chat.id);
      if (chatInMap === undefined) {
        this.chatToUsers.set(chat.id, new Set<UserId>([userId]));
      } else {
        this.chatToUsers.get(chat.id)?.add(userId);
      }
    }
    this.userToChats.set(
      userId,
      new Set<ChatId>(userChats.chats.map((chat) => chat.id)),
    );
  }

  private removeUsersToChats(userId: UserId) {
    for (const chat of this.userToChats.get(userId) ?? []) {
      this.chatToUsers.get(chat)?.delete(userId);
    }
    this.userToChats.delete(userId);
  }
}

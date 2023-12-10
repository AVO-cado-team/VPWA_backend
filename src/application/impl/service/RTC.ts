import { USER_ONLINE_STATUS, UserNotFoundError } from "#domain/model/user.js";
import type { MESSAGE_TYPE, MessageId } from "#domain/model/message.js";
import type { RTCSocket } from "#presentation/socket/types.js";
import type { UserRepo } from "#domain/repo/user.js";
import type { UserId } from "#domain/model/user.js";
import type { ChatId } from "#domain/model/chat.js";
import type { RTCService } from "#service/RTC.js";
import { type Opaque } from "ts-opaque";
import { log } from "#infrastructure/log.js";
import {
  ChatNotFoundInMapError,
  UserNotFoundInMapError,
} from "#domain/model/RTC.js";

export type UserIdChatId = Opaque<string, "UserIdChatId">;
const logg = log.child({ module: "RTC" });

// NOTE: User typing fearure: user send typing message to server, server notifies all users in chat about user typing,
// DECISSION: Eaither
// TODO: Send message to all users in chats that user left from the chat
export class RTCServiceImpl implements RTCService {
  // NOTE: One user can have only one opened socket???. So there are no android + pc sessions at the same time.
  userToSocket: Map<UserId, RTCSocket> = new Map(); // PERF:  UserToSocket size = (UserID + Socket) * N = N * (36B + sizeof(Socket))
  userToOnlineStatus: Map<UserId, USER_ONLINE_STATUS> = new Map(); // PERF: UserToOnlineStatus = N * (UserId + USER_ONLINE_SATUS) = N * (36B + 7B) = N * 43B
  userToChats: Map<UserId, Set<ChatId>> = new Map();
  chatToUsers: Map<ChatId, Set<UserId>> = new Map();
  // NOTE: in this case is userA is in chats Chat1, Chat2 with userB, then userB will see userA typing in Chat1 and Chat2. This is not a but, but a feature
  userTypingToWatchers: Map<UserId, Set<UserId>> = new Map();
  // TODO: User external dependency for bidirectional map
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
  // When user subscribes to typing we need to add user to watchers.
  // But in the first place we need to check if user is in the chat
  // NOTE: What if user starts to spam with typing messages?
  setUserTyping(authorId: UserId, chatId: ChatId, message: string) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) {
      log.debug({ chatId, msg: "Chat is not found" });
      return;
    }

    if (!chatUsers.has(authorId)) {
      logg.warn({
        userId: authorId,
        chatId,
        msg: "User is pretending typing in chat he is not in",
      });
      return;
    }
    const watchers = this.userTypingToWatchers.get(authorId);
    for (const userId of chatUsers) {
      const socket = this.userToSocket.get(userId);
      if (!socket) throw new UserNotFoundInMapError(userId);
      logg.debug({
        msg: "User typing",
        watchers: [...(watchers ?? [])],
        userId,
        chatId,
        message,
      });
      if (watchers?.has(userId)) {
        socket.emit("userTyping", { chatId, authorId, text: message });
      } else {
        socket.emit("userTyping", { chatId, authorId, text: undefined });
      }
    }
  }
  // TODO: Consider situation when user accepts invite. In this case we need to send message to all users in chat about new user. And add this user to chatToUsers map
  sendInvite(inviter: UserId, invitee: UserId, chatId: ChatId) {
    logg.info({ inviter, invitee, chatId, msg: "Send invite" });
    const socket = this.userToSocket.get(invitee);
    if (!socket) throw new UserNotFoundInMapError(invitee);
    socket.emit("invite", { inviter, chatId });
  }

  chatDelete(chatId: ChatId) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    for (const userId of chatUsers) {
      const socket = this.userToSocket.get(userId);
      if (!socket) throw new UserNotFoundInMapError(userId);
      socket.emit("chatDeleted", { chatId });
    }
  }
  async connectUser(userId: UserId, socket: RTCSocket) {
    logg.info({ msg: "Connect user", userId, socketId: socket.id });
    this.userToSocket.set(userId, socket);
    this.userToOnlineStatus.set(userId, USER_ONLINE_STATUS.ONLINE);
    this.userToSocket.set(userId, socket);
    await this.addUsersToChats(userId);
    this.notifyAboutNewUserStatus(userId, USER_ONLINE_STATUS.ONLINE);
    this.initUsersStatus(userId, socket);
  }
  initUsersStatus(userId: UserId, socket: RTCSocket) {
    const loggg = logg.child({ action: "initUsersStatus" });
    const userChats = this.userToChats.get(userId);
    if (!userChats) {
      loggg.warn({ userId, msg: "Actor User is not found" });
      return;
    }
    const usersStatus: Record<UserId, USER_ONLINE_STATUS> = {};
    for (const chatId of userChats) {
      const chatUsers = this.chatToUsers.get(chatId);
      if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
      for (const chatUserId of chatUsers) {
        if (usersStatus[chatUserId] !== undefined) continue;
        usersStatus[chatUserId] = this.getUserStatus(chatUserId);
      }
    }
    socket.emit("initUsersStatus", usersStatus);
  }
  updateUserStatus(userId: UserId, status: USER_ONLINE_STATUS) {
    logg.info({ userId, status, socketId: this.userToSocket.get(userId)?.id });
    this.userToOnlineStatus.set(userId, status);
    this.notifyAboutNewUserStatus(userId, status);
  }

  disconnectUser(userId: UserId) {
    logg.info({
      msg: "Socket: Disconnect User",
      userId,
      socketId: this.userToSocket.get(userId)?.id,
    });

    this.notifyAboutNewUserStatus(userId, USER_ONLINE_STATUS.OFFLINE);
    this.userToOnlineStatus.delete(userId);
    this.userToSocket.delete(userId);
    this.removeFromWatchers(userId);
    this.removeUsersToChats(userId);
    this.userTypingToWatchers.delete(userId);
  }

  private removeFromWatchers(userId: UserId) {
    const userChats = this.userToChats.get(userId);
    if (!userChats) throw new UserNotFoundInMapError(userId);
    for (const chatId of userChats) {
      const chatUsers = this.chatToUsers.get(chatId);
      if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
      for (const chatUserId of chatUsers) {
        const watchers = this.userTypingToWatchers.get(chatUserId);
        watchers?.delete(userId);
      }
    }
  }

  /**
   * When UserB joins chat while UserA is online, we notify UserA about UserB joining chat
   * @param userId
   * @param chatId
   * @returns
   * @memberof RTCServiceImpl
   * @throws UserNotFoundInMapError
   * @throws ChatNotFoundInMapError
   */
  newUserJoinChat(userId: UserId, chatId: ChatId) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    for (const chatUserId of chatUsers) {
      const socket = this.userToSocket.get(chatUserId);
      if (!socket) throw new UserNotFoundInMapError(chatUserId);
      socket.emit("newUserJoinChat", { userId, chatId });
    }
  }

  joinUserToChat(userId: UserId, chatId: ChatId) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) this.chatToUsers.set(chatId, new Set([userId]));
    else chatUsers.add(userId);
    const userChats = this.userToChats.get(userId);
    if (!userChats) throw new UserNotFoundInMapError(userId);
    userChats.add(chatId);
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

  userLeaveChat(userId: UserId, chatId: ChatId) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    chatUsers.delete(userId);

    const userChats = this.userToChats.get(userId);
    if (!userChats) throw new UserNotFoundInMapError(userId);
    userChats.delete(chatId);

    const watchers = this.userTypingToWatchers.get(userId);
    watchers?.delete(userId);
  }

  subscribeTyping(subscriber: UserId, autor: UserId, chatId: ChatId) {
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    if (!chatUsers.has(subscriber)) {
      logg.warn({
        userId: subscriber,
        chatId,
        msg: "User subscribe to typing. Error: User is not in chat",
      });
      return;
    }
    const watchers = this.userTypingToWatchers.get(autor);
    if (!watchers) {
      this.userTypingToWatchers.set(autor, new Set([subscriber]));
    } else {
      watchers.add(subscriber);
    }

    log.info({
      subscriber,
      autor,
      chatId,
      msg: "User subscribe to typing",
    });
  }

  unsubscribeTyping(subscriber: UserId, autor: UserId, chatId: ChatId) {
    // TODO: Consider auto unsubscribe after some timeout so no resources will be wasted
    const chatUsers = this.chatToUsers.get(chatId);
    if (!chatUsers) throw new ChatNotFoundInMapError(chatId);
    if (!chatUsers.has(subscriber)) {
      logg.warn({
        userId: subscriber,
        chatId,
        msg: "User unsubscribe to typing. Error: User is not in chat",
      });
      return;
    }
    const watchers = this.userTypingToWatchers.get(autor);
    if (!watchers) {
      logg.warn({
        userId: subscriber,
        autor,
        chatId,
        msg: "User unsubscribe to typing. Error: User is not in watchers",
      });
      return;
    }
    watchers.delete(subscriber);
    log.info({
      subscriber,
      autor,
      chatId,
      msg: "User unsubscribe to typing",
    });
  }

  private notifyAboutNewUserStatus(userId: UserId, status: USER_ONLINE_STATUS) {
    const loggg = logg.child({ action: "notifyAboutNewUserStatus" });
    const userChats = this.userToChats.get(userId);
    if (!userChats) {
      loggg.warn({ userId, msg: "Actore User is not found" });
      return;
    }
    for (const chatId of userChats) {
      const chatUsers = this.chatToUsers.get(chatId);
      if (!chatUsers) {
        loggg.warn({ chatId, msg: "Chat is not found" });
        return;
      }
      for (const chatUserId of chatUsers) {
        const socket = this.userToSocket.get(chatUserId);
        if (!socket) {
          loggg.warn({ userId: chatUserId, msg: "User is not found" });
          return;
        }
        socket.emit("userStatusUpdate", { userId, status });
      }
    }
  }

  private async addUsersToChats(userId: UserId) {
    const loggg = logg.child({ action: "addUsersToChats" });
    const userChats = await this.userRepo.findByIdWithChats(userId);
    if (!userChats) {
      loggg.warn({ userId, msg: "Actor User is not found" });
      return;
    }
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

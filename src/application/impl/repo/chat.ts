import { CHAT_USER_RELATION } from "@prisma/client";
import type { ChatRepo } from "#domain/repo/chat.js";
import type { ChatId } from "#domain/model/chat.js";
import type { UserId } from "#domain/model/user.js";
import prisma from "#infrastructure/prisma.js";
import { log } from "#infrastructure/log.js";
import { create } from "ts-opaque";
import type { MessageId } from "#domain/model/message.js";

export const chatRepo: ChatRepo = {
  async create(userId, chatname, isPrivate, title) {
    const chat = await prisma.chat.create({
      data: {
        chatname,
        isPrivate,
        title,
        admin: { connect: { id: userId } },
        users: {
          create: { relation: CHAT_USER_RELATION.ADMIN, userId },
        },
      },
      include: {
        users: {
          where: {
            relation: {
              in: [CHAT_USER_RELATION.ADMIN, CHAT_USER_RELATION.USER],
            },
          },
          include: { user: true },
        },
      },
    });

    log.info(chat, "Create chat");

    return {
      id: create<ChatId>(chat.id),
      chatname: chat.chatname,
      title: chat.title,
      isPrivate: chat.isPrivate,
      adminId: create<UserId>(chat.adminId),
      users: chat.users.map((user) => ({
        username: user.user.username,
        id: create<UserId>(user.user.id),
        relation: user.relation,
      })),
      messages: [],
    };
  },
  async checkIfChatnameExists(chatname) {
    const chat = await prisma.chat.findUnique({
      where: { chatname },
    });
    return Boolean(chat);
  },
  async deleteById(chatId) {
    const chat = await prisma.chat.delete({ where: { id: chatId } });
    log.info(chat, "Delete chat");
  },
  async deleteByName(chatname) {
    const chat = await prisma.chat.delete({ where: { chatname } });
    log.info(chat, "Delete chat");
  },
  async findById(chatId) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        users: { where: { relation: { not: CHAT_USER_RELATION.KICKED } } },
      },
    });
    if (!chat) return chat;

    return {
      ...chat,
      id: create<ChatId>(chat.id),
      users: chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
      })),
      adminId: create<UserId>(chat.adminId),
    };
  },

  async findByIdWithUsers(chatId) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { users: { include: { user: true } } },
    });
    if (!chat) return chat;

    return {
      chatname: chat.chatname,
      isPrivate: chat.isPrivate,
      title: chat.title,
      id: create<ChatId>(chat.id),
      users: chat.users.map((user) => ({
        relation: user.relation,
        id: create<UserId>(user.userId),
        username: user.user.username,
      })),
      adminId: create<UserId>(chat.adminId),
    };
  },

  async findByChatname(chatname) {
    const chat = await prisma.chat.findUnique({
      where: { chatname },
      include: {
        users: { where: { relation: { not: CHAT_USER_RELATION.KICKED } } },
      },
    });
    if (!chat) return chat;

    return {
      ...chat,
      id: create<ChatId>(chat.id),
      users: chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
      })),
      adminId: create<UserId>(chat.adminId),
    };
  },

  async updateChatname(chatId, newChatname) {
    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { chatname: newChatname },
      include: { users: true },
    });
    log.info(chat, "Update chatname");

    return {
      ...chat,
      id: create<ChatId>(chat.id),
      users: chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
      })),
      adminId: create<UserId>(chat.adminId),
    };
  },
  async addUserByChatId(chatId, userId) {
    const userOnChats = await prisma.userOnChats.create({
      data: {
        chatId,
        userId,
        relation: CHAT_USER_RELATION.USER,
      },
      include: { chat: { include: { users: { include: { user: true } } } } },
    });
    log.info(userOnChats, "Add user to chat. User: " + userId);

    return {
      ...userOnChats.chat,
      id: create<ChatId>(userOnChats.chatId),
      users: userOnChats.chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
        username: user.user.username,
      })),
    };
  },
  async addUserByChatname(chatname, userId) {
    const userOnChats = await prisma.userOnChats.create({
      data: {
        chat: { connect: { chatname } },
        user: { connect: { id: userId } },
        relation: CHAT_USER_RELATION.USER,
      },
      include: {
        chat: {
          include: {
            users: { include: { user: true } },
            messages: { take: 50, skip: 0, orderBy: { date: "asc" } },
          },
        },
      },
    });
    log.info(userOnChats, "Add user to chat. User: " + userId);

    return {
      ...userOnChats.chat,
      id: create<ChatId>(userOnChats.chatId),
      users: userOnChats.chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
        username: user.user.username,
      })),
      messages: userOnChats.chat.messages.map((message) => ({
        ...message,
        id: create<MessageId>(message.id),
        chatId: create<ChatId>(message.chatId),
        userId: create<UserId>(message.userId),
      })),
    };
  },
  async removeUser(chatId, userId) {
    const userOnChats = await prisma.userOnChats.delete({
      where: { userId_chatId: { chatId, userId } },
      include: { chat: { include: { users: { include: { user: true } } } } },
    });

    log.info(userOnChats, "Remove user from chat. User: " + userId);

    return {
      ...userOnChats.chat,
      id: create<ChatId>(userOnChats.chatId),
      users: userOnChats.chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
        username: user.user.username,
      })),
    };
  },
  async upsertUserRelation(chatId, userId, relation) {
    await prisma.userOnChats.upsert({
      where: { userId_chatId: { chatId, userId } },
      create: {
        chatId,
        userId,
        relation,
      },
      update: { relation },
      include: { chat: { include: { users: { include: { user: true } } } } },
    });

    log.info(
      "Change user relation. User: " + userId + " New relation: " + relation,
    );

    return undefined;
  },
  async getUserRelation(chatId, userId) {
    const userOnChats = await prisma.userOnChats.findUnique({
      where: { userId_chatId: { chatId, userId } },
    });

    if (!userOnChats) return null;
    return userOnChats.relation;
  },
  async removeUserRelation(chatId, userId) {
    await prisma.userOnChats.delete({
      where: { userId_chatId: { chatId, userId } },
    });
    log.info("Remove user relation. User: " + userId + " Chat: " + chatId);

    return undefined;
  },
  async upsertUserKick(kickerId, chatId, kickedId) {
    await prisma.userKicks.upsert({
      where: {
        chatId_kickerId_kickedId: {
          chatId,
          kickedId,
          kickerId,
        },
      },
      create: {
        chatId,
        kickedId,
        kickerId,
      },
      update: {},
    });
    log.info(
      "Kick user from chat. Kicker: " +
        kickerId +
        " Kicked: " +
        kickedId +
        " Chat: " +
        chatId,
    );

    return undefined;
  },
  async getUserKicks(chatId, userId) {
    const kicks = await prisma.userKicks.count({
      where: { chatId, kickedId: userId },
    });
    log.info(
      "Get user kicks. User: " +
        userId +
        " Chat: " +
        chatId +
        " Kicks: " +
        kicks,
    );

    return kicks;
  },

  async getMessages(chatId, limit, offset) {
    const messages = await prisma.message.findMany({
      where: { chatId },
      take: limit,
      skip: offset,
      orderBy: { date: "desc" },
    });
    log.info(
      "Get messages. Chat: " +
        chatId +
        " Limit: " +
        limit +
        " Offset: " +
        offset,
    );

    return messages.map((message) => ({
      ...message,
      id: create<MessageId>(message.id),
      chatId: create<ChatId>(message.chatId),
      userId: create<UserId>(message.userId),
    }));
  },

  async createMessage(chatId, userId, message, messageType) {
    const messageEntity = await prisma.message.create({
      data: {
        chatId,
        userId,
        text: message,
        messageType,
      },
    });

    return {
      ...messageEntity,
      id: create<MessageId>(messageEntity.id),
      chatId: create<ChatId>(messageEntity.chatId),
      userId: create<UserId>(messageEntity.userId),
    };
  },

  async findByUserIdWithMessageUsers(userId, limit, offset) {
    const chats = await prisma.userOnChats.findMany({
      where: { user: { id: userId } },
      include: {
        chat: {
          include: {
            users: {
              where: { relation: { not: CHAT_USER_RELATION.KICKED } },
              include: { user: true },
            },
            messages: {
              take: limit,
              skip: offset,
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    return chats.map((chat) => ({
      chatname: chat.chat.chatname,
      adminId: create<UserId>(chat.chat.adminId),
      isPrivate: chat.chat.isPrivate,
      title: chat.chat.title,
      id: create<ChatId>(chat.chatId),
      messages: chat.chat.messages.map((message) => ({
        ...message,
        id: create<MessageId>(message.id),
        chatId: create<ChatId>(message.chatId),
        userId: create<UserId>(message.userId),
      })),
      users: chat.chat.users.map((user) => ({
        ...user,
        id: create<UserId>(user.userId),
        username: user.user.username,
      })),
    }));
  },
};

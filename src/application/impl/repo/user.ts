import prisma from "#infrastructure/prisma.js";
import type { UserRepo } from "#repo/user.js";
import type { UserId } from "#model/user.js";
import type { ChatId } from "#model/chat.js";
import { log } from "#infrastructure/log.js";
import { create } from "ts-opaque";
import { CHAT_USER_RELATION } from "@prisma/client";

export const userRepo: UserRepo = {
  async create(userId, username) {
    const user = await prisma.user.create({
      data: { id: userId, username },
      include: { chats: true },
    });
    log.info(user, "Create user");

    return {
      ...user,
      id: create<UserId>(user.id),
      chats: user.chats.map((chat) => ({
        ...chat,
        id: create<ChatId>(chat.chatId),
      })),
    };
  },

  async deleteById(userId) {
    const user = await prisma.user.delete({ where: { id: userId } });
    log.info(user, "Delete user");
  },

  async checkIfUsernameExists(username) {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return Boolean(user);
  },

  async findById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { chats: true },
    });
    if (!user) return user;

    return {
      username: user.username,
      id: create<UserId>(user.id),
      chats: user.chats.map((chat) => ({
        relation: chat.relation,
        id: create<ChatId>(chat.chatId),
      })),
    };
  },

  async findByUsername(username) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { chats: true },
    });
    if (!user) return user;

    return {
      username: user.username,
      id: create<UserId>(user.id),
      chats: user.chats.map((chat) => ({
        relation: chat.relation,
        id: create<ChatId>(chat.chatId),
      })),
    };
  },

  async updateUsername(userId, newUsername) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { username: newUsername },
      include: { chats: true },
    });
    log.info(user, "Update user username");

    return {
      ...user,
      id: create<UserId>(user.id),
      chats: user.chats.map((chat) => ({
        ...chat,
        id: create<ChatId>(chat.chatId),
      })),
    };
  },

  async getInvites(userId) {
    const invites = await prisma.userOnChats.findMany({
      where: { userId, relation: CHAT_USER_RELATION.INVITED },
      include: { chat: true },
    });

    return invites.map((invite) => ({
      createdAt: invite.createdAt,
      chat: {
        ...invite.chat,
        id: create<ChatId>(invite.chatId),
      },
      userId: create<UserId>(invite.userId),
    }));
  },

  async findByIdWithChats(userId) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        chats: {
          every: {
            relation: {
              in: [
                CHAT_USER_RELATION.USER,
                CHAT_USER_RELATION.ADMIN,
                CHAT_USER_RELATION.INVITED,
              ],
            },
          },
        },
      },
      include: { chats: { include: { chat: true } } },
    });
    if (!user) return user;

    return {
      username: user.username,
      id: create<UserId>(user.id),
      chats: user.chats.map((chat) => ({
        relation: chat.relation,
        id: create<ChatId>(chat.chatId),
        chatname: chat.chat.chatname,
        title: chat.chat.title,
        isPrivate: chat.chat.isPrivate,
        adminId: chat.chat.adminId,
      })),
    };
  },
};

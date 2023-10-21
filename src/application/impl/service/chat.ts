import type { ChatId } from "#domain/model/chat.js";
import {
  CHAT_USER_RELATION,
  ChatActionNotPermitted,
  ChatNameAlreadyExistsError,
  ChatNotFoundError,
  MAX_USER_KICKS_TOLERABLE,
} from "#domain/model/chat.js";
import type { UserId } from "#model/user.js";
import { UserNotFoundError } from "#model/user.js";
import type { ChatRepo } from "#domain/repo/chat.js";
import type { ChatService } from "#domain/service/chat.js";
import { Err, Ok } from "ts-results-es";
import { InviteNotFoundError } from "#domain/model/invite.js";
import type { MESSAGE_TYPE } from "#domain/model/message.js";

export class ChatServiceImpl implements ChatService {
  constructor(public repo: ChatRepo) {}

  async create(
    userId: UserId,
    chatname: string,
    isPrivate: boolean,
    title: string,
  ) {
    const chatWithChatname = await this.repo.checkIfChatnameExists(chatname);
    if (chatWithChatname)
      return new Err(new ChatNameAlreadyExistsError(chatname));
    const chat = await this.repo.create(userId, chatname, isPrivate, title);
    return new Ok(chat);
  }

  async deleteById(userId: UserId, chatId: ChatId) {
    const chat = await this.repo.findById(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));
    if (chat.adminId !== userId)
      return new Err(new ChatActionNotPermitted(chat.chatname));
    await this.repo.deleteById(chatId);
    return new Ok(undefined);
  }

  async deleteByName(userId: UserId, chatname: string) {
    const chat = await this.repo.findByChatname(chatname);
    if (!chat) return new Err(new ChatNotFoundError(chatname));
    if (chat.adminId !== userId)
      return new Err(new ChatActionNotPermitted(chat.chatname));
    await this.repo.deleteByName(chatname);
    return new Ok(undefined);
  }

  async addUser(actorId: UserId, chatId: ChatId, userId: UserId) {
    const chat = await this.repo.findById(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));

    if (actorId === chat.adminId) {
      return new Ok(await this.repo.addUser(chatId, userId));
    }

    if (actorId === userId) {
      return new Ok(await this.repo.addUser(chatId, userId));
    }

    return new Err(new ChatActionNotPermitted(chat.chatname));
  }

  async removeUser(actorId: UserId, chatId: ChatId, userId: UserId) {
    const chat = await this.repo.findById(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));

    if (actorId === chat.adminId) {
      if (actorId === userId) {
        // TODO: add logic if adming removes himself
        return new Err(new ChatActionNotPermitted(chat.chatname));
      }
      return new Ok(await this.repo.removeUser(chatId, userId));
    }

    if (actorId === userId) {
      return new Ok(await this.repo.removeUser(chatId, userId));
    }

    return new Err(new ChatActionNotPermitted(chat.chatname));
  }

  async getById(chatId: ChatId) {
    const chat = await this.repo.findById(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));
    return new Ok(chat);
  }

  async inviteById(actorId: UserId, chatId: ChatId, userId: UserId) {
    const chat = await this.repo.findByIdWithUsers(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));
    if (chat.isPrivate && chat.adminId !== actorId)
      return new Err(new ChatActionNotPermitted(chatId));
    const actorInChat = chat.users.find((actor) => actor.id === actorId);
    if (actorInChat === undefined)
      return new Err(new ChatActionNotPermitted(chatId));
    const userInChat = chat.users.find((user) => user.id === userId);

    if (chat.adminId === actorId) {
      if (userInChat?.relation === CHAT_USER_RELATION.KICKED) {
        await this.repo.upsertUserRelation(
          chatId,
          userId,
          CHAT_USER_RELATION.USER,
        );
        return new Ok(undefined);
      } else if (userInChat === undefined) {
        await this.repo.upsertUserRelation(
          chatId,
          userId,
          CHAT_USER_RELATION.INVITED,
        );
        return new Ok(undefined);
      } else {
        return new Err(new ChatActionNotPermitted(chatId));
      }
    }

    await this.repo.upsertUserRelation(
      chatId,
      userId,
      CHAT_USER_RELATION.INVITED,
    );
    return new Ok(undefined);
  }

  async kickUser(kickerId: UserId, chatId: ChatId, kickedId: UserId) {
    // Check if chat exists
    const chat = await this.repo.findByIdWithUsers(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));
    // Check if kicked is in chat
    const kickedInChat = chat.users.find((user) => user.id === kickedId);
    if (kickedInChat === undefined)
      return new Err(new UserNotFoundError(kickedId));
    // Check if kicker is in chat and not kicked
    const kickerInChat = chat.users.find((user) => user.id === kickerId);
    if (
      kickerInChat === undefined ||
      kickedInChat.relation === CHAT_USER_RELATION.KICKED
    )
      return new Err(new UserNotFoundError(kickerId));

    // TODO: Decide what to do if admin/user kicks himself
    if (kickerId === kickedId)
      return new Err(new ChatActionNotPermitted(chatId));
    if (chat.adminId === kickerId) {
      // TODO: Decide what to do with userKicks if admin already kicked user. 1) Do nothing 2) Remove all userKicks
      await this.repo.upsertUserRelation(
        chatId,
        kickedId,
        CHAT_USER_RELATION.KICKED,
      );
      return new Ok(undefined);
    }

    const userKicks = await this.repo.getUserKicks(chatId, kickedId);
    if (userKicks + 1 >= MAX_USER_KICKS_TOLERABLE) {
      await this.repo.removeUserRelation(chatId, kickedId);
      return new Ok(undefined);
    }
    await this.repo.upsertUserKick(kickerId, chatId, kickedId);
    await this.repo.upsertUserRelation(
      chatId,
      kickedId,
      CHAT_USER_RELATION.KICKED,
    );
    return new Ok(undefined);
  }

  async acceptInvitation(userId: UserId, chatId: ChatId) {
    const relation = await this.repo.getUserRelation(chatId, userId);
    if (relation === null)
      return new Err(new InviteNotFoundError(chatId, userId));

    if (relation === CHAT_USER_RELATION.INVITED) {
      await this.repo.upsertUserRelation(
        chatId,
        userId,
        CHAT_USER_RELATION.USER,
      );
      return new Ok(undefined);
    }

    return new Err(new ChatActionNotPermitted(chatId));
  }

  async declineInvitation(userId: UserId, chatId: ChatId) {
    const relation = await this.repo.getUserRelation(chatId, userId);
    if (relation === null)
      return new Err(new InviteNotFoundError(chatId, userId));

    if (relation === CHAT_USER_RELATION.INVITED) {
      await this.repo.removeUserRelation(chatId, userId);
      return new Ok(undefined);
    }

    return new Err(new ChatActionNotPermitted(chatId));
  }

  async leaveChat(userId: UserId, chatId: ChatId) {
    const chat = await this.repo.findByIdWithUsers(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));
    const userInChat = chat.users.find((user) => user.id === userId);
    if (userInChat === undefined) return new Err(new UserNotFoundError(userId));

    if (chat.adminId === userId) {
      await this.repo.deleteById(chatId);
      return new Ok(undefined);
    }

    await this.repo.removeUserRelation(chatId, userId);
    return new Ok(undefined);
  }

  async getMessages(
    actorId: UserId,
    chatId: ChatId,
    limit: number,
    offset: number,
  ) {
    const chat = await this.repo.findByIdWithUsers(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));
    const userInChat = chat.users.find((user) => user.id === actorId);
    if (userInChat === undefined)
      return new Err(new UserNotFoundError(actorId));

    if (userInChat.relation === CHAT_USER_RELATION.KICKED)
      return new Err(new ChatActionNotPermitted(chatId));

    return new Ok(await this.repo.getMessages(chatId, limit, offset));
  }

  async sendMessage(
    actorId: UserId,
    chatId: ChatId,
    message: string,
    messageType: MESSAGE_TYPE,
  ) {
    const chat = await this.repo.findByIdWithUsers(chatId);
    if (!chat) return new Err(new ChatNotFoundError(chatId));

    const userInChat = chat.users.find((user) => user.id === actorId);
    if (userInChat === undefined)
      return new Err(new UserNotFoundError(actorId));

    if (userInChat.relation === CHAT_USER_RELATION.KICKED)
      return new Err(new ChatActionNotPermitted(chatId));

    await this.repo.createMessage(chatId, actorId, message, messageType);
    return new Ok(undefined);
  }
}

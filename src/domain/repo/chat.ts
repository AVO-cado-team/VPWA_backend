import type {
  CHAT_USER_RELATION,
  ChatEntity,
  ChatEntityWithUsersAndMessages as ChatEntityWithUserMessage,
  ChatEntityWithUsers,
  ChatId,
} from "#domain/model/chat.js";
import type { MESSAGE_TYPE, MessageEntity } from "#domain/model/message.js";
import type { UserId } from "#domain/model/user.js";

export interface ChatRepo {
  create(
    userId: UserId,
    chatname: string,
    isPrivate: boolean,
    title: string,
  ): Promise<ChatEntityWithUserMessage>;
  deleteById(chatId: ChatId): Promise<void>;
  deleteByName(chatname: string): Promise<void>;
  checkIfChatnameExists(chatname: string): Promise<boolean>;
  findById(chatId: ChatId): Promise<ChatEntity | null>;
  findByIdWithUsers(chatId: ChatId): Promise<ChatEntityWithUsers | null>;
  findByChatname(chatname: string): Promise<ChatEntity | null>;
  findByUserIdWithMessageUsers(
    userId: UserId,
    limit: number,
    offset: number,
  ): Promise<ChatEntityWithUserMessage[]>;
  upsertUserRelation(
    chatId: ChatId,
    userId: UserId,
    relation: CHAT_USER_RELATION,
  ): Promise<void>;
  getUserRelation(
    chatId: ChatId,
    userId: UserId,
  ): Promise<CHAT_USER_RELATION | null>;
  removeUserRelation(chatId: ChatId, userId: UserId): Promise<void>;
  updateChatname(chatId: ChatId, newChatname: string): Promise<ChatEntity>;
  addUserByChatId(chatId: ChatId, userId: UserId): Promise<ChatEntityWithUsers>;
  addUserByChatname(
    chatname: string,
    userId: UserId,
  ): Promise<ChatEntityWithUserMessage>;
  removeUser(chatId: ChatId, userId: UserId): Promise<ChatEntityWithUsers>;
  upsertUserKick(
    kickerId: UserId,
    chatId: ChatId,
    kickedId: UserId,
  ): Promise<void>;
  getUserKicks(chatId: ChatId, userId: UserId): Promise<number>;
  getMessages(
    chatId: ChatId,
    limit: number,
    offset: number,
  ): Promise<MessageEntity[]>;
  createMessage(
    chatId: ChatId,
    userId: UserId,
    message: string,
    messageType: MESSAGE_TYPE,
  ): Promise<MessageEntity>;
}

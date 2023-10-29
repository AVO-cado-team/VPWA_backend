import type {
  ChatActionNotPermitted,
  ChatEntity,
  ChatId,
  ChatNameAlreadyExistsError,
  ChatNotFoundError,
} from "#domain/model/chat.js";
import type { InviteNotFoundError } from "#domain/model/invite.js";
import { InviteEntity } from "#domain/model/invite.js";
import type { MESSAGE_TYPE, MessageEntity } from "#domain/model/message.js";
import type { UserId, UserNotFoundError } from "#domain/model/user.js";
import type { ChatRepo } from "#domain/repo/chat.js";
import type { Result } from "ts-results-es";

export interface ChatService {
  repo: ChatRepo;
  create(
    userId: UserId,
    chatname: string,
    isPrivate: boolean,
    title: string,
  ): Promise<Result<ChatEntity, ChatNameAlreadyExistsError>>;
  deleteById(
    userId: UserId,
    chatId: ChatId,
  ): Promise<Result<void, ChatNotFoundError | ChatActionNotPermitted>>;
  deleteByName(
    userId: UserId,
    chatname: string,
  ): Promise<Result<void, ChatNotFoundError | ChatActionNotPermitted>>;
  addUser(
    actorId: UserId,
    chatId: ChatId,
    userId: UserId,
  ): Promise<Result<ChatEntity, ChatNotFoundError | ChatActionNotPermitted>>;
  removeUser(
    actorId: UserId,
    chatId: ChatId,
    userId: UserId,
  ): Promise<Result<ChatEntity, ChatNotFoundError | ChatActionNotPermitted>>;
  inviteById(
    actorId: UserId,
    chatId: ChatId,
    userId: UserId,
  ): Promise<
    Result<void, ChatNotFoundError | ChatActionNotPermitted | UserNotFoundError>
  >;
  kickUser(
    kickerId: UserId,
    chatId: ChatId,
    kickedId: UserId,
  ): Promise<
    Result<void, ChatNotFoundError | ChatActionNotPermitted | UserNotFoundError>
  >;
  acceptInvitation(
    userId: UserId,
    chatId: ChatId,
  ): Promise<Result<void, ChatActionNotPermitted | InviteNotFoundError>>;
  declineInvitation(
    userId: UserId,
    chatId: ChatId,
  ): Promise<Result<void, ChatActionNotPermitted | InviteNotFoundError>>;
  getById(chatId: ChatId): Promise<Result<ChatEntity, ChatNotFoundError>>;
  leaveChat(
    userId: UserId,
    chatId: ChatId,
  ): Promise<Result<void, ChatNotFoundError | UserNotFoundError>>;
  getMessages(
    actorId: UserId,
    chatId: ChatId,
    limit: number,
    offset: number,
  ): Promise<
    Result<
      MessageEntity[],
      ChatNotFoundError | UserNotFoundError | ChatActionNotPermitted
    >
  >;
  sendMessage(
    authorId: UserId,
    chatId: ChatId,
    message: string,
    messageType: MESSAGE_TYPE,
  ): Promise<
    Result<
      MessageEntity,
      ChatNotFoundError | ChatActionNotPermitted | UserNotFoundError
    >
  >;
}

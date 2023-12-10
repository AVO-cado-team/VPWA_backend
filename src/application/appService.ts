import type {
  AuthResponse,
  EmailIsNotVerifiedError,
  GoogleAuthError,
  TokenInvalidError,
  UserAlreadyExistsError,
  UserDevice,
  UserEmailIncorrectError,
  UserPasswordIncorrectError,
  UserPasswordNotValidError,
} from "#model/auth.js";
import type {
  USER_ONLINE_STATUS,
  UserEntity,
  UserId,
  UsernameAlreadyExistsError,
  UserNotFoundError,
} from "#model/user.js";
import type { InternalError } from "#domain/error.js";
import type { Result } from "ts-results-es";
import type {
  AccessTokenPayloadDTO,
  AuthDTO,
  TokenPairDTO,
  UserDeviceDTO,
} from "./dtos.js";

import type { AuthService } from "#service/auth.js";
import type { UserService } from "#service/user.js";
import type {
  ChatActionNotPermitted,
  ChatEntityWithUsersAndMessages,
  ChatId,
  ChatNameAlreadyExistsError,
  ChatNotFoundError,
} from "#domain/model/chat.js";
import type {
  InviteEntity,
  InviteNotFoundError,
} from "#domain/model/invite.js";
import type { MESSAGE_TYPE, MessageEntity } from "#domain/model/message.js";
import type { ChatService } from "#domain/service/chat.js";
import type { RTCService } from "#domain/service/RTC.js";
import type { RTCSocket } from "#presentation/socket/types.js";

export interface ApplicationService {
  userService: UserService;
  authService: AuthService;
  chatService: ChatService;
  rtcService: RTCService;

  // NOTE: ----------- AUTH ----------------
  authGoogleOpenID(
    credential: string,
    userDevice: UserDeviceDTO,
  ): Promise<
    Result<
      AuthDTO,
      | InternalError
      | TokenInvalidError
      | EmailIsNotVerifiedError
      | UserNotFoundError
    >
  >;
  authGoogleOAuth2(
    googleTokens: TokenPairDTO,
    userDevice: UserDeviceDTO,
  ): Promise<
    Result<
      AuthDTO,
      | InternalError
      | GoogleAuthError
      | EmailIsNotVerifiedError
      | UserNotFoundError
    >
  >;
  validateAccessToken(
    accessToken: string,
  ): Promise<Result<AccessTokenPayloadDTO, TokenInvalidError | InternalError>>;
  refreshToken(
    userDevice: UserDeviceDTO,
    refreshToken: string,
  ): Promise<Result<TokenPairDTO, TokenInvalidError | InternalError>>;
  logout(
    refreshToken: string,
  ): Promise<Result<void, TokenInvalidError | InternalError>>;
  register(
    email: string,
    password: string,
    name: string,
    surname: string,
    username: string,
    userDevice: UserDevice,
  ): Promise<
    Result<
      AuthResponse,
      | InternalError
      | UserEmailIncorrectError
      | UserAlreadyExistsError
      | UserPasswordNotValidError
      | UsernameAlreadyExistsError
    >
  >;
  login(
    email: string,
    password: string,
    userDevice: UserDevice,
  ): Promise<
    Result<
      AuthResponse,
      InternalError | UserEmailIncorrectError | UserPasswordIncorrectError
    >
  >;
  getMe(
    userId: UserId,
  ): Promise<Result<UserEntity, UserNotFoundError | InternalError>>;
  // NOTE: ----------- AUTH ----------------

  // PERF: ----------- USER ----------------
  isUsernameExists(username: string): Promise<boolean>;
  updateUsername(
    userId: UserId,
    newUsername: string,
  ): Promise<Result<void, UsernameAlreadyExistsError | UserNotFoundError>>;
  // PERF: ----------- USER ----------------

  // HACK: ----------- CHAT ----------------
  joinOrCreateChat(
    userId: UserId,
    chatname: string,
    isPrivate: boolean,
    title: string,
  ): Promise<
    Result<
      ChatEntityWithUsersAndMessages,
      ChatNameAlreadyExistsError | UserNotFoundError | ChatActionNotPermitted
    >
  >; // +
  deleteChatById(
    userId: UserId,
    chatId: ChatId,
  ): Promise<
    Result<void, UserNotFoundError | ChatNotFoundError | ChatActionNotPermitted>
  >; // +
  deleteChatByChatname(
    userId: UserId,
    chatname: string,
  ): Promise<
    Result<void, UserNotFoundError | ChatNotFoundError | ChatActionNotPermitted>
  >;
  inviteUserById(
    actorId: UserId,
    chatId: ChatId,
    invitedUserId: UserId,
  ): Promise<
    Result<void, UserNotFoundError | ChatNotFoundError | ChatActionNotPermitted>
  >;
  inviteUserByUsername(
    actorId: UserId,
    chatId: ChatId,
    invitedUsername: string,
  ): Promise<
    Result<void, UserNotFoundError | ChatNotFoundError | ChatActionNotPermitted>
  >; // +
  acceptInvite(
    userId: UserId,
    chatId: ChatId,
  ): Promise<Result<void, InviteNotFoundError | ChatActionNotPermitted>>;
  declineInvite(
    userId: UserId,
    chatId: ChatId,
  ): Promise<Result<void, InviteNotFoundError | ChatActionNotPermitted>>;
  quitChat(
    userId: UserId,
    chatId: ChatId,
  ): Promise<
    Result<void, ChatNotFoundError | ChatActionNotPermitted | UserNotFoundError>
  >;
  kickUserInChat(
    actorId: UserId,
    chatId: ChatId,
    kickedUserId: UserId,
  ): Promise<
    Result<void, ChatNotFoundError | UserNotFoundError | ChatActionNotPermitted>
  >;
  kickUserInChatByUsername(
    kickerId: UserId,
    chatId: ChatId,
    kickedUsername: string,
  ): Promise<
    Result<void, ChatNotFoundError | UserNotFoundError | ChatActionNotPermitted>
  >;
  getUserInvites(
    userId: UserId,
  ): Promise<Result<InviteEntity[], UserNotFoundError>>;
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
    actorId: UserId,
    chatId: ChatId,
    message: string,
    messageType: MESSAGE_TYPE,
  ): Promise<
    Result<
      MessageEntity,
      UserNotFoundError | ChatNotFoundError | ChatActionNotPermitted
    >
  >;
  getAllChats(
    userId: UserId,
    limit: number,
    offset: number,
  ): Promise<Result<ChatEntityWithUsersAndMessages[], UserNotFoundError>>;
  // HACK: ----------- CHAT ----------------

  // FIX: ----------- Real Ttme Communication ----------------
  connectUser(accessToken: string, socket: RTCSocket): Promise<UserId | null>;
  setUserStatus(userId: UserId, status: USER_ONLINE_STATUS): void;
  disconnectUser(userId: UserId): void;
  setUserTyping(userId: UserId, chatId: ChatId, message: string): void;
  subscribeTyping(subscriber: UserId, autor: UserId, chatId: ChatId): void;
  // FIX: ----------- Real Ttme Communication ----------------
  //
  getUserById(userId: UserId): Promise<Result<UserEntity, UserNotFoundError>>;
}

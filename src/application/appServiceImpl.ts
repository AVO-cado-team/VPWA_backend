import { AuthMicroServiceError, TokenInvalidError } from "#model/auth.js";
import type { RTCSocket } from "#presentation/socket/types.js";
import type { MESSAGE_TYPE } from "#domain/model/message.js";
import type { TokenPairDTO, UserDeviceDTO } from "./dtos.js";
import type { ChatService } from "#domain/service/chat.js";
import type { ApplicationService } from "./appService.js";
import type { RTCService } from "#domain/service/RTC.js";
import type { UserService } from "#service/user.js";
import type { AuthService } from "#service/auth.js";
import type { ChatId } from "#domain/model/chat.js";
import { InternalError } from "#domain/error.js";
import type { UserId } from "#model/user.js";
import { Err, Ok } from "ts-results-es";
import { create } from "ts-opaque";
import {
  USER_ONLINE_STATUS,
  UsernameAlreadyExistsError,
  UserNotFoundError,
} from "#model/user.js";

export class Application implements ApplicationService {
  constructor(
    public userService: UserService,
    public authService: AuthService,
    public chatService: ChatService,
    public rtcService: RTCService,
  ) {}

  async authGoogleOpenID(credential: string, userDevice: UserDeviceDTO) {
    const authResult = await this.authService.authGoogleOpenID(
      credential,
      userDevice,
    );
    if (authResult.isErr()) {
      return authResult.error instanceof AuthMicroServiceError
        ? new Err(new InternalError())
        : new Err(authResult.error);
    }
    const auth = authResult.value;

    const user = await this.userService.repo.findById(
      create<UserId>(auth.userData.id),
    );
    if (!user) {
      const userName = await this.userService.generateUniqueUsername(
        auth.userData.email,
      );
      const createResult = await this.userService.create(
        create<UserId>(auth.userData.id),
        userName,
      );
      if (createResult.isErr()) throw new UsernameAlreadyExistsError(userName); // NOTE: unexpected error, should not happen because of generateUniqueUsername() call that generates unique name.
    }

    return new Ok({
      ...auth,
    });
  }
  async authGoogleOAuth2(
    googleTokens: TokenPairDTO,
    userDevice: UserDeviceDTO,
  ) {
    const authResult = await this.authService.authGoogleOAuth2(
      googleTokens,
      userDevice,
    );
    if (authResult.isErr()) {
      return authResult.error instanceof AuthMicroServiceError
        ? new Err(new InternalError())
        : new Err(authResult.error);
    }
    const auth = authResult.value;

    const user = await this.userService.repo.findById(
      create<UserId>(auth.userData.id),
    );
    if (!user) {
      const userName = await this.userService.generateUniqueUsername(
        auth.userData.email,
      );
      const createResult = await this.userService.create(
        create<UserId>(auth.userData.id),
        userName,
      );
      if (createResult.isErr()) throw new UsernameAlreadyExistsError(userName); // NOTE: unexpected error, should not happen because of generateUniqueUsername() call that generates unique name.
    }

    return new Ok({
      ...auth,
    });
  }

  async validateAccessToken(accessToken: string) {
    const userDataResult =
      await this.authService.validateAccessToken(accessToken);
    if (userDataResult.isErr()) {
      return userDataResult.error instanceof TokenInvalidError
        ? new Err(userDataResult.error)
        : new Err(new InternalError());
    }

    return userDataResult;
  }

  async refreshToken(userDevice: UserDeviceDTO, refreshToken: string) {
    const tokensResult = await this.authService.exchangeRefreshToken(
      userDevice,
      refreshToken,
    );
    if (tokensResult.isErr()) {
      return tokensResult.error instanceof TokenInvalidError
        ? new Err(tokensResult.error)
        : new Err(new InternalError());
    }

    return new Ok(tokensResult.value);
  }

  async logout(refreshToken: string) {
    const logoutResult = await this.authService.logout(refreshToken);
    if (logoutResult.isErr()) {
      return logoutResult.error instanceof TokenInvalidError
        ? new Err(logoutResult.error)
        : new Err(new InternalError());
    }

    return new Ok(undefined);
  }

  async register(
    email: string,
    password: string,
    name: string,
    surname: string,
    username: string,
    userDevice: UserDeviceDTO,
  ) {
    const usernameExists =
      await this.userService.repo.checkIfUsernameExists(username);
    if (usernameExists)
      return new Err(new UsernameAlreadyExistsError(username));
    const registerResult = await this.authService.register(
      email,
      password,
      name,
      surname,
      userDevice,
    );
    if (registerResult.isErr()) {
      return registerResult.error instanceof AuthMicroServiceError
        ? new Err(new InternalError())
        : new Err(registerResult.error);
    }
    const createResult = await this.userService.create(
      create<UserId>(registerResult.value.userData.id),
      username,
    );
    if (createResult.isErr()) throw new UsernameAlreadyExistsError(username);

    const user = registerResult.value;
    return new Ok({
      ...user,
    });
  }

  async login(email: string, password: string, userDevice: UserDeviceDTO) {
    const loginResult = await this.authService.login(
      email,
      password,
      userDevice,
    );
    if (loginResult.isErr()) {
      return loginResult.error instanceof AuthMicroServiceError
        ? new Err(new InternalError())
        : new Err(loginResult.error);
    }

    return new Ok({
      ...loginResult.value,
    });
  }

  async isUsernameExists(username: string) {
    return await this.userService.repo.checkIfUsernameExists(username);
  }

  async updateUsername(userId: UserId, newUsername: string) {
    const usernameExists =
      await this.userService.repo.checkIfUsernameExists(newUsername);
    if (usernameExists)
      return new Err(new UsernameAlreadyExistsError(newUsername));
    await this.userService.repo.updateUsername(userId, newUsername);
    return new Ok(undefined);
  }

  async createChat(
    userId: UserId,
    chatname: string,
    isPrivate: boolean,
    title: string,
  ) {
    const user = await this.userService.repo.findById(userId);
    if (!user) return new Err(new UserNotFoundError(userId));
    return await this.chatService.create(userId, chatname, isPrivate, title);
  }

  async deleteChatById(userId: UserId, chatId: ChatId) {
    const user = await this.userService.repo.findById(userId);
    if (!user) return new Err(new UserNotFoundError(userId));
    return await this.chatService.deleteById(userId, chatId);
  }

  async deleteChatByChatname(userId: UserId, chatname: string) {
    const user = await this.userService.repo.findById(userId);
    if (!user) return new Err(new UserNotFoundError(userId));
    return await this.chatService.deleteByName(userId, chatname);
  }

  async inviteUserById(actorId: UserId, chatId: ChatId, invitedUserId: UserId) {
    return await this.chatService.inviteById(actorId, chatId, invitedUserId);
  }

  async inviteUserByUsername(
    actorId: UserId,
    chatId: ChatId,
    invitedUsername: string,
  ) {
    const user = await this.userService.repo.findByUsername(invitedUsername);
    if (!user) return new Err(new UserNotFoundError(invitedUsername));
    this.rtcService.sendInvite(actorId, user.id, chatId);
    // TODO: make names consistent: actor, invitee, user, etc.
    return await this.chatService.inviteById(
      actorId,
      chatId,
      create<UserId>(user.id),
    );
  }

  async acceptInvite(userId: UserId, chatId: ChatId) {
    return await this.chatService.acceptInvitation(userId, chatId);
  }

  async declineInvite(userId: UserId, chatId: ChatId) {
    return await this.chatService.declineInvitation(userId, chatId);
  }

  async leaveChat(userId: UserId, chatId: ChatId) {
    return await this.chatService.leaveChat(userId, chatId);
  }

  async kickUserInChat(kickerId: UserId, chatId: ChatId, kickedId: UserId) {
    return await this.chatService.kickUser(kickerId, chatId, kickedId);
  }

  async getUserInvites(userId: UserId) {
    return await this.userService.getInvites(userId);
  }

  async getMessages(
    actorId: UserId,
    chatId: ChatId,
    limit: number,
    offset: number,
  ) {
    return await this.chatService.getMessages(actorId, chatId, limit, offset);
  }

  async sendMessage(
    authorId: UserId,
    chatId: ChatId,
    message: string,
    messageType: MESSAGE_TYPE,
  ) {
    // TODO: Consider situation when users sends malitios messages to the chat he is not in.
    this.rtcService.sendMessage(authorId, chatId, message, messageType);
    return await this.chatService.sendMessage(
      authorId,
      chatId,
      message,
      messageType,
    );
  }

  async connectUser(accessToken: string, socket: RTCSocket) {
    const user = await this.validateAccessToken(accessToken);
    if (user.isErr()) return false;

    this.rtcService.updateUserStatus(
      create<UserId>(user.value.id),
      USER_ONLINE_STATUS.ONLINE,
      socket,
    );

    return true;
  }

  async disconnectUser(accessToken: string, socket: RTCSocket) {
    const user = await this.validateAccessToken(accessToken);
    if (user.isErr()) return;

    this.rtcService.updateUserStatus(
      create<UserId>(user.value.id),
      USER_ONLINE_STATUS.OFFLINE,
      socket,
    );
  }

  async setUserDND(accessToken: string, socket: RTCSocket) {
    const user = await this.validateAccessToken(accessToken);
    if (user.isErr()) return;

    this.rtcService.updateUserStatus(
      create<UserId>(user.value.id),
      USER_ONLINE_STATUS.DND,
      socket,
    );
  }
}

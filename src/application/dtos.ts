import { CHAT_USER_RELATION } from "#domain/model/chat.js";
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { MESSAGE_TYPE } from "@prisma/client";

export const Id = Type.String({
  format: "uuid",
});
export type Id = Static<typeof Id>;

export const GeneralErrorDTO = Type.Object({
  message: Type.String(),
});
export type GeneralErrorDTO = Static<typeof GeneralErrorDTO>;

export const AccessTokenPayloadDTO = Type.Object({
  id: Id,
  email: Type.String(),
});
export type AccessTokenPayloadDTO = Static<typeof AccessTokenPayloadDTO>;

export const UserDeviceDTO = Type.Object({
  ip: Type.String(),
  os: Type.String(),
  browser: Type.String(),
  fingerprint: Type.String(),
});
export type UserDeviceDTO = Static<typeof UserDeviceDTO>;

export const TokenPairDTO = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
});
export type TokenPairDTO = Static<typeof TokenPairDTO>;

export const AuthDTO = Type.Object({
  userData: AccessTokenPayloadDTO,
  tokenPair: TokenPairDTO,
});
export type AuthDTO = Static<typeof AuthDTO>;

const DateTime = Type.Transform(Type.String({ format: "datetime" }))
  .Decode((value) => new Date(value))
  .Encode((value) => value.toISOString());

// TODO: Consider adding a "type" field to ChatMessageDTO
export const ChatMessageDTO = Type.Object({
  id: Id,
  text: Type.String(),
  date: DateTime,
  userId: Id,
  chatId: Id,
  messageType: Type.Enum({ ...MESSAGE_TYPE }),
});
export type ChatMessageDTO = Static<typeof ChatMessageDTO>;

export const ChatMessagesDTO = Type.Array(ChatMessageDTO);
export type ChatMessagesDTO = Static<typeof ChatMessagesDTO>;

export const ChatDTO = Type.Object({
  id: Id,
  chatname: Type.String(),
  title: Type.String(),
  isPrivate: Type.Boolean(),
  adminId: Id,
});
export type ChatDTO = Static<typeof ChatDTO>;

export const ChatsDTO = Type.Array(ChatDTO);
export type ChatsDTO = Static<typeof ChatsDTO>;

export const UserDTO = Type.Object({
  id: Id,
  username: Type.String(),
});
export type UserDTO = Static<typeof UserDTO>;

export const UserInChatDTO = Type.Object({
  id: Id,
  username: Type.String(),
  relation: Type.Enum({ ...CHAT_USER_RELATION }),
});
export type UserInChatDTO = Static<typeof UserInChatDTO>;

export const ChatWithMwssagesUsersDTO = Type.Object({
  id: Id,
  chatname: Type.String(),
  title: Type.String(),
  isPrivate: Type.Boolean(),
  adminId: Id,
  messages: ChatMessagesDTO,
  users: Type.Array(UserInChatDTO),
});
export type ChatWithMwssagesUsersDTO = Static<typeof ChatWithMwssagesUsersDTO>;

export const ChatsWithMwssagesUsersDTO = Type.Array(ChatWithMwssagesUsersDTO);
export type ChatsWithMwssagesUsersDTO = Static<
  typeof ChatsWithMwssagesUsersDTO
>;

export const InviteDTO = Type.Object({
  userId: Id,
  chat: ChatDTO,
  createdAt: DateTime,
});
export type InviteDTO = Static<typeof InviteDTO>;

export const InvitesDTO = Type.Array(InviteDTO);
export type InvitesDTO = Static<typeof InvitesDTO>;

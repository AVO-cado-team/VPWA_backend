import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

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

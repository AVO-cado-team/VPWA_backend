import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

export const GeneralErrorDTO = Type.Object({
  message: Type.String(),
});
export type GeneralErrorDTO = Static<typeof GeneralErrorDTO>;

export const AccessTokenPayloadDTO = Type.Object({
  id: Type.String(),
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

export const ChatMessageDTO = Type.Object({
  id: Type.String(),
  text: Type.String(),
  date: DateTime,
  userId: Type.String(),
  chatId: Type.String(),
});
export type ChatMessageDTO = Static<typeof ChatMessageDTO>;

export const ChatMessagesDTO = Type.Array(ChatMessageDTO);
export type ChatMessagesDTO = Static<typeof ChatMessagesDTO>;

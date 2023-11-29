import {
  ChatMessagesDTO,
  ChatWithMwssagesUsersDTO,
  GeneralErrorDTO,
  Id,
  InviteDTO,
  InvitesDTO,
} from "#application/dtos.js";
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

const CreateChatRequest = Type.Object({
  chatname: Type.String(),
  isPrivate: Type.Boolean(),
  title: Type.String(),
});

export type CreateChatRequestType = Static<typeof CreateChatRequest>;

const joinOrCreate = {
  operationId: "joinOrCreateChat",
  title:
    "Create new chat if not exists or join existing public chat. If chat already exists and is private, then forbidden",
  description: "Create chat",
  body: CreateChatRequest,
  response: {
    200: ChatWithMwssagesUsersDTO,
    400: GeneralErrorDTO,
    403: GeneralErrorDTO,
    "4xx": { GeneralErrorDTO },
    "5xx": { GeneralErrorDTO },
  },
  tags: ["chat"],
};

const IdRequest = Type.Object({
  id: Id,
});
export type IdRequest = Static<typeof IdRequest>;

const ChatnameRequest = Type.Object({
  chatname: Type.String(),
});
export type ChatnameRequest = Static<typeof ChatnameRequest>;

const UsernameRequest = Type.Object({
  username: Type.String(),
});
export type UsernameRequest = Static<typeof UsernameRequest>;

const InviteUserByIdRequest = Type.Object({
  userId: Id,
  chatId: Id,
});
export type InviteUserByIdRequest = Static<typeof InviteUserByIdRequest>;

const InviteUserByUsernameRequest = Type.Object({
  username: Type.String(),
  chatId: Id,
});
export type InviteUserByUsernameRequest = Static<
  typeof InviteUserByUsernameRequest
>;

const InviteActionRequest = Type.Object({
  chatId: Id,
  userId: Id,
});

const deleteChatById = {
  operationId: "deleteChatById",
  title: "Delete chat by id",
  description: "Delete chat by id",
  body: IdRequest,
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat"],
};

const deleteChatByChatname = {
  operationId: "deleteChatByChatname",
  title: "Delete chat by chatname",
  description: "Delete chat by chatname",
  body: ChatnameRequest,
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat"],
};

const inviteUserById = {
  operationId: "inviteUserById",
  title: "Invite user by id",
  description: "Invite user by id",
  body: InviteUserByIdRequest,
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat", "invite"],
};

const inviteUserByUsername = {
  operationId: "inviteUserByUsername",
  title: "Invite user by username",
  description: "Invite user by username",
  body: InviteUserByUsernameRequest,
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat", "invite"],
};

const acceptInvite = {
  operationId: "acceptInvite",
  title: "Accept invite",
  description: "Accept invite",
  body: InviteActionRequest,
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat", "invite"],
};

const declineInvite = {
  operationId: "declineInvite",
  title: "Decline invite",
  description: "Decline invite",
  body: InviteActionRequest,
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat", "invite"],
};

const getInvites = {
  operationId: "getInvites",
  title: "Get invites",
  description: "Get invites",
  response: {
    200: InvitesDTO,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat", "invite"],
};

const getMessagesById = {
  operationId: "getMessagesById",
  title: "Get messages",
  description: "Get messages",
  params: Type.Object({
    chatId: Id,
  }),
  querystring: Type.Object({
    limit: Type.String(),
    offset: Type.String(),
  }),
  response: {
    200: ChatMessagesDTO,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat", "message"],
};

const quitChat = {
  operationId: "quitChat",
  title: "Quit chat",
  description: "Quit chat",
  params: Type.Object({
    chatId: Id,
  }),
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["chat"],
};

export default {
  inviteUserByUsername,
  joinOrCreate,
  deleteChatById,
  inviteUserById,
  deleteChatByChatname,
  acceptInvite,
  declineInvite,
  getInvites,
  getMessagesById,
  quitChat,
};

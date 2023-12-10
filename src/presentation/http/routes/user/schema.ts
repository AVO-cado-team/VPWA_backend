import {
  ChatsWithMwssagesUsersDTO,
  GeneralErrorDTO,
  Id,
  UserDTO,
} from "#application/dtos.js";
import { Type } from "@sinclair/typebox";

const updateUsernameBody = Type.Object({
  username: Type.String(),
});

const updateUsername = {
  operationId: "updateUsername",
  title: "Update username",
  description: "Update username",
  body: updateUsernameBody,
  response: {
    200: GeneralErrorDTO,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["user"],
};

const getChats = {
  operationId: "getChats",
  title: "Get chats",
  description: "Get chats",
  querystring: Type.Object({
    limit: Type.String(),
    offset: Type.String(),
  }),
  response: {
    200: ChatsWithMwssagesUsersDTO,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["user"],
};

const getUserById = {
  operationId: "getUserById",
  title: "Get user by id",
  description: "Get user data by userId id",
  params: Type.Object({
    userId: Id,
  }),
  response: {
    200: UserDTO,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["user"],
};

export default { updateUsername, getChats, getUserById };

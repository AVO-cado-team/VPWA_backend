import {
  ChatsWithMwssagesUsersDTO,
  GeneralErrorDTO,
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

export default { updateUsername, getChats };

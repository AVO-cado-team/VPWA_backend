import { GeneralErrorDTO } from "#application/dtos.js";
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

export default { updateUsername };

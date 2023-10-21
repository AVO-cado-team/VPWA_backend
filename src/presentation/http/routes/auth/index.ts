import { REFRESH_TOKEN, refreshTokenCookieOptions } from "../../utils/utils.js";
import type { TokenPairDTO, UserDeviceDTO } from "#application/dtos.js";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  EmailIsNotVerifiedError,
  TokenInvalidError,
  UserEmailIncorrectError,
  UserPasswordNotValidError,
} from "#model/auth.js";
import { StatusCodes as SC } from "http-status-codes";
import application from "#presentation/context.js";
import type { FastifyPluginAsync } from "fastify";
import handler from "./handler.js";
import schema from "./schema.js";
import { UsernameAlreadyExistsError } from "#domain/model/user.js";
import { InternalError } from "#domain/error.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const fastifyT = fastify.withTypeProvider<TypeBoxTypeProvider>();
  fastifyT.patch(
    "/signIn/google/openID",
    { schema: schema.googleOpenID },
    async (request, reply) => {
      const credential = request.body.credential;
      const userDevice: UserDeviceDTO = {
        ip: request.ip,
        os: request.userAgent?.os.toString() ?? "",
        browser: request.userAgent?.toString() ?? "",
        fingerprint: "",
      };

      const authResult = await application.authGoogleOpenID(
        credential,
        userDevice,
      );

      if (authResult.isErr()) {
        if (authResult.error instanceof EmailIsNotVerifiedError) {
          return await reply
            .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
            .code(SC.UNAUTHORIZED)
            .send({ message: authResult.error.message });
        } else if (authResult.error instanceof TokenInvalidError) {
          return await reply
            .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
            .code(SC.BAD_REQUEST)
            .send({ message: authResult.error.message });
        } else if (authResult.error instanceof InternalError) {
          return await reply
            .code(SC.INTERNAL_SERVER_ERROR)
            .send({ message: authResult.error.message });
        } else {
          throw new Error("Unknown error");
        }
      }

      const user = authResult.value;

      return await reply
        .setCookie(
          REFRESH_TOKEN,
          user.tokenPair.refreshToken,
          refreshTokenCookieOptions,
        )
        .code(SC.OK)
        .send({ accessToken: user.tokenPair.accessToken });
    },
  );
  fastifyT.get(
    "/signIn/google/callback",
    { schema: schema.googleOAuth2 },
    async (request, reply) => {
      const token = await request.server.googleOAuth2
        .getAccessTokenFromAuthorizationCodeFlow(request)
        .catch((err) => {
          if (err?.err?.statusCode === SC.BAD_REQUEST) throw err;
          return undefined;
        });
      if (!token) {
        return await reply
          .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
          .code(SC.UNAUTHORIZED)
          .send({ message: "Invalid url" });
      }

      const googleToken: TokenPairDTO = {
        accessToken: token.token.access_token,
        refreshToken: token.token.refresh_token ?? "",
      };

      const userDevice: UserDeviceDTO = {
        ip: request.ip,
        os: request.userAgent?.os.toString() ?? "",
        browser: request.userAgent?.toString() ?? "",
        fingerprint: "",
      };

      const userResult = await application.authGoogleOAuth2(
        googleToken,
        userDevice,
      );
      if (userResult.isErr()) {
        if (userResult.error instanceof EmailIsNotVerifiedError) {
          return await reply
            .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
            .code(SC.UNAUTHORIZED)
            .send({ message: userResult.error.message });
        } else {
          return await reply
            .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
            .code(SC.INTERNAL_SERVER_ERROR)
            .send({ message: userResult.error.message });
        }
      }
      const user = userResult.value;

      return await reply
        .setCookie(
          REFRESH_TOKEN,
          user.tokenPair.refreshToken,
          refreshTokenCookieOptions,
        )
        .code(SC.OK)
        .send({ accessToken: user.tokenPair.accessToken });
    },
  );
  fastifyT.patch("/token/refresh", {
    handler: handler.tokenRefresh,
    schema: schema.tokenRefresh,
  });
  fastifyT.get("/token/logout", {
    handler: handler.logout,
    schema: schema.logout,
  });
  fastifyT.post(
    "/register",
    { schema: schema.register },
    async (request, reply) => {
      const { email, password, name, surname, username } = request.body;
      const userDevice: UserDeviceDTO = {
        ip: request.ip ?? "",
        os: request.userAgent?.os.toString() ?? "",
        browser: request.userAgent?.toString() ?? "",
        fingerprint: "",
      };
      const result = await application.register(
        email,
        password,
        name,
        surname,
        username,
        userDevice,
      );

      if (result.isErr()) {
        if (
          result.error instanceof UsernameAlreadyExistsError ||
          result.error instanceof EmailIsNotVerifiedError ||
          result.error instanceof UserPasswordNotValidError
        ) {
          return await reply
            .code(SC.BAD_REQUEST)
            .send({ message: result.error.message });
        } else if (result.error instanceof InternalError) {
          return await reply
            .code(SC.INTERNAL_SERVER_ERROR)
            .send({ message: result.error.message });
        } else {
          throw new Error("Unknown error");
        }
      }

      const user = result.value;
      return await reply
        .setCookie(
          REFRESH_TOKEN,
          user.tokenPair.refreshToken,
          refreshTokenCookieOptions,
        )
        .code(SC.OK)
        .send({ accessToken: user.tokenPair.accessToken });
    },
  );
  fastifyT.patch("/login", { schema: schema.login }, async (request, reply) => {
    const { email, password } = request.body;
    const userDevice: UserDeviceDTO = {
      ip: request.ip ?? "",
      os: request.userAgent?.os.toString() ?? "",
      browser: request.userAgent?.toString() ?? "",
      fingerprint: "",
    };
    const result = await application.login(email, password, userDevice);
    if (result.isErr()) {
      if (
        result.error instanceof UserEmailIncorrectError ||
        result.error instanceof UserPasswordNotValidError
      ) {
        return await reply
          .code(SC.UNAUTHORIZED)
          .send({ message: "Invalid credentials" });
      } else if (result.error instanceof InternalError) {
        return await reply
          .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
          .code(SC.INTERNAL_SERVER_ERROR)
          .send({ message: result.error.message });
      } else {
        throw new Error("Unknown error returned from application.login()");
      }
    }
    const user = result.value;
    return await reply
      .setCookie(
        REFRESH_TOKEN,
        user.tokenPair.refreshToken,
        refreshTokenCookieOptions,
      )
      .code(SC.OK)
      .send({ accessToken: user.tokenPair.accessToken });
  });
};

export default authRoutes;

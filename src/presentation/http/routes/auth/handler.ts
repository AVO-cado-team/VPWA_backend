import { REFRESH_TOKEN, refreshTokenCookieOptions } from "../../utils/utils.js";
import type { UserDeviceDTO } from "#application/dtos.js";
import { StatusCodes as SC } from "http-status-codes";
import application from "#presentation/context.js";
import { TokenInvalidError } from "#model/auth.js";
import { InternalError } from "#domain/error.js";
import type { FastifyHandler } from "fastify";

const tokenRefresh: FastifyHandler = async (request, reply) => {
  const cookieRefreshToken = request.cookies[REFRESH_TOKEN];
  if (!cookieRefreshToken)
    return await reply
      .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
      .code(SC.BAD_REQUEST)
      .send({
        message: "Not found in HTTP only",
      });

  const userDevice: UserDeviceDTO = {
    ip: request.ip,
    os: request.userAgent?.os.toString() ?? "",
    browser: request.userAgent?.toString() ?? "",
    fingerprint: "",
  };
  const refreshResult = await application.refreshToken(
    userDevice,
    cookieRefreshToken,
  );
  if (refreshResult.isErr()) {
    if (refreshResult.error instanceof InternalError)
      return await reply
        .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
        .code(SC.INTERNAL_SERVER_ERROR)
        .send({ message: refreshResult.error.message });
    else
      return await reply
        .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
        .code(SC.UNAUTHORIZED)
        .send({ message: refreshResult.error.message });
  }
  const { accessToken, refreshToken } = refreshResult.value;
  return await reply
    .setCookie(REFRESH_TOKEN, refreshToken, refreshTokenCookieOptions)
    .code(SC.OK)
    .send({ accessToken });
};

const logout: FastifyHandler = async (request, reply) => {
  const cookieRefreshToken = request.cookies[REFRESH_TOKEN];
  if (!cookieRefreshToken)
    return await reply
      .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
      .code(SC.BAD_REQUEST)
      .send({ message: "Refresh token is required" });

  const result = await application.logout(cookieRefreshToken);
  if (result.isErr()) {
    if (result.error instanceof InternalError)
      return await reply
        .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
        .code(SC.INTERNAL_SERVER_ERROR)
        .send({ message: result.error.message });
    if (result.error instanceof TokenInvalidError) {
      return await reply
        .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
        .code(SC.UNAUTHORIZED)
        .send({ message: result.error.message });
    }
  }

  return await reply
    .clearCookie(REFRESH_TOKEN, refreshTokenCookieOptions)
    .code(SC.OK)
    .send();
};

export default { tokenRefresh, logout };

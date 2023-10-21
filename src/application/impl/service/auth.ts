import { createChannel, createClient, waitForChannelReady } from "nice-grpc";
import type { TokenPair, UserDevice } from "#model/auth.js";
import type { AuthService } from "#service/auth.js";
import { log } from "#infrastructure/log.js";
import { Err, Ok } from "ts-results-es";
import env from "#config/env.js";
import {
  AuthMicroServiceError,
  EmailIsNotVerifiedError,
  TokenInvalidError,
  UnknownErrorTypeError,
  UserAlreadyExistsError,
  UserEmailIncorrectError,
  UserPasswordIncorrectError,
  UserPasswordNotValidError,
} from "#model/auth.js";
import type {
  AuthClient,
  LocalAuthClient,
} from "#infrastructure/authMicroServiceGRPC.js";
import {
  AuthDefinition,
  LocalAuthDefinition,
} from "#infrastructure/authMicroServiceGRPC.js";
const channel = createChannel(`${env.AUTH_MS_HOST}:${env.AUTH_MS_PORT}`);
const connectionTimeout = 6000;
await waitForChannelReady(channel, new Date(Date.now() + connectionTimeout));
log.system("Connected to Authentication Service");

export class AuthServiceImpl implements AuthService {
  authClient: AuthClient;
  localAuthProvider: LocalAuthClient;
  constructor() {
    this.authClient = createClient(AuthDefinition, channel);
    this.localAuthProvider = createClient(LocalAuthDefinition, channel);
  }

  async authGoogleOpenID(credential: string, userDevice: UserDevice) {
    try {
      const result = await this.authClient.authGoogleOpenID({
        credential,
        userDevice,
      });

      if (result.result?.$case === "error") {
        if (result.result.error.result?.$case === "emailIsNotVerifiedError") {
          return new Err(new EmailIsNotVerifiedError());
        } else if (result.result.error.result?.$case === "internalError") {
          return new Err(new AuthMicroServiceError("Error during authGoogle"));
        } else if (result.result.error.result?.$case === "emptyArgumentError") {
          log.warn(
            result.result.error.result.emptyArgumentError,
            "Arguments weren't passed to AuthClient.exchangeRefreshToken()",
          );
          return new Err(new AuthMicroServiceError());
        } else if (result.result.error.result?.$case === "openIDTokenError") {
          return new Err(
            new TokenInvalidError(
              result.result.error.result?.openIDTokenError.message,
            ),
          );
        } else {
          throw new UnknownErrorTypeError("Auth", "authGoogle");
        }
      }

      const ok = result.result?.ok;
      if (!ok?.userData || !ok.tokenPair)
        throw new Error(
          "Auth microservice returned empty reply. " + JSON.stringify(result),
        );

      return new Ok({
        userData: { ...ok.userData },
        tokenPair: { ...ok.tokenPair },
      });
    } catch (error: unknown) {
      log.error(
        error,
        "External service paniced on rpc AuthClient.authGoogleOpenID()",
      );
      return new Err(
        new AuthMicroServiceError("Unexpected error during authGoogleOpenID"),
      );
    }
  }

  async authGoogleOAuth2(googleToken: TokenPair, userDevice: UserDevice) {
    try {
      const result = await this.authClient.authGoogleOAuth2({
        googleToken,
        userDevice,
      });

      if (result.result?.$case === "error") {
        if (result.result.error.result?.$case === "emailIsNotVerifiedError") {
          return new Err(new EmailIsNotVerifiedError());
        } else if (
          result.result.error.result?.$case ===
            "externalProviderUnavailableError" ||
          result.result.error.result?.$case === "internalError"
        ) {
          return new Err(new AuthMicroServiceError("Error during authGoogle"));
        } else if (result.result.error.result?.$case === "emptyArgumentError") {
          log.warn(
            result.result.error.result.emptyArgumentError,
            "Arguments weren't passed to AuthClient.exchangeRefreshToken()",
          );
          return new Err(new AuthMicroServiceError("Internal error"));
        } else {
          throw new UnknownErrorTypeError("Auth", "authGoogle");
        }
      } else {
        const ok = result.result?.ok;
        if (!ok?.userData || !ok.tokenPair)
          throw new Error(
            "Auth microservice returned empty reply. " + JSON.stringify(result),
          );

        return new Ok({
          userData: { ...ok.userData },
          tokenPair: { ...ok.tokenPair },
        });
      }
    } catch (error: unknown) {
      log.error(
        error,
        "External service paniced on rpc AuthClient.authGoogle()",
      );
      return new Err(new AuthMicroServiceError("Error during authGoogle"));
    }
  }

  async exchangeRefreshToken(userDevice: UserDevice, refreshToken: string) {
    try {
      const result = await this.authClient.exchangeRefreshToken({
        refreshToken,
        userDevice,
      });

      if (result.result?.$case === "error") {
        if (result.result.error.result?.$case === "tokenIsInvalidError") {
          return new Err(new TokenInvalidError("Refresh token is invalid"));
        } else if (
          result.result.error.result?.$case === "sessionNotExistsError"
        ) {
          return new Err(new AuthMicroServiceError(""));
        } else if (result.result.error.result?.$case === "emptyArgumentError") {
          log.error(
            result.result.error.result.emptyArgumentError,
            "Seems like you forgot to pass some argument to AuthClient.exchangeRefreshToken()",
          );
          return new Err(new AuthMicroServiceError("Internal error"));
        } else {
          throw new UnknownErrorTypeError("Auth", "exchangeRefreshToken");
        }
      }

      const ok = result.result?.ok;
      if (!ok)
        throw new Error(
          "Auth microservice returned empty reply. " + JSON.stringify(result),
        );

      return new Ok({
        refreshToken: ok.refreshToken,
        accessToken: ok.accessToken,
      });
    } catch (error: unknown) {
      // TODO: add logic to reconnect to auth microservice on such panics
      log.error(
        error,
        "External service paniced on rpc AuthClient.exchangeRefreshToken()",
      );
      return new Err(
        new AuthMicroServiceError("Unexpected error throwed during authGoogle"),
      );
    }
  }

  async validateAccessToken(accessToken: string) {
    try {
      const result = await this.authClient.validateAccessToken({ accessToken });
      if (result.result?.$case === "error") {
        if (result.result.error.result?.$case === "tokenIsInvalidError") {
          return new Err(new TokenInvalidError("Access token is invalid"));
        } else {
          throw new UnknownErrorTypeError("Auth", "validateAccessToken");
        }
      }
      const ok = result.result?.ok;
      if (!ok)
        throw new Error(
          "Auth microservice returned empty reply. " + JSON.stringify(result),
        );

      return new Ok({
        id: ok.id,
        email: ok.email,
      });
    } catch (error: unknown) {
      log.error(
        error,
        "External service paniced on rpc AuthClient.validateAccessToken()",
      );
      return new Err(
        new AuthMicroServiceError(
          "Unexpected error during validateAccessToken",
        ),
      );
    }
  }

  async logout(refreshToken: string) {
    try {
      const result = await this.authClient.logout({ refreshToken });
      if (result.result?.$case === "error") {
        if (result.result.error.result?.$case === "tokenIsInvalidError") {
          return new Err(new TokenInvalidError("Refresh token is invalid"));
        } else if (
          result.result.error.result?.$case === "sessionNotExistsError"
        ) {
          log.warn(
            result.result.error.result.sessionNotExistsError,
            "Session not found during logout. Possible origins are: 1) Cookies weren't removed from the HTTP connection. 2) Microservice didn't delete it from database.",
          );
          return new Err(new TokenInvalidError("Session not found"));
        } else {
          throw new UnknownErrorTypeError("Auth", "logout");
        }
      }
      return new Ok(undefined);
    } catch (error: unknown) {
      log.error(error, "External service paniced on rpc AuthClient.logout()");
      return new Err(
        new AuthMicroServiceError("Unexpected error during logout"),
      );
    }
  }

  async register(
    email: string,
    password: string,
    name: string,
    surname: string,
    userDevice: UserDevice,
  ) {
    const result = await this.localAuthProvider.register({
      email,
      password,
      name,
      surname,
      userDevice,
    });
    if (result.result?.$case === "error") {
      switch (result.result.error.result?.$case) {
        case "emailDoesNotExistError":
          return new Err(
            new UserEmailIncorrectError(
              result.result.error.result.emailDoesNotExistError.message,
            ),
          );
        case "passportIsNotValidError":
          return new Err(
            new UserPasswordNotValidError(
              result.result.error.result.passportIsNotValidError.message,
            ),
          );
        case "emailAlreadyExistsError":
          return new Err(new UserAlreadyExistsError());
        case "emptyArgumentError":
          log.warn(
            result.result.error.result.emptyArgumentError,
            "Arguments weren't passed to AuthClient.register()",
          );
          return new Err(new AuthMicroServiceError("Internal error"));
        default:
          throw new UnknownErrorTypeError("Auth", "register");
      }
    }
    const ok = result.result?.ok;
    if (!ok?.tokenPair || !ok.userData)
      throw new Error(
        "Auth microservice returned empty reply. " + JSON.stringify(result),
      );

    return new Ok({
      tokenPair: { ...ok.tokenPair },
      userData: { ...ok.userData },
    });
  }

  async login(email: string, password: string, userDevice: UserDevice) {
    const result = await this.localAuthProvider.login({
      email,
      password,
      userDevice,
    });
    if (result.result?.$case === "error") {
      switch (result.result.error.result?.$case) {
        case "emailDoesNotExistError":
          return new Err(
            new UserEmailIncorrectError(
              result.result.error.result.emailDoesNotExistError.message,
            ),
          );
        case "userPasswordIsIncorrectError":
          return new Err(new UserPasswordIncorrectError());
        case "emptyArgumentError":
          log.warn(
            result.result.error.result.emptyArgumentError,
            "Arguments weren't passed to AuthClient.login()",
          );
          return new Err(new AuthMicroServiceError("Internal error"));
        default:
          throw new UnknownErrorTypeError("Auth", "login");
      }
    }
    const ok = result.result?.ok;
    if (!ok?.tokenPair || !ok.userData)
      throw new Error(
        "Auth microservice returned empty reply. " + JSON.stringify(result),
      );

    return new Ok({
      tokenPair: { ...ok.tokenPair },
      userData: { ...ok.userData },
    });
  }
}

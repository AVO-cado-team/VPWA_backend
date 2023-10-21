import type { Result } from "ts-results-es";
import type {
  AccessTokenPayload,
  AuthMicroServiceError,
  AuthResponse,
  EmailIsNotVerifiedError,
  GoogleAuthError,
  TokenInvalidError,
  TokenPair,
  UserAlreadyExistsError,
  UserDevice,
  UserEmailIncorrectError,
  UserPasswordIncorrectError,
  UserPasswordNotValidError,
} from "#model/auth.js";

export interface AuthService {
  authGoogleOpenID(
    credential: string,
    userDevice: UserDevice,
  ): Promise<
    Result<
      AuthResponse,
      AuthMicroServiceError | EmailIsNotVerifiedError | TokenInvalidError
    >
  >;
  authGoogleOAuth2(
    googleToken: TokenPair,
    userDevice: UserDevice,
  ): Promise<
    Result<
      AuthResponse,
      AuthMicroServiceError | GoogleAuthError | EmailIsNotVerifiedError
    >
  >;
  exchangeRefreshToken(
    userDevice: UserDevice,
    refreshToken: string,
  ): Promise<Result<TokenPair, AuthMicroServiceError | TokenInvalidError>>;
  validateAccessToken(
    accessToken: string,
  ): Promise<
    Result<AccessTokenPayload, AuthMicroServiceError | TokenInvalidError>
  >;
  logout(
    refreshToken: string,
  ): Promise<Result<void, AuthMicroServiceError | TokenInvalidError>>;
  register(
    email: string,
    password: string,
    name: string,
    surname: string,
    userDevice: UserDevice,
  ): Promise<
    Result<
      AuthResponse,
      | AuthMicroServiceError
      | UserEmailIncorrectError
      | UserAlreadyExistsError
      | UserPasswordNotValidError
    >
  >;
  login(
    email: string,
    password: string,
    userDevice: UserDevice,
  ): Promise<
    Result<
      AuthResponse,
      | AuthMicroServiceError
      | UserEmailIncorrectError
      | UserPasswordIncorrectError
    >
  >;
}

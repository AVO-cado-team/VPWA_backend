export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AccessTokenPayload = {
  id: string;
  email: string;
};

export type AuthResponse = {
  tokenPair: TokenPair;
  userData: AccessTokenPayload;
};

export type UserAgent = {
  family: string;
  major: string;
  minor: string;
  patch: string;
  source: string;
};

export type UserDevice = {
  ip: string;
  os: string;
  browser: string;
  fingerprint: string;
};

export class GoogleAuthError extends Error {
  googleAuthError = true as const;
}

// TODO: export type TokenType = "Access" | "Refresh";

export class TokenInvalidError extends Error {
  tokenInvalidError = true as const;
  constructor(message: string) {
    super("You token is invalid. " + message);
  }
}

export class AuthMicroServiceError extends Error {
  authMicroServiceError = true as const;
}

export class EmailIsNotVerifiedError extends Error {
  emailIsNotVerifiedError = true as const;
  constructor() {
    super("Your email is not verified.");
  }
}

export class UnknownErrorTypeError extends Error {
  unknownErrorType = true as const;
  constructor(microserviceName: string, procedureName: string) {
    super(
      microserviceName +
        " Microservice: Unknown error type during rpc " +
        procedureName,
    );
  }
}

export class InvalidCredentialsError extends Error {
  invalidCredentialsError = true as const;
}

export class EmailDoesNotExistError extends InvalidCredentialsError {
  emailDosNotExistError = true as const;
  constructor() {
    super("User does not exist");
  }
}

export class UserPasswordIncorrectError extends InvalidCredentialsError {
  userPasswordIncorrectError = true as const;
  constructor() {
    super("Password is incorrect");
  }
}

export class UserEmailIncorrectError extends Error {
  userEmailIncorrectError = true as const;
  constructor(reason: string) {
    super("Email is not valid. " + reason);
  }
}

export class UserPasswordNotValidError extends Error {
  passwordNotValid = true as const;
}

export class UserAlreadyExistsError extends Error {
  userAlreadyExistsError = true as const;
  constructor() {
    super("User already exists with this email");
  }
}

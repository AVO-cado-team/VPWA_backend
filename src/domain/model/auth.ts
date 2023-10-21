export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  tokenPair: TokenPair;
  userData: AccessTokenPayload;
};

export type AccessTokenPayload = {
  id: string;
  email: string;
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
  googleAuthError: true = true;
  constructor(message: string) {
    super(message);
  }
}

// TODO: export type TokenType = "Access" | "Refresh";

export class TokenInvalidError extends Error {
  tokenInvalidError: true = true;
  constructor(message: string) {
    super("You token is invalid. " + message);
  }
}

export class AuthMicroServiceError extends Error {
  authMicroServiceError: true = true;
  constructor(message?: string) {
    super(message);
  }
}

export class EmailIsNotVerifiedError extends Error {
  emailIsNotVerifiedError: true = true;
  constructor() {
    super("Your email is not verified.");
  }
}

export class UnknownErrorTypeError extends Error {
  unknownErrorType: true = true;
  constructor(microserviceName: string, procedureName: string) {
    super(
      microserviceName +
        " Microservice: Unknown error type during rpc " +
        procedureName,
    );
  }
}

export class InvalidCredentialsError extends Error {
  invalidCredentialsError: true = true;
  constructor(message: string) {
    super(message);
  }
}

export class EmailDoesNotExistError extends InvalidCredentialsError {
  emailDosNotExistError: true = true;
  constructor() {
    super("User does not exist");
  }
}

export class UserPasswordIncorrectError extends InvalidCredentialsError {
  userPasswordIncorrectError: true = true;
  constructor() {
    super("Password is incorrect");
  }
}

export class UserEmailIncorrectError extends Error {
  userEmailIncorrectError: true = true;
  constructor(reason: string) {
    super("Email is not valid. " + reason);
  }
}

export class UserPasswordNotValidError extends Error {
  passwordNotValid: true = true;
  constructor(message: string) {
    super(message);
  }
}

export class UserAlreadyExistsError extends Error {
  userAlreadyExistsError: true = true;
  constructor() {
    super("User already exists with this email");
  }
}

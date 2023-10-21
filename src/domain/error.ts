export class InternalError extends Error {
  internalError: true;
  constructor(message = "Internal error") {
    super(message);
    this.internalError = true;
  }
}

export class ExternalServiceError extends Error {
  name: "ExternalServiceError";
  constructor(message: string, microserviceName = "Unknown") {
    super(message + " in " + microserviceName);
    this.name = "ExternalServiceError";
  }
}

export class MicroserviceError extends Error {
  name: "MicroserviceError";
  constructor(message: string, microserviceName = "Unknown") {
    super(message + " in " + microserviceName);
    this.name = "MicroserviceError";
  }
}

export class UserError {
  userMessage: string;
  constructor(userMessage: string) {
    this.userMessage = userMessage;
  }
}

export class UserErrorInternal {
  userMessage: string;
  constructor() {
    this.userMessage =
      "Something went wrong on the server, please try again later, we are working on it.";
  }
}

export class UserErrorArgument extends UserError {
  constructor(message: string) {
    super("Argument error: " + message);
  }
}

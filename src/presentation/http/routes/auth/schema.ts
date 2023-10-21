import { Type } from "@sinclair/typebox";

const GeneralErrorDTO = Type.Object({
  message: Type.String(),
});

const AuthResponse = Type.Object({
  accessToken: Type.String(),
});

const RegisterRequest = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
  name: Type.String(),
  surname: Type.String(),
  username: Type.String(),
});

const LoginRequest = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
});

const OpenIDCredential = Type.Object({
  credential: Type.String(),
});

const googleOAuth2 = {
  operationId: "googleAuth",
  title: "Google Auth",
  description:
    "Auth with Google. If user auth for the first time he/she will get random username.",
  response: {
    200: AuthResponse,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["auth"],
};

const googleOpenID = {
  operationId: "googleOpenID",
  title: "Authenticate Google OpenID",
  description: "Authenticate with Google OpenID",
  body: OpenIDCredential,
  response: {
    200: AuthResponse,
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["auth"],
};

const tokenRefresh = {
  operationId: "refreshTokens",
  title: "Refresh token",
  description: "Refresh token.",
  response: {
    200: { AuthResponse },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["auth"],
};

const logout = {
  operationId: "logout",
  title: "Logout",
  description: "Logout from app",
  response: {
    200: { type: "null" },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["auth"],
};

const register = {
  operationId: "register",
  title: "Register",
  description: "Register new user",
  body: RegisterRequest,
  response: {
    200: { AuthResponse },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["auth"],
};

const login = {
  operationId: "login",
  title: "Login",
  description:
    "Login with username and password if user was registered manualy instead of using Google Auth",
  body: LoginRequest,
  response: {
    200: { AuthResponse },
    "4xx": GeneralErrorDTO,
    "5xx": GeneralErrorDTO,
  },
  tags: ["auth"],
};

export default {
  googleOpenID,
  register,
  googleOAuth2,
  tokenRefresh,
  logout,
  login,
};

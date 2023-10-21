import type { FastifyOAuth2Options } from "@fastify/oauth2";
import { fastifyOauth2 } from "@fastify/oauth2";
import type { FastifyRequest } from "fastify";
import env from "#config/env.js";

export const oAuth2Options: FastifyOAuth2Options = {
  tags: ["auth", "google", "Sign In"],
  name: "googleOAuth2",
  scope: ["profile", "openid", "email"],
  callbackUriParams: {
    access_type: "offline",
  },
  tokenRequestParams: {
    grantType: "authorization_code",
  },
  credentials: {
    client: {
      id: env.GOOGLE_CLIENT_ID,
      secret: env.GOOGLE_CLIENT_SECRET,
    },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: "/auth/signIn/google",
  callbackUri: `${env.API_HOST}/${env.API_PREFIX}/${env.API_VERSION}/auth/signIn/google/callback`,
  generateStateFunction: (request: FastifyRequest) => {
    const state = request.unsignCookie(request.cookies.state ?? "");
    request.cookies.state = request.signCookie(state.value ?? "");
    return state;
  },
  // custom function to check the state is valid
  checkStateFunction: (request: FastifyRequest, callback: CallableFunction) => {
    callback();
    return;
  },
};

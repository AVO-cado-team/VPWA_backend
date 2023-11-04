import { UserServiceImpl } from "#application/impl/service/user.js";
import { AuthServiceImpl } from "#application/impl/service/auth.js";
import { ChatServiceImpl } from "#application/impl/service/chat.js";

import type { ApplicationService } from "#application/appService.js";
import { Application } from "#application/appServiceImpl.js";

import { userRepo } from "#application/impl/repo/user.js";
import { chatRepo } from "#application/impl/repo/chat.js";
import { RTCServiceImpl } from "#application/impl/service/RTC.js";
import { log } from "#infrastructure/log.js";
import env from "#config/env.js";

const application: ApplicationService = new Application(
  new UserServiceImpl(userRepo),
  new AuthServiceImpl(),
  new ChatServiceImpl(chatRepo),
  new RTCServiceImpl(userRepo),
);

log.system("Application initialized. Enviorment: " + env.ENVIRONMENT);

export default application;

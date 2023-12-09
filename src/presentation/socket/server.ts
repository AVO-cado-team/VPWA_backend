import type { RTCServer, RTCSocket } from "./types.js";
import application from "#presentation/context.js";
import { log } from "#infrastructure/log.js";
import { Server } from "socket.io";
import env from "#config/env.js";

const devOrigins = [
  `http://localhost:9000`,
  `http://localhost:9001`,
  `http://10.62.45.180`,
];
const origins = [`https://${env.APP_HOST}:${env.HTTP_PORT}`].concat(devOrigins);
const socketServer: RTCServer = new Server(env.SOCKET_PORT, {
  allowUpgrades: true,
  cors: {
    origin: origins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
});

socketServer.on("connect", (socket: RTCSocket) => {
  // TODO:: Check async event emitter critic from Mateo Collina
  log.info({
    msg: "Socket is trying to connect with token",
    socketId: socket.id,
  });
  const token = String(socket.handshake.auth.token);
  application.connectUser(token, socket).then(
    (userId) => {
      if (!userId) {
        log.info({
          msg: "Socket is disconnected because of invalid token",
          token,
          socketId: socket.id,
        });
        socket.disconnect();
        return;
      }
      socket.on("changeOnlineStatus", (status) => {
        application.setUserStatus(userId, status);
      });
      socket.on("disconnect", () => {
        application.disconnectUser(userId);
      });
      socket.on("meTyping", ({ text, chatId }) => {
        application.setUserTyping(userId, chatId, text);
      });
      socket.on("error", (err) => {
        log.error(err);
      });
      socket.on("subscribeTyping", (msg) => {
        application.subscribeTyping(userId, msg.authorId, msg.chatId);
      });
    },
    (err) => {
      log.error(err);
      socket.disconnect();
    },
  );
});

log.system(`Socket server started on port ${env.SOCKET_PORT}`);

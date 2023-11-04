import type { RTCServer, RTCSocket } from "./types.js";
import application from "#presentation/context.js";
import { log } from "#infrastructure/log.js";
import { Server } from "socket.io";
import env from "#config/env.js";

const devOrigin = `http://localhost:9000`;
const origins = [`http://${env.APP_HOST}:${env.APP_PORT}`].concat(
  env.ENVIRONMENT === "development" ? [devOrigin] : [],
);
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
  application.connectUser(String(socket.handshake.auth.token), socket).then(
    (isConnected) => {
      if (!isConnected) {
        log.info({
          msg: "Socket is disconnected because of invalid token",
          token: String(socket.handshake.auth.token),
          socketId: socket.id,
        });
        socket.disconnect();
        return;
      }
      socket.on("changeOnlineStatus", () => {
        application
          .setUserDND(String(socket.handshake.auth.token), socket)
          .catch(() => {
            socket.disconnect();
          });
      });
      socket.on("disconnect", () => {
        application
          .disconnectUser(String(socket.handshake.auth.token), socket)
          .catch(() => {
            socket.disconnect();
          });
      });
    },
    (err) => {
      log.error(err);
      socket.disconnect();
    },
  );
});

log.system(`Socket server started on port ${env.SOCKET_PORT}`);

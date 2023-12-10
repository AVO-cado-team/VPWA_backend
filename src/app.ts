import type { Worker } from "node:cluster";
import EventEmitter from "node:events";
import cluster from "node:cluster";

const children: Worker[] = [];
const eventEmitter = new EventEmitter();

export const enum ProcessMessagesType {
  EXITING = "EXITING",
  FORCE_GRACEFUL_SHUTDOWN = "FORCE_GRACEFUL_SHUTDOWN",
}

export type ProcessMessage = {
  status: ProcessMessagesType;
};

const createWorker = () => {
  const worker = cluster.fork();
  children.push(worker);
  worker.on("exit", (message: ProcessMessage) => {
    if (message.status === ProcessMessagesType.EXITING) {
      eventEmitter.emit("restarted");
    }
  });

  return worker;
};

const run = () => {
  console.warn("Start primary process in cluster");
  createWorker();
  eventEmitter.on("restarted", () => {
    createWorker();
  });
};

if (cluster.isPrimary) {
  run();
} else {
  await import("./presentation/index.js");
}

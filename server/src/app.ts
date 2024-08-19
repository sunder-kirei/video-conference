import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import ShortUniqueId from "short-unique-id";
import { Server } from "socket.io";

import { handleConnect, handleCreateRoom, handleJoinRoom } from "./socket";
import { Mapping, SocketEvent, StreamMapping } from "./types";
import logger from "./lib/logger";

export const { randomUUID: uid } = new ShortUniqueId({ length: 5 });

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(cors());

const httpServer = createServer(app);

const mappings: Mapping = {};

const streams: StreamMapping = {};

const io = new Server(httpServer, {
  cors: {},
});

io.on("connection", (socket) => {
  socket.on(SocketEvent.Connect, () => handleConnect(socket));

  socket.on(SocketEvent.CreateRoom, () => {
    handleCreateRoom(socket, false, mappings, streams);
  });

  socket.on(SocketEvent.JoinRoom, (roomID: string) => {
    handleJoinRoom(socket, roomID, false, mappings, streams);
  });
});

httpServer.listen(PORT, () =>
  logger.info(`Server listening on http:/localhost:${PORT}`)
);

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import ShortUniqueId from "short-unique-id";
import { Server } from "socket.io";

import { handleCreateRoom, handleJoinRoom } from "./socket";
import { Codecs, Mapping, Senders, SocketEvent, StreamMapping } from "./types";
import logger from "./lib/logger";

export const { randomUUID: uid } = new ShortUniqueId({ length: 5 });

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(cors());

const httpServer = createServer(app);

const mappings: Mapping = {};

const streams: StreamMapping = {};

const codecs: Codecs = {};

export const senders: Senders = {};

const io = new Server(httpServer, {
  cors: {},
});

io.on("connection", (socket) => {
  socket.on(SocketEvent.Codecs, (codec: RTCRtpCodec[]) => {
    codecs[socket.id] = codec;
  });

  socket.on(SocketEvent.CreateRoom, () => {
    handleCreateRoom(socket, false, mappings, streams, senders, codecs);
  });

  socket.on(SocketEvent.JoinRoom, (roomID: string) => {
    handleJoinRoom(socket, roomID, false, mappings, streams, senders, codecs);
  });
});

httpServer.listen(PORT, () =>
  logger.info(`Server listening on http:/localhost:${PORT}`)
);

import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import ShortUniqueId from "short-unique-id";
import { Server } from "socket.io";
import { google, GoogleApis } from "googleapis";
import crypto from "crypto";
import session from "express-session";

import { handleCreateRoom, handleJoinRoom } from "./socket";
import {
  Codecs,
  Mapping,
  Payload,
  PublicKey,
  Senders,
  SocketEvent,
  StreamMapping,
} from "./types";
import logger from "./lib/logger";
import { GoogleAuth } from "./lib/GoogleAuth";
import routes from "./routes";
import connectToDB from "./lib/connectToDB";
import { verifyJWT } from "./lib/jwt";
import userService from "./service/user.service";

export const { randomUUID: uid } = new ShortUniqueId({ length: 5 });

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(cors());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json());

const httpServer = createServer(app);

declare module "express-session" {
  interface SessionData {
    state: string;
  }
}

const mappings: Mapping = {};
const streams: StreamMapping = {};
const codecs: Codecs = {};
const senders: Senders = {};

const io = new Server(httpServer, {
  cors: {},
});

io.use(async (socket, next) => {
  const accessToken: string = socket.handshake.auth.accessToken;
  const { decoded, expired } = verifyJWT<Payload>(
    accessToken,
    PublicKey.accessToken
  );

  if (!decoded) {
    socket.emit(SocketEvent.InvalidAuth);
    return;
  }
  const user = await userService.findUser({
    _id: decoded.id,
    email: decoded.email,
  });
  // TODO
  // map socket.id to user here
  next();
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

httpServer.listen(PORT, async () => {
  await connectToDB();
  GoogleAuth.init(
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!,
    process.env.REDIRECT_URL!
  );
  routes(app);
  logger.info(`Server listening on http:/localhost:${PORT}`);
});

import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import ShortUniqueId from "short-unique-id";
import { Server } from "socket.io";
import { google, GoogleApis } from "googleapis";
import crypto from "crypto";
import session from "express-session";

import socketService from "./socket/socket.service";
import {
  Codecs,
  Mapping,
  MemDB,
  Payload,
  PublicKey,
  RTCUser,
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
import socket from "./socket";

// TODO add entry in DB and use its id
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

const memDB: MemDB = {
  rooms: {},
  socketInfo: new Map(),
};

const io = new Server(httpServer, {
  cors: {},
});

httpServer.listen(PORT, async () => {
  await connectToDB();
  GoogleAuth.init(
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!,
    process.env.REDIRECT_URL!
  );
  socket(io, memDB);
  routes(app);
  logger.info(`Server listening on http:/localhost:${PORT}`);
});

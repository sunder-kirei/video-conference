import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import { createServer } from "http";
import { readFileSync } from "fs";
import ShortUniqueId from "short-unique-id";
import { Server } from "socket.io";

import path from "path";
import connectToDB from "./lib/connectToDB";
import { GoogleAuth } from "./lib/GoogleAuth";
import logger from "./lib/logger";
import routes from "./routes";
import socket from "./socket";
import { MemDB } from "./types";

// TODO add entry in DB and use its id
export const { randomUUID: uid } = new ShortUniqueId({ length: 5 });

const memDB: MemDB = {
  rooms: {},
  socketInfo: new Map(),
};
dotenv.config();

const PORT = process.env.PORT ?? 8080;
const app = express();

app.use(
  cors({
    origin: `${process.env.FRONTEND_ORIGIN}`,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json());

const httpsServer = createServer(app);

const io = new Server(httpsServer, {
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_ORIGIN,
  },
});

httpsServer.listen(PORT, async () => {
  await connectToDB();
  GoogleAuth.init(
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!,
    process.env.REDIRECT_URL!
  );
  socket(io, memDB);
  routes(app);

  const react = path.join("client", "build");
  app.use(express.static(react));
  app.get("*", function (req, res) {
    res.sendFile("index.html", { root: react });
  });

  logger.info(`Server listening on http://localhost:${PORT}`);
});

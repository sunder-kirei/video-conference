import { Server } from "socket.io";
import { verifyJWT } from "../lib/jwt";
import userService from "../service/user.service";
import { MemDB, Payload, PublicKey, SocketEvent } from "../types";
import socketService from "./socket.service";
import logger from "../lib/logger";

function setup(io: Server, memDB: MemDB) {
  io.use(async (socket, next) => {
    await socketService.handleHandshake(socket, next, memDB);
  });

  io.on("connection", (socket) => {
    logger.info(socket.id);
    
    socket.on(SocketEvent.Codecs, (codecs: RTCRtpCodec[]) => {
      socketService.handleCodecs(socket, codecs, memDB);
    });

    socket.on(SocketEvent.CreateRoom, () => {
      socketService.handleCreateRoom(socket, false, memDB);
    });

    socket.on(SocketEvent.JoinRoom, (roomID: string) => {
      socketService.handleJoinRoom(socket, roomID, false, memDB);
    });
  });
}

export default setup;

import cookie from "cookie";
import { Socket } from "socket.io";

import { ExtendedError } from "socket.io/dist/namespace";
import { uid } from "../app";
import { verifyJWT } from "../lib/jwt";
import logger from "../lib/logger";
import userService from "../service/user.service";
import { MemDB, Payload, PublicKey, SocketEvent } from "../types";
import { ServerRTC } from "./ServerRTC";

function sendACK(socket: Socket, roomID: string, isPolite: boolean) {
  socket.emit(SocketEvent.RoomJoinAck, {
    message: `${socket.id} joined room successfully`,
    roomID,
    isPolite: isPolite,
  });
}

async function handleHandshake(
  socket: Socket,
  next: (err?: ExtendedError) => void,
  memDB: MemDB
) {
  try {
    const cookieString = socket.handshake.headers.cookie;
    if (!cookieString) {
      return;
    }
    const cookies = cookie.parse(cookieString);
    const accessToken: string = cookies.access_token;
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

    if (!user) {
      socket.emit(SocketEvent.InvalidAuth);
      return;
    }
    // map socket.id to user here
    memDB.socketInfo.set(socket.id, {
      user: {
        username: user.username,
        profilePicture: user.profilePicture,
      },
      codecs: [],
    });
    next();
  } catch (err) {
    logger.error(err);
  }
}

function handleCodecs(socket: Socket, codecs: RTCRtpCodec[], memDB: MemDB) {
  const user = memDB.socketInfo.get(socket.id)?.user;
  if (!user) {
    socket.emit(SocketEvent.InvalidAuth);
    socket.disconnect();
    return;
  }
  memDB.socketInfo.set(socket.id, {
    user,
    codecs,
  });
}

function handleCreateRoom(socket: Socket, isPolite: boolean, memDB: MemDB) {
  const roomID = uid();
  memDB.rooms[roomID] = {
    [socket.id]: {
      trackEvents: new Map(),
      rtc: undefined,
    },
  };
  socket.join(roomID);
  new ServerRTC(socket, roomID, memDB);
  sendACK(socket, roomID, isPolite);
  return roomID;
}

function handleJoinRoom(
  socket: Socket,
  roomID: string,
  isPolite: boolean,
  memDB: MemDB
) {
  const foundRoom = Object.keys(memDB.rooms).find((key) => key === roomID);
  if (!foundRoom) {
    socket.emit(SocketEvent.Error, "room already exists");
    return;
  }
  memDB.rooms[roomID][socket.id] = {
    trackEvents: new Map(),
    rtc: undefined,
  };
  socket.join(roomID);
  new ServerRTC(socket, roomID, memDB);
  sendACK(socket, roomID, isPolite);
}

export default {
  handleCodecs,
  handleCreateRoom,
  handleJoinRoom,
  sendACK,
  handleHandshake,
};

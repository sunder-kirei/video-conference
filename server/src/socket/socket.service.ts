import { Socket } from "socket.io";

import {
  Codecs,
  Mapping,
  MemDB,
  Payload,
  PublicKey,
  Senders,
  SocketEvent,
  StreamMapping,
} from "../types";
import { uid } from "../app";
import { ServerRTC } from "./ServerRTC";
import { ExtendedError } from "socket.io/dist/namespace";
import { verifyJWT } from "../lib/jwt";
import userService from "../service/user.service";
import logger from "../lib/logger";

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
      outgoingSenders: {},
      outgoingStreams: new Map(),
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
  memDB.rooms[roomID][socket.id] = {
    outgoingSenders: {},
    outgoingStreams: new Map(),
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

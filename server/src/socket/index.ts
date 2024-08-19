import { Socket } from "socket.io";

import { Codecs, Mapping, Senders, SocketEvent, StreamMapping } from "../types";
import { uid } from "../app";
import { ServerRTC } from "./ServerRTC";

function sendACK(socket: Socket, roomID: string, isPolite: boolean) {
  socket.emit(SocketEvent.RoomJoinAck, {
    message: `${socket.id} joined room successfully`,
    roomID,
    isPolite: isPolite,
  });
}

export function handleCreateRoom(
  socket: Socket,
  isPolite: boolean,
  mappings: Mapping,
  streamMappings: StreamMapping,
  senders: Senders,
  codecs: Codecs
) {
  const roomID = uid();
  new ServerRTC(socket, roomID, mappings, codecs, senders, streamMappings);
  sendACK(socket, roomID, isPolite);
  return roomID;
}

export function handleJoinRoom(
  socket: Socket,
  roomID: string,
  isPolite: boolean,
  mappings: Mapping,
  streamMappings: StreamMapping,
  senders: Senders,
  codecs: Codecs
) {
  new ServerRTC(socket, roomID, mappings, codecs, senders, streamMappings);
  sendACK(socket, roomID, isPolite);
}

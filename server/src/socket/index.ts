import { Socket } from "socket.io";
import wrtc from "@roamhq/wrtc";

import { Mapping, SocketEvent, StreamMapping } from "../types";
import { uid } from "../app";
import { ServerRTC } from "./ServerRTC";

export function handleConnect(socket: Socket) {
  console.log("Socket connected with id - " + socket.id);
}

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
  streamMappings: StreamMapping
) {
  const roomID = uid();
  new ServerRTC(socket, roomID, mappings, streamMappings);
  sendACK(socket, roomID, isPolite);
  return roomID;
}

export function handleJoinRoom(
  socket: Socket,
  roomID: string,
  isPolite: boolean,
  mappings: Mapping,
  streamMappings: StreamMapping
) {
  new ServerRTC(socket, roomID, mappings, streamMappings);
  sendACK(socket, roomID, isPolite);
}

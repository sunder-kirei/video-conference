"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateRoom = handleCreateRoom;
exports.handleJoinRoom = handleJoinRoom;
const types_1 = require("../types");
const app_1 = require("../app");
const ServerRTC_1 = require("./ServerRTC");
function sendACK(socket, roomID, isPolite) {
    socket.emit(types_1.SocketEvent.RoomJoinAck, {
        message: `${socket.id} joined room successfully`,
        roomID,
        isPolite: isPolite,
    });
}
function handleCreateRoom(socket, isPolite, mappings, streamMappings, senders, codecs) {
    const roomID = (0, app_1.uid)();
    new ServerRTC_1.ServerRTC(socket, roomID, mappings, codecs, senders, streamMappings);
    sendACK(socket, roomID, isPolite);
    return roomID;
}
function handleJoinRoom(socket, roomID, isPolite, mappings, streamMappings, senders, codecs) {
    new ServerRTC_1.ServerRTC(socket, roomID, mappings, codecs, senders, streamMappings);
    sendACK(socket, roomID, isPolite);
}

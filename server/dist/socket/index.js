"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnect = handleConnect;
exports.handleCreateRoom = handleCreateRoom;
exports.handleJoinRoom = handleJoinRoom;
const types_1 = require("../types");
const app_1 = require("../app");
const ServerRTC_1 = require("./ServerRTC");
function handleConnect(socket) {
    console.log("Socket connected with id - " + socket.id);
}
function sendACK(socket, roomID, isPolite) {
    socket.emit(types_1.SocketEvent.RoomJoinAck, {
        message: `${socket.id} joined room successfully`,
        roomID,
        isPolite: isPolite,
    });
}
function handleCreateRoom(socket, isPolite, mappings, streamMappings) {
    const roomID = (0, app_1.uid)();
    new ServerRTC_1.ServerRTC(socket, roomID, mappings, streamMappings);
    sendACK(socket, roomID, isPolite);
    return roomID;
}
function handleJoinRoom(socket, roomID, isPolite, mappings, streamMappings) {
    new ServerRTC_1.ServerRTC(socket, roomID, mappings, streamMappings);
    sendACK(socket, roomID, isPolite);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvent = void 0;
var SocketEvent;
(function (SocketEvent) {
    /** Lifecycle Events */
    SocketEvent["Connect"] = "connect";
    SocketEvent["Disconnect"] = "disconnect";
    SocketEvent["Codecs"] = "codecs";
    /** Room Events */
    SocketEvent["JoinRoom"] = "join-room";
    SocketEvent["CreateRoom"] = "create-room";
    /** RTC Events */
    SocketEvent["ICE"] = "rtc-ICE";
    SocketEvent["Offer"] = "rtc-description";
    SocketEvent["RoomJoinAck"] = "room-joined";
})(SocketEvent || (exports.SocketEvent = SocketEvent = {}));

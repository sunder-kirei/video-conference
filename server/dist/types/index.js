"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKey = exports.PrivateKey = exports.SocketEvent = void 0;
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
var PrivateKey;
(function (PrivateKey) {
    PrivateKey["accessToken"] = "ACCESS_TOKEN_PRIVATE";
    PrivateKey["refreshToken"] = "REFRESH_TOKEN_PRIVATE";
})(PrivateKey || (exports.PrivateKey = PrivateKey = {}));
var PublicKey;
(function (PublicKey) {
    PublicKey["accessToken"] = "ACCESS_TOKEN_PUBLIC";
    PublicKey["refreshToken"] = "REFRESH_TOKEN_PUBLIC";
})(PublicKey || (exports.PublicKey = PublicKey = {}));

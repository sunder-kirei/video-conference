"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_1 = __importDefault(require("cookie"));
const app_1 = require("../app");
const jwt_1 = require("../lib/jwt");
const logger_1 = __importDefault(require("../lib/logger"));
const user_service_1 = __importDefault(require("../service/user.service"));
const types_1 = require("../types");
const ServerRTC_1 = require("./ServerRTC");
function sendACK(socket, roomID, isPolite) {
    socket.emit(types_1.SocketEvent.RoomJoinAck, {
        message: `${socket.id} joined room successfully`,
        roomID,
        isPolite: isPolite,
    });
}
function handleHandshake(socket, next, memDB) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cookieString = socket.handshake.headers.cookie;
            if (!cookieString) {
                return;
            }
            const cookies = cookie_1.default.parse(cookieString);
            const accessToken = cookies.access_token;
            const { decoded, expired } = (0, jwt_1.verifyJWT)(accessToken, types_1.PublicKey.accessToken);
            if (!decoded) {
                socket.emit(types_1.SocketEvent.InvalidAuth);
                return;
            }
            const user = yield user_service_1.default.findUser({
                _id: decoded.id,
                email: decoded.email,
            });
            if (!user) {
                socket.emit(types_1.SocketEvent.InvalidAuth);
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
        catch (err) {
            logger_1.default.error(err);
        }
    });
}
function handleCodecs(socket, codecs, memDB) {
    var _a;
    const user = (_a = memDB.socketInfo.get(socket.id)) === null || _a === void 0 ? void 0 : _a.user;
    if (!user) {
        socket.emit(types_1.SocketEvent.InvalidAuth);
        socket.disconnect();
        return;
    }
    memDB.socketInfo.set(socket.id, {
        user,
        codecs,
    });
}
function handleCreateRoom(socket, isPolite, memDB) {
    const roomID = (0, app_1.uid)();
    memDB.rooms[roomID] = {
        [socket.id]: {
            trackEvents: new Map(),
            rtc: undefined,
        },
    };
    socket.join(roomID);
    new ServerRTC_1.ServerRTC(socket, roomID, memDB);
    sendACK(socket, roomID, isPolite);
    return roomID;
}
function handleJoinRoom(socket, roomID, isPolite, memDB) {
    const foundRoom = Object.keys(memDB.rooms).find((key) => key === roomID);
    if (!foundRoom) {
        socket.emit(types_1.SocketEvent.Error, "room already exists");
        return;
    }
    memDB.rooms[roomID][socket.id] = {
        trackEvents: new Map(),
        rtc: undefined,
    };
    socket.join(roomID);
    new ServerRTC_1.ServerRTC(socket, roomID, memDB);
    sendACK(socket, roomID, isPolite);
}
exports.default = {
    handleCodecs,
    handleCreateRoom,
    handleJoinRoom,
    sendACK,
    handleHandshake,
};

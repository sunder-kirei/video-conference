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
const types_1 = require("../types");
const socket_service_1 = __importDefault(require("./socket.service"));
const logger_1 = __importDefault(require("../lib/logger"));
function setup(io, memDB) {
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        yield socket_service_1.default.handleHandshake(socket, next, memDB);
    }));
    io.on("connection", (socket) => {
        logger_1.default.info("connected");
        socket.on(types_1.SocketEvent.Codecs, (codecs) => {
            socket_service_1.default.handleCodecs(socket, codecs, memDB);
        });
        socket.on(types_1.SocketEvent.CreateRoom, () => {
            socket_service_1.default.handleCreateRoom(socket, false, memDB);
        });
        socket.on(types_1.SocketEvent.JoinRoom, (roomID) => {
            socket_service_1.default.handleJoinRoom(socket, roomID, false, memDB);
        });
    });
}
exports.default = setup;

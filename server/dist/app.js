"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.senders = exports.uid = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const short_unique_id_1 = __importDefault(require("short-unique-id"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
const types_1 = require("./types");
const logger_1 = __importDefault(require("./lib/logger"));
exports.uid = new short_unique_id_1.default({ length: 5 }).randomUUID;
dotenv_1.default.config();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
const mappings = {};
const streams = {};
const codecs = {};
exports.senders = {};
const io = new socket_io_1.Server(httpServer, {
    cors: {},
});
io.on("connection", (socket) => {
    socket.on(types_1.SocketEvent.Codecs, (codec) => {
        codecs[socket.id] = codec;
    });
    socket.on(types_1.SocketEvent.CreateRoom, () => {
        (0, socket_1.handleCreateRoom)(socket, false, mappings, streams, exports.senders, codecs);
    });
    socket.on(types_1.SocketEvent.JoinRoom, (roomID) => {
        (0, socket_1.handleJoinRoom)(socket, roomID, false, mappings, streams, exports.senders, codecs);
    });
});
httpServer.listen(PORT, () => logger_1.default.info(`Server listening on http:/localhost:${PORT}`));

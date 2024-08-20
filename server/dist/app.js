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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.uid = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const short_unique_id_1 = __importDefault(require("short-unique-id"));
const express_session_1 = __importDefault(require("express-session"));
const logger_1 = __importDefault(require("./lib/logger"));
const GoogleAuth_1 = require("./lib/GoogleAuth");
const routes_1 = __importDefault(require("./routes"));
const connectToDB_1 = __importDefault(require("./lib/connectToDB"));
exports.uid = new short_unique_id_1.default({ length: 5 }).randomUUID;
dotenv_1.default.config();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, express_session_1.default)({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
}));
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const mappings = {};
const streams = {};
const codecs = {};
const senders = {};
// const io = new Server(httpServer, {
//   cors: {},
// });
// io.on("connection", (socket) => {
//   socket.on(SocketEvent.Codecs, (codec: RTCRtpCodec[]) => {
//     codecs[socket.id] = codec;
//   });
//   socket.on(SocketEvent.CreateRoom, () => {
//     handleCreateRoom(socket, false, mappings, streams, senders, codecs);
//   });
//   socket.on(SocketEvent.JoinRoom, (roomID: string) => {
//     handleJoinRoom(socket, roomID, false, mappings, streams, senders, codecs);
//   });
// });
httpServer.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, connectToDB_1.default)();
    GoogleAuth_1.GoogleAuth.init(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL);
    (0, routes_1.default)(app);
    logger_1.default.info(`Server listening on http:/localhost:${PORT}`);
}));

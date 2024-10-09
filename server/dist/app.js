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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const http_1 = require("http");
const short_unique_id_1 = __importDefault(require("short-unique-id"));
const socket_io_1 = require("socket.io");
const connectToDB_1 = __importDefault(require("./lib/connectToDB"));
const GoogleAuth_1 = require("./lib/GoogleAuth");
const logger_1 = __importDefault(require("./lib/logger"));
const routes_1 = __importDefault(require("./routes"));
const socket_1 = __importDefault(require("./socket"));
// TODO add entry in DB and use its id
exports.uid = new short_unique_id_1.default({ length: 5 }).randomUUID;
const memDB = {
    rooms: {},
    socketInfo: new Map(),
};
dotenv_1.default.config();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 8080;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: `${process.env.FRONTEND_ORIGIN}`,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
}));
app.use(express_1.default.json());
const httpsServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpsServer, {
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_ORIGIN,
    },
});
httpsServer.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, connectToDB_1.default)();
    GoogleAuth_1.GoogleAuth.init(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL);
    (0, socket_1.default)(io, memDB);
    (0, routes_1.default)(app);
    // const react = path.join("client", "build");
    // app.use(express.static(react));
    // app.get("*", function (req, res) {
    //   res.sendFile("index.html", { root: react });
    // });
    logger_1.default.info(`Server listening on http://localhost:${PORT}`);
}));

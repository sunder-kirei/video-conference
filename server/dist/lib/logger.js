"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const dayjs_1 = __importDefault(require("dayjs"));
const transports = {
    targets: [
        {
            target: "pino/file",
            options: {
                destination: `${process.cwd()}/logs/${(0, dayjs_1.default)().format("DD-MM-YYYY")}.log`,
                mkdir: true,
            },
        },
        {
            target: "pino-pretty",
            options: { destination: 1 },
        },
    ],
};
const logger = (0, pino_1.default)({
    transport: transports,
    timestamp: () => `,"time":"${(0, dayjs_1.default)().format()}"`,
});
exports.default = logger;

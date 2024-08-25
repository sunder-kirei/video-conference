"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJWT = signJWT;
exports.verifyJWT = verifyJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
function signJWT(payload, keyType) {
    const key = process.env[keyType];
    const ttl = keyType === types_1.PrivateKey.accessToken
        ? process.env.ACCESS_TOKEN_TTL
        : process.env.REFRESH_TOKEN_TTL;
    return jsonwebtoken_1.default.sign(payload, key, { expiresIn: ttl });
}
function verifyJWT(token, keyType) {
    const key = process.env[keyType];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, key);
        return {
            expired: false,
            decoded: decoded,
        };
    }
    catch (err) {
        return {
            expired: err.message === "jwt expired",
            decoded: null,
        };
    }
}

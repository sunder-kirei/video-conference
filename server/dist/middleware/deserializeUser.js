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
exports.deserializeUser = deserializeUser;
const jwt_1 = require("../lib/jwt");
const auth_service_1 = __importDefault(require("../service/auth.service"));
const user_service_1 = __importDefault(require("../service/user.service"));
const types_1 = require("../types");
function deserializeUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = req.cookies.access_token;
        const refreshToken = req.cookies.refresh_token;
        if (!accessToken) {
            res.status(403).send();
            return;
        }
        const { decoded, expired } = (0, jwt_1.verifyJWT)(accessToken, types_1.PublicKey.accessToken);
        if (expired && !refreshToken) {
            res.status(401).send();
            return;
        }
        if (expired && refreshToken) {
            const newAccessToken = yield auth_service_1.default.reIssueAccessToken(refreshToken);
            if (!newAccessToken) {
                res.status(403).send();
                return;
            }
            auth_service_1.default.attachCookies(res, newAccessToken, refreshToken);
        }
        if (!decoded) {
            res.status(403).send();
            return;
        }
        res.locals.user = yield user_service_1.default.findUser({
            _id: decoded.id,
            email: decoded.email,
        });
        next();
    });
}

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
const GoogleAuth_1 = require("../lib/GoogleAuth");
const auth_service_1 = __importDefault(require("../service/auth.service"));
const user_service_1 = __importDefault(require("../service/user.service"));
function googleAuthInit(req, res, next) {
    GoogleAuth_1.GoogleAuth.Instance.auth(req, res);
}
function googleAuthCallback(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { accessToken, callbackURL, refreshToken } = yield auth_service_1.default.googleCallbackHandler(req, res);
        auth_service_1.default.attachCookies(res, accessToken, refreshToken);
        res.redirect(callbackURL);
        return;
    });
}
function emailSignUp(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password, username } = req.body;
        const user = yield user_service_1.default.createUser({ email, username, password });
        if (!user) {
            res.status(409).send();
            return;
        }
        const { accessToken, refreshToken } = yield auth_service_1.default.genTokenPair(user.id, user.email);
        auth_service_1.default.attachCookies(res, accessToken, refreshToken);
        res.status(201).send({ message: "USER CREATED" });
    });
}
function emailSignIn(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { statusCode, accessToken, refreshToken } = yield auth_service_1.default.signInHandler(req.body);
        if (statusCode != 200) {
            res.status(statusCode).send();
            return;
        }
        auth_service_1.default.attachCookies(res, accessToken, refreshToken);
        res.status(200).send({ message: "OK" });
    });
}
exports.default = {
    googleAuthInit,
    googleAuthCallback,
    emailSignIn,
    emailSignUp,
};

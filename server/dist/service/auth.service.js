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
const jwt_1 = require("../lib/jwt");
const types_1 = require("../types");
const user_service_1 = __importDefault(require("./user.service"));
function reIssueAccessToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const { decoded } = (0, jwt_1.verifyJWT)(refreshToken, types_1.PublicKey.refreshToken);
        if (!decoded)
            return null;
        const accessToken = (0, jwt_1.signJWT)({
            id: decoded.id,
            email: decoded.email,
        }, types_1.PrivateKey.accessToken);
        return accessToken;
    });
}
function genTokenPair(id, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = (0, jwt_1.signJWT)({ id, email }, types_1.PrivateKey.accessToken);
        const refreshToken = (0, jwt_1.signJWT)({ id, email }, types_1.PrivateKey.refreshToken);
        return { accessToken, refreshToken };
    });
}
function googleCallbackHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = yield GoogleAuth_1.GoogleAuth.Instance.handleCallback(req, res);
        const profile = yield GoogleAuth_1.GoogleAuth.Instance.fetchProfile(tokens);
        let accessToken = "";
        let refreshToken = "";
        const foundUser = yield user_service_1.default.findUser({ email: profile.email });
        if (foundUser) {
            if (!foundUser.profilePicture) {
                foundUser.profilePicture = profile.picture;
                yield foundUser.save();
            }
            const tokens = yield genTokenPair(foundUser._id.toString(), profile.email);
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
        }
        else {
            const createdUser = yield user_service_1.default.createUser({
                email: profile.email,
                username: profile.name,
                profilePicture: profile.picture,
            });
            const tokens = yield genTokenPair(createdUser.id, profile.email);
            accessToken = tokens.accessToken;
            refreshToken = tokens.refreshToken;
        }
        return { accessToken, refreshToken };
    });
}
function signInHandler(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = input;
        const foundUser = yield user_service_1.default.findUser({ email });
        if (!foundUser) {
            return { statusCode: 404 };
        }
        const isValid = yield foundUser.comparePassword(password);
        if (!isValid) {
            return { statusCode: 403 };
        }
        const { accessToken, refreshToken } = yield genTokenPair(foundUser.id, foundUser.email);
        return {
            statusCode: 200,
            accessToken,
            refreshToken,
        };
    });
}
exports.default = {
    reIssueAccessToken,
    googleCallbackHandler,
    genTokenPair,
    signInHandler,
};

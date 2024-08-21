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
exports.GoogleAuth = void 0;
const googleapis_1 = require("googleapis");
const logger_1 = __importDefault(require("./logger"));
class GoogleAuth {
    constructor(clientID, clientSecret, redirectURL, scope = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ]) {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(clientID, clientSecret, redirectURL);
        this.scope = scope;
    }
    auth(req, res) {
        const state = req.query.callback;
        // const state = crypto.randomBytes(32).toString("hex");
        req.session.state = state;
        const authURL = this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: this.scope,
            include_granted_scopes: true,
            state: state,
        });
        res.redirect(authURL);
    }
    handleCallback(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { code, state } = req.query;
            if (state !== req.session.state) {
                throw "State mismatch, possible CSRF attack.";
            }
            else {
                const { tokens } = yield this.oauth2Client.getToken(code);
                return { tokens, state };
            }
        });
    }
    fetchProfile(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`;
            const profile = yield (yield fetch(url)).json();
            return profile;
        });
    }
    static init(clientID, clientSecret, redirectURL) {
        if (this._instance)
            logger_1.default.warn("GoogleAuth reinitialized!");
        this._instance = new GoogleAuth(clientID, clientSecret, redirectURL);
    }
    static get Instance() {
        if (!this._instance)
            throw "GoogleAuth not initialized, try after calling init().";
        return this._instance;
    }
}
exports.GoogleAuth = GoogleAuth;

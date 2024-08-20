"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = __importDefault(require("./controller/auth.controller"));
const auth_schema_1 = __importDefault(require("./schema/auth.schema"));
const user_schema_1 = __importDefault(require("./schema/user.schema"));
const validate_1 = __importDefault(require("./middleware/validate"));
const logger_1 = __importDefault(require("./lib/logger"));
const deserializeUser_1 = require("./middleware/deserializeUser");
function routes(app) {
    app.get("/api/auth/google/oauth2callback", (0, validate_1.default)(auth_schema_1.default.googleAuthResponse), auth_controller_1.default.googleAuthCallback);
    app.get("/api/auth/google", auth_controller_1.default.googleAuthInit);
    app.post("/api/auth/email/signup", (0, validate_1.default)(user_schema_1.default.createUserSchema), auth_controller_1.default.emailSignUp);
    app.post("/api/auth/email/signin", (0, validate_1.default)(auth_schema_1.default.loginUserSchema), auth_controller_1.default.emailSignIn);
    app.get("/api/healthcheck", (req, res, next) => {
        res.status(200);
        res.json("ok");
    });
    app.get("/api/test", deserializeUser_1.deserializeUser, (req, res, next) => {
        const { id, email, password, username, profilePicture } = res.locals.user;
        res.send({
            id,
            email,
            password,
            username,
            profilePicture,
        });
    });
    app.use((err, req, res, next) => {
        logger_1.default.error(err);
        next();
    });
}
exports.default = routes;

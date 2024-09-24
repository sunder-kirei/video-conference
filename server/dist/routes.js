"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = __importDefault(require("./controller/auth.controller"));
const user_controller_1 = __importDefault(require("./controller/user.controller"));
const logger_1 = __importDefault(require("./lib/logger"));
const deserializeUser_1 = require("./middleware/deserializeUser");
const validate_1 = __importDefault(require("./middleware/validate"));
const auth_schema_1 = __importDefault(require("./schema/auth.schema"));
const user_schema_1 = __importDefault(require("./schema/user.schema"));
function routes(app) {
    app.get("/api/auth/google/oauth2callback", (0, validate_1.default)(auth_schema_1.default.googleAuthResponse), auth_controller_1.default.googleAuthCallback);
    app.get("/api/auth/google", (0, validate_1.default)(auth_schema_1.default.googleAuthRequest), auth_controller_1.default.googleAuthInit);
    app.post("/api/auth/email/signup", (0, validate_1.default)(user_schema_1.default.createUserSchema), auth_controller_1.default.emailSignUp);
    app.post("/api/auth/email/signin", (0, validate_1.default)(auth_schema_1.default.loginUserSchema), auth_controller_1.default.emailSignIn);
    app.get("/api/user", deserializeUser_1.deserializeUser, user_controller_1.default.getUserDetails);
    app.get("/api/healthcheck", (req, res, next) => {
        res.status(200);
        res.json("ok");
    });
    app.use((err, req, res, next) => {
        logger_1.default.error(err);
        next();
    });
}
exports.default = routes;

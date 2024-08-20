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
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("config"));
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    profilePicture: {
        type: String,
    },
}, {
    timestamps: true,
    methods: {
        comparePassword(candidate) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                return bcrypt_1.default
                    .compare(candidate, (_a = this.password) !== null && _a !== void 0 ? _a : "")
                    .catch((reason) => false);
            });
        },
    },
});
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!this.isModified("password"))
            return next();
        const salt = yield bcrypt_1.default.genSalt(config_1.default.get("bcrypt.saltFactor"));
        const hash = yield bcrypt_1.default.hashSync((_a = this.password) !== null && _a !== void 0 ? _a : "", salt);
        this.password = hash;
        return next();
    });
});
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const loginUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({ required_error: "Email is required." })
            .email("Not a valid email."),
        password: zod_1.z
            .string({
            required_error: "Password is required.",
        })
            .min(6, "Not a valid password."),
    }),
});
const googleAuthResponse = zod_1.z.object({
    query: zod_1.z.object({
        code: zod_1.z.string({
            required_error: "Auth error",
        }),
        state: zod_1.z.string(),
    }),
});
const googleAuthRequest = zod_1.z.object({
    query: zod_1.z.object({
        callback: zod_1.z
            .string({ required_error: "callback is required." })
            .url("callback must be a url"),
    }),
});
exports.default = { loginUserSchema, googleAuthResponse, googleAuthRequest };

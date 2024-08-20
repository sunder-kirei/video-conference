"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const createUserSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        username: zod_1.z.string({
            required_error: "Username is required.",
        }),
        password: zod_1.z
            .string()
            .min(6, "Password too short - should be 6 characters minimum."),
        passwordConfirmation: zod_1.z.string({
            required_error: "passwordConfirmation is required.",
        }),
        email: zod_1.z
            .string({
            required_error: "Email is required",
        })
            .email("Not a valid email."),
    })
        .refine((data) => data.password === data.passwordConfirmation, {
        message: "Passwords do not match",
        path: ["passwordConfirmation"],
    }),
});
exports.default = { createUserSchema };

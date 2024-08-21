import { query } from "express";
import { z } from "zod";

const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required." })
      .email("Not a valid email."),
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(6, "Not a valid password."),
  }),
});

const googleAuthResponse = z.object({
  query: z.object({
    code: z.string({
      required_error: "Auth error",
    }),
    state: z.string(),
  }),
});

const googleAuthRequest = z.object({
  query: z.object({
    callback: z
      .string({ required_error: "callback is required." })
      .url("callback must be a url"),
  }),
});

export default { loginUserSchema, googleAuthResponse, googleAuthRequest };

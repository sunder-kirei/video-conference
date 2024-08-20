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

export default { loginUserSchema, googleAuthResponse };

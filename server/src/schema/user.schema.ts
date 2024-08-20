import { z } from "zod";

const createUserSchema = z.object({
  body: z
    .object({
      username: z.string({
        required_error: "Username is required.",
      }),
      password: z
        .string()
        .min(6, "Password too short - should be 6 characters minimum."),
      passwordConfirmation: z.string({
        required_error: "passwordConfirmation is required.",
      }),
      email: z
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

export default { createUserSchema };

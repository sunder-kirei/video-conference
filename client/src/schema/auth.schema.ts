import { z } from "zod";

const createUserSchema = z
  .object({
    email: z.string({ required_error: "Required" }).email("Invalid email"),
    username: z.string({ required_error: "Required" }),
    password: z
      .string({ required_error: "Required" })
      .min(6, "6 characters minimum"),
    passwordConfirmation: z
      .string({ required_error: "Required" })
      .min(6, "6 characters minimum"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

const loginUserSchema = z.object({
  email: z.string({ required_error: "Required" }).email("Invalid email"),
  password: z
    .string({ required_error: "Required" })
    .min(6, "6 characters minimum"),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type LoginUserSchema = z.infer<typeof loginUserSchema>;

export default {
  createUserSchema,
  loginUserSchema,
};

import { Express, NextFunction, Request, Response } from "express";

import authController from "./controller/auth.controller";
import userController from "./controller/user.controller";
import logger from "./lib/logger";
import { deserializeUser } from "./middleware/deserializeUser";
import validate from "./middleware/validate";
import authSchema from "./schema/auth.schema";
import userSchema from "./schema/user.schema";

function routes(app: Express) {
  app.get(
    "/api/auth/google/oauth2callback",
    validate(authSchema.googleAuthResponse),
    authController.googleAuthCallback
  );

  app.get(
    "/api/auth/google",
    validate(authSchema.googleAuthRequest),
    authController.googleAuthInit
  );

  app.post(
    "/api/auth/email/signup",
    validate(userSchema.createUserSchema),
    authController.emailSignUp
  );

  app.post(
    "/api/auth/email/signin",
    validate(authSchema.loginUserSchema),
    authController.emailSignIn
  );

  app.get("/api/user", deserializeUser, userController.getUserDetails);

  app.get("/api/healthcheck", (req, res, next) => {
    res.status(200);
    res.json("ok");
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    next();
  });
}

export default routes;

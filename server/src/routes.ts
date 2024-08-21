import {
  Express,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

import authController from "./controller/auth.controller";
import userController from "./controller/user.controller";
import authSchema from "./schema/auth.schema";
import userSchema from "./schema/user.schema";
import validate from "./middleware/validate";
import logger from "./lib/logger";
import { deserializeUser } from "./middleware/deserializeUser";

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

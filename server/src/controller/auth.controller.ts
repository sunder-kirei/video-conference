import { NextFunction, Request, Response } from "express";
import { GoogleAuth } from "../lib/GoogleAuth";
import authService from "../service/auth.service";
import userService from "../service/user.service";
import {
  CreateUserSchema,
  GoogleAuthRequest,
  GoogleAuthResponse,
  LoginUserSchema,
} from "../types";

function googleAuthInit(
  req: Request<{}, {}, {}, GoogleAuthRequest["query"]>,
  res: Response,
  next: NextFunction
) {
  GoogleAuth.Instance.auth(req, res);
}

async function googleAuthCallback(
  req: Request<{}, {}, {}, GoogleAuthResponse["query"]>,
  res: Response,
  next: NextFunction
) {
  const { accessToken, callbackURL, refreshToken } =
    await authService.googleCallbackHandler(req, res);
  authService.attachCookies(res, accessToken, refreshToken);
  res.redirect(callbackURL);
  return;
}

async function emailSignUp(
  req: Request<{}, {}, CreateUserSchema["body"]>,
  res: Response,
  next: NextFunction
) {
  const { email, password, username } = req.body;
  const user = await userService.createUser({ email, username, password });
  if (!user) {
    res.status(409).send();
    return;
  }

  const { accessToken, refreshToken } = await authService.genTokenPair(
    user.id,
    user.email
  );
  authService.attachCookies(res, accessToken, refreshToken);
  res.status(201).send({ message: "USER CREATED" });
}

async function emailSignIn(
  req: Request<{}, {}, LoginUserSchema["body"]>,
  res: Response,
  next: NextFunction
) {
  const { statusCode, accessToken, refreshToken } =
    await authService.signInHandler(req.body);
  if (statusCode != 200) {
    res.status(statusCode).send();
    return;
  }
  authService.attachCookies(res, accessToken!, refreshToken!);
  res.status(200).send({ message: "OK" });
}

export default {
  googleAuthInit,
  googleAuthCallback,
  emailSignIn,
  emailSignUp,
};

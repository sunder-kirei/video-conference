import { Request, Response, NextFunction } from "express";
import { GoogleAuth } from "../lib/GoogleAuth";
import {
  CreateUserSchema,
  GoogleAuthResponse,
  LoginUserSchema,
} from "../types";
import userService from "../service/user.service";
import authService from "../service/auth.service";

function googleAuthInit(req: Request, res: Response, next: NextFunction) {
  GoogleAuth.Instance.auth(req, res);
}

async function googleAuthCallback(
  req: Request<{}, {}, {}, GoogleAuthResponse["query"]>,
  res: Response,
  next: NextFunction
) {
  const { accessToken, refreshToken } = await authService.googleCallbackHandler(
    req,
    res
  );
  res.setHeader("x-access-token", accessToken);
  res.setHeader("x-refresh-token", refreshToken);
  res.send({
    accessToken,
    refreshToken,
  });
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

  res.status(201).send({
    id: user._id,
    email: user.email,
    username: user.username,
    profilePicture: user.profilePicture,
  });
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

  res.setHeader("x-access-token", accessToken!);
  res.setHeader("x-refresh-token", refreshToken!);
  res.send({
    accessToken,
    refreshToken,
  });
  return;
}

export default {
  googleAuthInit,
  googleAuthCallback,
  emailSignIn,
  emailSignUp,
};

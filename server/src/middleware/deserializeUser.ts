import { NextFunction, Request, Response } from "express";
import { verifyJWT } from "../lib/jwt";
import authService from "../service/auth.service";
import userService from "../service/user.service";
import { Payload, PublicKey } from "../types";

export async function deserializeUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  if (!accessToken) {
    res.status(403).send();
    return;
  }

  const { decoded, expired } = verifyJWT<Payload>(
    accessToken,
    PublicKey.accessToken
  );

  if (expired && !refreshToken) {
    res.status(401).send();
    return;
  }

  if (expired && refreshToken) {
    const newAccessToken = await authService.reIssueAccessToken(
      refreshToken as string
    );
    if (!newAccessToken) {
      res.status(403).send();
      return;
    }

    authService.attachCookies(res, newAccessToken, refreshToken);
  }

  if (!decoded) {
    res.status(403).send();
    return;
  }

  res.locals.user = await userService.findUser({
    _id: decoded.id,
    email: decoded.email,
  });
  next();
}

import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../lib/jwt";
import { Payload, PublicKey } from "../types";
import userService from "../service/user.service";
import authService from "../service/auth.service";

export async function deserializeUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const refreshToken = req.headers["x-refresh"];

  if (!accessToken) {
    res.status(403);
    return;
  }

  const { decoded, expired } = verifyJWT<Payload>(
    accessToken,
    PublicKey.accessToken
  );

  if (!decoded) {
    res.status(403).send();
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

    res.setHeader("x-access-token", newAccessToken);
  }

  res.locals.user = await userService.findUser({
    _id: decoded.id,
    email: decoded.email,
  });

  next();
}

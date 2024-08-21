import { Request, Response, NextFunction } from "express";
import { AuthResponse } from "../types";
import logger from "../lib/logger";

function getUserDetails(
  req: Request,
  res: Response<AuthResponse>,
  next: NextFunction
) {
  const { id, username, email, profilePicture } = res.locals.user;
  res.send({ id, username, email, profilePicture });
}

export default {
  getUserDetails,
};

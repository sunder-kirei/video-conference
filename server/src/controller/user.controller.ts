import { NextFunction, Request, Response } from "express";
import { AuthResponse } from "../types";

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

import { GoogleAuth } from "../lib/GoogleAuth";
import { signJWT, verifyJWT } from "../lib/jwt";
import UserModel, { UserInput } from "../model/user.model";
import {
  GoogleAuthResponse,
  LoginUserSchema,
  Payload,
  PrivateKey,
  PublicKey,
} from "../types";
import { Request, Response } from "express";
import userService from "./user.service";

async function reIssueAccessToken(refreshToken: string) {
  const { decoded } = verifyJWT<Payload>(refreshToken, PublicKey.refreshToken);

  if (!decoded) return null;

  const accessToken = signJWT(
    {
      id: decoded.id,
      email: decoded.email,
    },
    PrivateKey.accessToken
  );

  return accessToken;
}

async function genTokenPair(id: string, email: string) {
  const accessToken = signJWT({ id, email }, PrivateKey.accessToken);
  const refreshToken = signJWT({ id, email }, PrivateKey.refreshToken);

  return { accessToken, refreshToken };
}

async function googleCallbackHandler(
  req: Request<{}, {}, {}, GoogleAuthResponse["query"]>,
  res: Response
) {
  const tokens = await GoogleAuth.Instance.handleCallback(req, res);
  const profile = await GoogleAuth.Instance.fetchProfile(tokens);
  let accessToken: string = "";
  let refreshToken: string = "";

  const foundUser = await userService.findUser({ email: profile.email });
  if (foundUser) {
    if (!foundUser.profilePicture) {
      foundUser.profilePicture = profile.picture;
      await foundUser.save();
    }
    const tokens = await genTokenPair(foundUser._id.toString(), profile.email);
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  } else {
    const createdUser = await userService.createUser({
      email: profile.email,
      username: profile.name,
      profilePicture: profile.picture,
    });

    const tokens = await genTokenPair(createdUser!.id, profile.email);
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  }

  return { accessToken, refreshToken };
}

async function signInHandler(input: LoginUserSchema["body"]): Promise<{
  statusCode: number;
  accessToken?: string;
  refreshToken?: string;
}> {
  const { email, password } = input;
  const foundUser = await userService.findUser({ email });

  if (!foundUser) {
    return { statusCode: 404 };
  }

  const isValid = await foundUser.comparePassword(password);
  if (!isValid) {
    return { statusCode: 403 };
  }

  const { accessToken, refreshToken } = await genTokenPair(
    foundUser.id,
    foundUser.email
  );

  return {
    statusCode: 200,
    accessToken,
    refreshToken,
  };
}

export default {
  reIssueAccessToken,
  googleCallbackHandler,
  genTokenPair,
  signInHandler,
};

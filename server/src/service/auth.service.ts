import { GoogleAuth } from "../lib/GoogleAuth";
import { signJWT, verifyJWT } from "../lib/jwt";
import UserModel, { UserInput } from "../model/user.model";
import {
  AuthResponse,
  GoogleAuthResponse,
  LoginUserSchema,
  Payload,
  PrivateKey,
  PublicKey,
} from "../types";
import { Request, Response } from "express";
import userService from "./user.service";
import { Auth } from "googleapis";

function attachCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    // domain: "http://localhost:3000",
    // path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    // domain: "http://localhost:3000",
    // path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

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
  const { tokens, state } = await GoogleAuth.Instance.handleCallback(req, res);
  const profile = await GoogleAuth.Instance.fetchProfile(tokens);
  const authResponse = {
    callbackURL: state,
    accessToken: "",
    refreshToken: "",
  };

  const user = await userService.findUser({ email: profile.email });
  if (user) {
    if (!user.profilePicture) {
      user.profilePicture = profile.picture;
      await user.save();
    }
    const tokens = await genTokenPair(user._id.toString(), profile.email);
    authResponse.accessToken = tokens.accessToken;
    authResponse.refreshToken = tokens.refreshToken;
  } else {
    const user = await userService.createUser({
      email: profile.email,
      username: profile.name,
      profilePicture: profile.picture,
    });

    const tokens = await genTokenPair(user!.id, profile.email);
    authResponse.accessToken = tokens.accessToken;
    authResponse.refreshToken = tokens.refreshToken;
  }

  return authResponse;
}

async function signInHandler(input: LoginUserSchema["body"]) {
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
  attachCookies,
};

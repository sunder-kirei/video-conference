import { google, GoogleApis } from "googleapis";
import crypto from "crypto";
import { Session } from "express-session";
import { Request, Response } from "express";
import {
  OAuth2Client,
  Credentials,
  GoogleAuthProfile,
  GoogleAuthResponse,
} from "../types";
import logger from "./logger";

export class GoogleAuth {
  private oauth2Client: OAuth2Client;
  private scope: string[];

  private static _instance: GoogleAuth;

  private constructor(
    clientID: string,
    clientSecret: string,
    redirectURL: string,
    scope: string[] = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ]
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      clientID,
      clientSecret,
      redirectURL
    );
    this.scope = scope;
  }

  auth(req: Request, res: Response) {
    const state = crypto.randomBytes(32).toString("hex");
    req.session.state = state;

    const authURL = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.scope,
      include_granted_scopes: true,
      state: state,
    });

    res.redirect(authURL);
  }

  async handleCallback(
    req: Request<{}, {}, {}, GoogleAuthResponse["query"]>,
    res: Response
  ) {
    const { code, state } = req.query;

    if (state !== req.session.state) {
      throw "State mismatch, possible CSRF attack.";
    } else {
      const { tokens } = await this.oauth2Client.getToken(code!);
      return tokens;
    }
  }

  async fetchProfile(tokens: Credentials) {
    const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`;
    const profile: GoogleAuthProfile = await (await fetch(url)).json();

    return profile;
  }

  static init(clientID: string, clientSecret: string, redirectURL: string) {
    if (this._instance) logger.warn("GoogleAuth reinitialized!");

    this._instance = new GoogleAuth(clientID, clientSecret, redirectURL);
  }

  static get Instance() {
    if (!this._instance)
      throw "GoogleAuth not initialized, try after calling init().";
    return this._instance;
  }
}

import { Session } from "express-session";

declare module "express-session" {
  interface SessionData extends Session.SessionData {
    state: string;
  }
}

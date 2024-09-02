import jwt from "jsonwebtoken";
import { PrivateKey, PublicKey, VerifyJWT } from "../types";

export function signJWT(payload: any, keyType: PrivateKey) {
  const key = process.env[keyType]!;

  const ttl =
    keyType === PrivateKey.accessToken
      ? process.env.ACCESS_TOKEN_TTL
      : process.env.REFRESH_TOKEN_TTL;

  return jwt.sign(payload, key, { expiresIn: ttl });
}

export function verifyJWT<Payload>(
  token: string,
  keyType: PublicKey
): VerifyJWT<Payload | null> {
  const key = process.env[keyType]!;

  try {
    const decoded = jwt.verify(token, key);
    return {
      expired: false,
      decoded: decoded as Payload,
    };
  } catch (err: any) {
    return {
      expired: err.message === "jwt expired",
      decoded: null,
    };
  }
}

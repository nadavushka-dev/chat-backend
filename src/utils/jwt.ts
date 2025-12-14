import jwt from "jsonwebtoken";
import config from "../config";

export type JwtPayloadT = {
  userId: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
};

function jwtEncode(payload: JwtPayloadT): string {
  return jwt.sign(payload, config.secret, { expiresIn: "14d" });
}

function jwtVerify(token: string): JwtPayloadT {
  const payload = jwt.verify(token, config.secret);
  if (typeof payload === "string") {
    throw new Error("Invalid token payload");
  }

  return payload as JwtPayloadT;
}

export { jwtEncode, jwtVerify };

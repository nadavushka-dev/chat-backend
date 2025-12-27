import jwt from "jsonwebtoken";
import config from "../config";
import crypto from "crypto";
import { Response } from "express";
import { User } from "@prisma/client";
import { prisma } from "../db/connection";

export type JwtPayloadT = {
  userId: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
};

function jwtEncode(payload: JwtPayloadT): string {
  return jwt.sign(payload, config.secret, { expiresIn: "15m" });
}

function jwtVerify(token: string): JwtPayloadT {
  const payload = jwt.verify(token, config.secret);
  if (typeof payload === "string") {
    throw new Error("Invalid token payload");
  }

  return payload as JwtPayloadT;
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function handleAuthTokens(
  res: Response,
  user: Pick<User, "id" | "name" | "email">,
) {
  const token = handleAccessTokenCookie(user);
  await handleRefreshTokenCookie(res, user);
  return { token };
}

function handleAccessTokenCookie(
  user: Pick<User, "id" | "name" | "email">,
): string {
  const token = jwtEncode({
    userId: user.id,
    username: user.name,
    email: user.email,
  });

  return token;
}

async function handleRefreshTokenCookie(
  res: Response,
  user: Pick<User, "id" | "name" | "email">,
) {
  const refreshToken = generateRefreshToken();
  const maxAge = 1000 * 60 * 60 * 24 * 14;
  const expiration = new Date(Date.now() + maxAge);
  await storeRefreshToken(user, refreshToken, expiration);

  res.cookie("refreshToken", refreshToken, {
    maxAge: maxAge,
    sameSite: "strict",
    httpOnly: true,
    secure: true,
  });
}

async function storeRefreshToken(
  user: Pick<User, "id">,
  refreshToken: string,
  refreshExpiration: Date,
) {
  return prisma.auth.upsert({
    where: {
      sessionId: refreshToken,
    },
    create: {
      userId: user.id,
      sessionId: refreshToken,
      expiresAt: refreshExpiration,
    },
    update: {
      sessionId: refreshToken,
      expiresAt: refreshExpiration,
    },
  });
}

export { handleAuthTokens, jwtVerify };

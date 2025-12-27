import { NextFunction, Request, Response } from "express";
import { AuthError } from "./errors";
import { jwtVerify } from "../utils/auth";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError();
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwtVerify(token);
    req.jwtPayload = payload;
    next();
  } catch {
    throw new AuthError();
  }
};

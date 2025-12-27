import { Router } from "express";
import { createUserSchema, loginUser } from "./schemas/users.schema";
import { parseSchema } from "./validators/schemaParser.validator";
import {
  AuthError,
  ConflictError,
  ValidationError,
} from "../middlewares/errors";
import { hashPassword, verifyPassword } from "../utils/password";
import { handleAuthTokens } from "../utils/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../db/connection";

const router = Router();

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const user = parseSchema(createUserSchema, req);

    const isEmailExists = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (isEmailExists) {
      throw new ConflictError("Email is already in use");
    }

    const password_hash = await hashPassword(user.password);

    const data = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password_hash: password_hash,
        createdAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const { token } = await handleAuthTokens(res, data);
    res.status(200).json({ jwt: token });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = parseSchema(loginUser, req);

    const foundUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!foundUser) {
      throw new ValidationError("Invalid email or password");
    }

    const isVerified = await verifyPassword(
      foundUser.password_hash,
      user.password,
    );
    if (!isVerified) {
      throw new ValidationError("Invalid email or password");
    }

    const { token } = await handleAuthTokens(res, foundUser);
    res.status(200).json({ jwt: token });
  }),
);

router.get(
  "/refresh-token",
  asyncHandler(async (req, res) => {
    const raw = req.headers.cookie;
    if (!raw) throw new AuthError("Cookies are missing");

    const cookies = Object.fromEntries(
      raw.split(";").map((c) => c.trim().split("=")),
    );

    const refreshToken = cookies.refreshToken;
    if (!refreshToken) {
      throw new AuthError("Refresh token invalid");
    }

    const session = await prisma.auth.findUnique({
      where: {
        sessionId: refreshToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) throw new AuthError("Invalid or expired session");
    const { token } = await handleAuthTokens(res, session.user);
    res.status(200).json({ jwt: token });
  }),
);

export const authRouter = router;

import { Router } from "express";
import { prisma } from "../db/connection";
import { validateId } from "./validators/id.validator";
import { createUserSchema, loginUser } from "./schemas/users.schema";
import { parseSchema } from "./validators/schemaParser.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { ConflictError, ValidationError } from "../middlewares/errors";
import { hashPassword, verifyPassword } from "../utils/password";
import { jwtEncode } from "../utils/jwt";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_, res) => {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    res.status(200).json(data);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = validateId(req.params.id);

    const data = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    res.status(200).json(data);
  }),
);

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    console.log({ req });
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
    const token = jwtEncode({
      userId: data.id,
      username: data.name,
      email: data.email,
    });
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

    const token = jwtEncode({
      userId: foundUser.id,
      username: foundUser.name,
      email: foundUser.email,
    });

    res.status(200).json({ jwt: token });
  }),
);
export const usersRouter = router;

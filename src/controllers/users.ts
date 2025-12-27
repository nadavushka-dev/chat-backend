import { Router } from "express";
import { prisma } from "../db/connection";
import { validateId } from "./validators/id.validator";
import { asyncHandler } from "../utils/asyncHandler";

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

export const usersRouter = router;

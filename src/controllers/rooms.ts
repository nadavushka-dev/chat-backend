import { Router } from "express";
import { prisma } from "../db/connection";
import { createMessageSchema, createRoomSchema } from "./schemas/rooms.schema";
import { validateId } from "./validators/id.validator";
import { parseSchema } from "./validators/schemaParser.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../middlewares/errors";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_, res) => {
    const data = await prisma.room.findMany();
    res.status(200).json(data);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsedRoom = parseSchema(createRoomSchema, req);

    const creator = await prisma.user.findUnique({
      where: { id: parsedRoom.createBy },
    });

    if (!creator) throw new NotFoundError("Creator not found");

    const createdRoom = await prisma.room.create({
      data: parsedRoom,
    });

    res.status(201).json(createdRoom);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const roomId = validateId(req.params.id);

    const roomParticipants = await prisma.roomParticipant.findMany({
      where: { room_id: roomId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const participants = roomParticipants.map((tp) => tp.user);

    res.status(200).json(participants);
  }),
);

router.get(
  "/messagesByRoom/:id",
  asyncHandler(async (req, res) => {
    const roomId = validateId(req.params.id);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundError("Room not found");

    const messages = await prisma.message.findMany({
      where: { roomId: roomId },
    });

    res.status(200).json(messages);
  }),
);

router.post(
  "/message",
  asyncHandler(async (req, res) => {
    const message = parseSchema(createMessageSchema, req);

    const [room, sender] = await Promise.all([
      prisma.room.findUnique({ where: { id: message.roomId } }),
      prisma.user.findUnique({ where: { id: message.senderId } }),
    ]);

    if (!room) throw new NotFoundError("Room not found");
    if (!sender) throw new NotFoundError("Sender not found");

    const messageCreated = await prisma.message.create({
      data: message,
    });

    res.status(201).json(messageCreated);
  }),
);

export const roomsRouter = router;

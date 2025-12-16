import { Server } from "http";
import { Server as socketServer } from "socket.io";
import { SE } from "../enum";
import { prisma } from "../db/connection";
import { createMessageSchema } from "./schemas/rooms.schema";
import { idNumberSchema } from "./schemas/id.schema";
import config from "../config";
import { jwtVerify } from "../utils/jwt";

export const onlineUsers = new Set<number>();
let _io: socketServer | null = null;

export function getIO(): socketServer {
  if (!_io) throw new Error("Socket.io not initialized");
  return _io;
}

export function socketHandler(s: Server) {
  _io = new socketServer(s, {
    cors: {
      origin: (origin, cb) => {
        if (
          !origin ||
          config.corsOrigin.includes("*") ||
          config.corsOrigin.includes(origin)
        )
          return cb(null, true);
        cb(new Error("Not allowed by CORS"));
      },
    },
    maxHttpBufferSize: config.socketMaxHttpBufferSize,
  });

  const io = _io;

  io.on(SE.CONNECTION, (socket) => {
    console.log("Socket connected", socket.id);
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.disconnect();
      return;
    }
    try {
      const payload = jwtVerify(token);
      onlineUsers.add(payload.userId);
      socket.data.userId = payload.userId;
      io.emit(SE.USER_ONLINE, payload.userId, payload.username);
    } catch {
      socket.disconnect();
    }

    socket.emit(SE.ONLINE_USERS, Array.from(onlineUsers));

    socket.on(SE.JOIN_ROOM, async (roomId: unknown) => {
      const parsed = idNumberSchema.safeParse(roomId);
      if (!parsed.success) {
        socket.emit(SE.ERROR, { message: "Invalid room ID" });
        return;
      }

      try {
        const room = await prisma.room.findUnique({
          where: { id: Number(parsed.data) },
        });
        if (!room) {
          throw new Error("Room not found");
        }

        socket.join(parsed.data.toString());
        console.log("joind into a room ", room.name);

        await prisma.roomParticipant.upsert({
          where: {
            room_id_user_id: {
              user_id: socket.data.userId,
              room_id: room.id,
            },
          },
          create: {
            user_id: socket.data.userId,
            room_id: room.id,
          },
          update: {},
        });
      } catch (error) {
        const message =
          error instanceof Error && error.message === "Room not found"
            ? "Room not found"
            : "Failed to join room";
        socket.emit(SE.ERROR, { message });
      }
    });

    socket.on(SE.LEAVE_ROOM, (roomId: number) => {
      const parsed = idNumberSchema.safeParse(roomId);
      if (!parsed.success) {
        socket.emit(SE.ERROR, { message: "Invalid room ID" });
        return;
      }

      socket.leave(parsed.data.toString());
    });

    socket.on(SE.MSG, async (data: unknown) => {
      const parsed = createMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(SE.ERROR, { message: "invalid message format" });
        return;
      }
      const message = {
        ...parsed.data,
        sentAt: new Date(),
      };

      socket.broadcast.in(String(parsed.data.roomId)).emit(SE.DELIVER, message);

      try {
        await prisma.message.create({ data: parsed.data });
      } catch (error) {
        socket.emit(SE.ERROR, { message: "Failed to save message" });
      }
    });

    socket.on(SE.DISCONNECT, () => {
      onlineUsers.delete(socket.data.userId);
      io.emit(SE.USER_OFFLINE, socket.data.userId);
      console.log("Socket disconnected", socket.id);
    });
  });
}

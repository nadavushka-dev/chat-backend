import { Server } from "http";
import { Server as socketServer } from "socket.io";
import { SE } from "../enum";
import { prisma } from "../db/connection";
import { createMessageSchema } from "./schemas/rooms.schema";
import { idStringSchema } from "./schemas/id.schema";
import config from "../config";

export function socketHandler(s: Server) {
  const io = new socketServer(s, {
    cors: {
      origin: config.corsOrigin,
    },
    maxHttpBufferSize: config.socketMaxHttpBufferSize,
  });

  io.on(SE.CONNECTION, (socket) => {
    console.log("Socket connected", socket.id);

    socket.on(SE.JOIN_ROOM, async (roomId: unknown) => {
      const parsed = idStringSchema.safeParse(roomId);
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

        socket.join(parsed.data);
      } catch (error) {
        socket.emit(SE.ERROR, { message: "Room not found" });
      }
    });

    socket.on(SE.LEAVE_ROOM, (roomId: string) => {
      const parsed = idStringSchema.safeParse(roomId);
      if (!parsed.success) {
        socket.emit(SE.ERROR, { message: "Invalid room ID" });
        return;
      }

      socket.leave(parsed.data);
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
      console.log("Socket disconnected", socket.id);
    });
  });
}

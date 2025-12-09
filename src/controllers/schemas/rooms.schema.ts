import z from "zod";

const createRoomSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  createBy: z.number().int().positive(),
});

const createMessageSchema = z.object({
  senderId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  body: z
    .string()
    .min(1, "Message is empty")
    .max(200, "Message exceed max capacity"),
});

export { createRoomSchema, createMessageSchema };

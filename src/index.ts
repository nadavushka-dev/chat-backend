import "dotenv/config";
import express from "express";
import { socketHandler } from "./controllers/socket";
import { roomsRouter } from "./controllers/rooms";
import cors from "cors";
import { usersRouter } from "./controllers/users";
import { prisma } from "./db/connection";
import { handleErrors } from "./middlewares/handleErrors.middleware";
import { notFoundHandler } from "./middlewares/routeNotFound.middleware";
import { authMiddleware } from "./middlewares/auth.middleware";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!process.env.SECRET) {
  throw new Error("JWT secret was not configured");
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Routes
app.get("/", (_, res) => {
  res.json({ message: "Welcome to chat-node API" });
});
app.use("/rooms", authMiddleware, roomsRouter);
app.use("/users", usersRouter);
app.use(notFoundHandler);
app.use(handleErrors);

// Start server
const server = app.listen(port, () => {
  console.log("Server running on port " + port);
});

socketHandler(server);

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    prisma.$disconnect();
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

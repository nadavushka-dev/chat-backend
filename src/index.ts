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
import config from "./config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!process.env.SECRET) {
  throw new Error("JWT secret was not configured");
}

const app = express();
const port = config.port;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.corsOrigin.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: config.httpSizeLimit }));

app.get("/", (_, res) => {
  res.json({ message: "Welcome to chat-node API" });
});
app.use("/rooms", authMiddleware, roomsRouter);
app.use("/users", usersRouter);
app.use(notFoundHandler);
app.use(handleErrors);

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

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
import { pinoHttp } from "pino-http";
import { logger } from "./utils/logger";
import { authRouter } from "./controllers/auth";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!process.env.SECRET) {
  throw new Error("JWT secret was not configured");
}

const app = express();
const port = config.port;

app.use(pinoHttp({ logger }));

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (
        !origin ||
        config.corsOrigin.includes("*") ||
        config.corsOrigin.includes(origin)
      )
        return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: config.httpSizeLimit }));

app.get("/health", async (_, res) => {
  let status = 200;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    status = 500;
    logger.error(`Health check failed with ${err}`);
  }
  res.status(status).json({ status: status === 200 ? "ok" : "error" });
});
app.use("/rooms", authMiddleware, roomsRouter);
app.use("/users", authMiddleware, usersRouter);
app.use("/auth", authRouter);
app.use(notFoundHandler);
app.use(handleErrors);

const server = app.listen(port, () => {
  logger.info("Server running on port " + port);
});

socketHandler(server);

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down...`);
  server.close(() => {
    prisma.$disconnect();
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

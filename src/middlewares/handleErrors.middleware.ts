import { Request, Response, NextFunction } from "express";
import { AppError } from "./errors";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";

export const handleErrors = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErrors: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: "Duplicated entry" },
      P2025: { status: 404, message: "Record not found" },
      P2003: { status: 400, message: "Invalid reference" },
    };

    const mapped = prismaErrors[err.code];
    if (mapped) {
      res.status(mapped.status).json({ error: mapped.message });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({ error: "Database unavailable" });
    return;
  }

  logger.error(err.stack);

  res.status(500).json({ error: "Internal server error" });
};

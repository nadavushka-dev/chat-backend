import { Request, Response } from "express";

export const notFoundHandler = (_: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};

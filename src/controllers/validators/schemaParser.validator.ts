import { Request } from "express";
import z from "zod";
import { ValidationError } from "../../middlewares/errors";

export const parseSchema = <T extends z.ZodObject<any>>(
  schema: T,
  req: Request,
): z.infer<typeof schema> => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(JSON.stringify(z.flattenError(parsed.error)));
  }
  return parsed.data;
};

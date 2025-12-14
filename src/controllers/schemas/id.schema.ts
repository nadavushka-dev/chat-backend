import z from "zod";

const idParamSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());

const idStringSchema = z.string().regex(/^\d+$/);
const idNumberSchema = z.number().positive();

export { idParamSchema, idStringSchema, idNumberSchema };

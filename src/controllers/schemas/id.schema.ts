import z from "zod";

const idParamSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());

const idStringSchema = z.string().regex(/^\d+$/);

export { idParamSchema, idStringSchema };

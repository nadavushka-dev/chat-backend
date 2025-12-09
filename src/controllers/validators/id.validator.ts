import { idParamSchema } from "../schemas/id.schema";
import { ValidationError } from "../../middlewares/errors";

export const validateId = (id: string): number => {
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    throw new ValidationError("Invalid id");
  }

  return parsed.data.id;
};

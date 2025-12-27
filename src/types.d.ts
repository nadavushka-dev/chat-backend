import { JwtPayloadT } from "./utils/auth";

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayloadT;
    }
  }
}

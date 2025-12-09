import { JwtPayloadT } from "./utils/jwt";

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayloadT;
    }
  }
}

import type { Request } from "express";
import type { JwtPayload } from "../types/jwt-payload.type";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

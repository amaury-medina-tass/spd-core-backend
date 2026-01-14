import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../types/jwt-payload.type";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtPayload | undefined;
  }
);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { META_REQUIRED_PERMISSIONS_KEY } from "../../shared/constants";
import type { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required =
      this.reflector.get<string[]>(
        META_REQUIRED_PERMISSIONS_KEY,
        ctx.getHandler()
      ) ?? [];

    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const perms = req.user?.permissions ?? [];

    const ok = required.every((p) => perms.includes(p));
    if (!ok) throw new ForbiddenException("Missing permissions");

    return true;
  }
}

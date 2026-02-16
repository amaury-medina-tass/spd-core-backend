import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { META_REQUIRED_PERMISSIONS_KEY } from "../../shared/constants";
import type { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";
import type { PermissionMetadata } from "../decorators/require-permission.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<PermissionMetadata>(
      META_REQUIRED_PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()]
    );

    // If no permission decorator, allow access
    if (!permission) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const perms = req.user?.permissions;

    if (!perms || typeof perms !== "object") {
      throw new ForbiddenException("Permisos no disponibles");
    }

    const mod = (perms as Record<string, any>)[permission.modulePath];
    const allowed = mod?.actions?.[permission.actionCode]?.allowed === true;

    if (!allowed) {
      throw new ForbiddenException("No tiene permiso para realizar esta acción");
    }

    return true;
  }
}

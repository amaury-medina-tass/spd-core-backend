import { SetMetadata } from "@nestjs/common";
import { META_REQUIRED_PERMISSIONS_KEY } from "../../shared/constants";

export interface PermissionMetadata {
  modulePath: string;
  actionCode: string;
}

export const RequirePermission = (modulePath: string, actionCode: string) =>
  SetMetadata<string, PermissionMetadata>(META_REQUIRED_PERMISSIONS_KEY, { modulePath, actionCode });

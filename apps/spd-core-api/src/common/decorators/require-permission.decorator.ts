import { SetMetadata } from "@nestjs/common";
import { META_REQUIRED_PERMISSIONS_KEY } from "../../shared/constants";

export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(META_REQUIRED_PERMISSIONS_KEY, permissions);

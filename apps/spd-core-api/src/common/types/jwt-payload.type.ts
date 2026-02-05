export type ActionPermission = {
  name: string;
  allowed: boolean;
};

export type ModulePermission = {
  name: string;
  actions: Record<string, ActionPermission>;
};

export type PermissionsMap = Record<string, ModulePermission>;

export type JwtPayload = {
  sub: string;             // userId
  email?: string;

  system?: string;         // "SPD" / "SICGEM"
  roles?: string[];        // opcional
  permissions?: PermissionsMap;

  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
};

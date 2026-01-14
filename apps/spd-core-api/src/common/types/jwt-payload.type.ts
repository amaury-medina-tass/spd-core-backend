export type JwtPayload = {
  sub: string;             // userId
  email?: string;

  system?: string;         // "SPD" / "MUJERES"
  roles?: string[];        // opcional
  permissions?: string[];  // ej: ["masters.activities.read", "financiero.cdp.create"]

  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
};

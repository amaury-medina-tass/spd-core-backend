import { IsString, IsOptional, Matches } from "class-validator";

export class RequestSapSyncDto {
  /**
   * Fecha inicial del rango (formato: DD-MM-YYYY)
   * @example "01-01-2026"
   */
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: "fechaInicio debe tener formato DD-MM-YYYY",
  })
  fechaInicio: string;

  /**
   * Fecha final del rango (formato: DD-MM-YYYY)
   * @example "31-12-2026"
   */
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: "fechaFin debe tener formato DD-MM-YYYY",
  })
  fechaFin: string;

  /**
   * Código de secretaría (por defecto: 221)
   * @example "221"
   */
  @IsOptional()
  @IsString()
  codSecretaria?: string = "221";
}

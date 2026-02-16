import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { XMLParser } from "fast-xml-parser";
import { MOCK_SAP_XML } from "./mock-sap";

export interface SapContract {
  numContrato: string;
  objetoContrato: string;
  fechaInicio: string;
  fechaFinal: string;
  valorInicial: string;
  valorTotal: string;
  valorFacturado: string;
  moneda: string;
  codContratista: string;
  nitContratista: string;
  nombreContratista: string;
  direccion: string;
  telefono: string;
  email: string;
  pedido: string;
  secretaria: string;
  posicion: string;
  valorPosicion: string;
  cdp: string;
  valorCDP: string;
  proyecto: string;
  nombreProyecto: string;
  totalProyecto: string;
  programa: string;
  nombrePrograma: string;
  estudioPrevio: string;
  necesidad: string;
  valorNecesidad: string;
  cantidadPlan: string;
  unidad: string;
  valorUnitPlan: string;
  valorTotalPlan: string;
  modalidad: string;
  causal: string;
  estado: string;
  totalAdicion: string;
  totalAmpliacion: string;
  pospre: string;
  codigoFondo: string;
  descripcionFondo: string;
  centroGestor: string;
  descCentroGestor: string;
}

@Injectable()
export class SapApiService {
  private readonly logger = new Logger(SapApiService.name);
  private readonly xmlParser: XMLParser;

  private readonly sapUrl: string;
  private readonly sapAuth: string;

  constructor(private readonly cfg: ConfigService) {
    this.sapUrl = this.cfg.get<string>("sap.url") ?? "";
    this.sapAuth = this.cfg.get<string>("sap.auth") ?? "";

    this.xmlParser = new XMLParser({
      ignoreAttributes: true,
      removeNSPrefix: true, // Remueve namespaces (soapenv:, med:)
    });
  }

  /**
   * Consulta contratos desde SAP para un rango de fechas.
   * @param fechaInicio Formato: DD-MM-YYYY
   * @param fechaFin Formato: DD-MM-YYYY
   * @param codSecretaria Código de secretaría (default: 221)
   */
  async fetchContracts(
    fechaInicio: string,
    fechaFin: string,
    codSecretaria: string = "221"
  ): Promise<{ items: SapContract[] }> {
    this.logger.log(
      `Consultando SAP [MOCK]: ${fechaInicio} - ${fechaFin} (Secretaría: ${codSecretaria})`
    );

    // Using mock data for testing without VPN
    const xmlText = MOCK_SAP_XML;

    this.logger.debug(`SAP Response XML (truncated): ${xmlText.substring(0, 500)}...`);

    return this.parseXmlResponse(xmlText);
  }

  /**
   * Parsea la respuesta XML de SAP y la convierte al formato JSON esperado por el SP.
   */
  private parseXmlResponse(xml: string): { items: SapContract[] } {
    const parsed = this.xmlParser.parse(xml);

    // Navegar estructura SOAP: Envelope > Body > MT_Contratos_Res > CONTRATOS > ITEM
    const envelope = parsed?.Envelope;
    const body = envelope?.Body;
    const response = body?.MT_Contratos_Res;
    const contratos = response?.CONTRATOS;
    let items = contratos?.ITEM;

    if (!items) {
      this.logger.warn("No se encontraron contratos en la respuesta de SAP");
      return { items: [] };
    }

    // Si solo hay un item, fast-xml-parser lo devuelve como objeto, no array
    if (!Array.isArray(items)) {
      items = [items];
    }

    const mappedItems: SapContract[] = items.map((item: any) =>
      this.mapSapItemToContract(item)
    );

    this.logger.log(`Parseados ${mappedItems.length} contratos desde SAP`);
    return { items: mappedItems };
  }

  /**
   * Mapea un ITEM de SAP al formato esperado por el SP.
   * Convierte nombres de campos de MAYÚSCULAS a camelCase.
   */
  private mapSapItemToContract(item: any): SapContract {
    return {
      numContrato: item.NUM_CONTRATO?.toString() ?? "",
      objetoContrato: item.OBJETO_CONTRATO?.toString() ?? "",
      fechaInicio: this.convertDateFormat(item.FECHA_INICIO),
      fechaFinal: this.convertDateFormat(item.FECHA_FINAL),
      valorInicial: item.VALOR_INICIAL?.toString() ?? "",
      valorTotal: item.VALOR_TOTAL?.toString() ?? "",
      valorFacturado: item.VALOR_FACTURADO?.toString() ?? "",
      moneda: item.MONEDA?.toString() ?? "",
      codContratista: item.COD_CONTRATISTA?.toString() ?? "",
      nitContratista: item.NIT_CONTRATISTA?.toString() ?? "",
      nombreContratista: item.NOMBRE_CONTRATISTA?.toString() ?? "",
      direccion: item.DIRECCION?.toString() ?? "",
      telefono: item.TELEFONO?.toString() ?? "",
      email: item.EMAIL?.toString() ?? "",
      pedido: item.PEDIDO?.toString() ?? "",
      secretaria: item.SECRETARIA?.toString() ?? "",
      posicion: item.POSICION?.toString() ?? "",
      valorPosicion: item.VALOR_POSICION?.toString() ?? "",
      cdp: item.CDP?.toString() ?? "",
      valorCDP: item.VALOR_CDP?.toString() ?? "",
      proyecto: item.PROYECTO?.toString() ?? "",
      nombreProyecto: item.NOMBRE_PROYECTO?.toString() ?? "",
      totalProyecto: item.TOTAL_PROYECTO?.toString() ?? "",
      programa: item.PROGRAMA?.toString() ?? "",
      nombrePrograma: item.NOMBRE_PROGRAMA?.toString() ?? "",
      estudioPrevio: item.ESTUDIO_PREVIO?.toString() ?? "",
      necesidad: item.NECESIDAD?.toString() ?? "",
      valorNecesidad: item.VALOR_NECESIDAD?.toString() ?? "",
      cantidadPlan: item.CANTIDAD_PLAN?.toString() ?? "",
      unidad: item.UNIDAD?.toString() ?? "",
      valorUnitPlan: item.VALOR_UNIT_PLAN?.toString() ?? "",
      valorTotalPlan: item.VALOR_TOTAL_PLAN?.toString() ?? "",
      modalidad: item.MODALIDAD?.toString() ?? "",
      causal: item.CAUSAL?.toString() ?? "",
      estado: item.ESTADO?.toString() ?? "",
      totalAdicion: item.TOTAL_ADICION?.toString() ?? "",
      totalAmpliacion: item.TOTAL_AMPLIACION?.toString() ?? "",
      pospre: item.POSPRE?.toString() ?? "",
      codigoFondo: item.CODIGOFONDO?.toString() ?? "",
      descripcionFondo: item.DESCRIPCIONFONDO?.toString() ?? "",
      centroGestor: item.CENTROGESTOR?.toString() ?? "",
      descCentroGestor: item.DESCCENTROGESTOR?.toString() ?? "",
    };
  }

  /**
   * Convierte formato de fecha de SAP (DD.MM.YYYY o YYYYMMDD) a formato SP (YYYYMMDD).
   */
  private convertDateFormat(date: any): string {
    if (!date) return "";

    // Asegurar que sea string (fast-xml-parser puede devolver números)
    const dateStr = date.toString().trim();

    // Si ya viene en formato SAP puro YYYYMMDD (8 dígitos) y parece válido
    if (/^\d{8}$/.test(dateStr)) {
      return dateStr;
    }

    // SAP puede devolver DD.MM.YYYY o DD-MM-YYYY
    const parts = dateStr.split(/[.\-/]/);
    if (parts.length !== 3) return dateStr;

    const [day, month, year] = parts;
    return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
  }
}


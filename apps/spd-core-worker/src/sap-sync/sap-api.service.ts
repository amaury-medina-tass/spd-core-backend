import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { XMLParser } from "fast-xml-parser";

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

  constructor(private cfg: ConfigService) {
    this.sapUrl =
      this.cfg.get<string>("sap.url") ??
      "http://spodev.medellin.gov.co:50000/XISOAPAdapter/MessageServlet?senderParty=&senderService=BC_SICGEM&receiverParty=&receiverService=&interface=SI_Contratos_Out&interfaceNamespace=urn%3A%2F%2Fmedellin.gov.co%3ASICGEM%3AConsultaContratos";

    this.sapAuth =
      this.cfg.get<string>("sap.auth") ?? "Basic V1NfU0lDR0VNOlMxQ011SjNyLjIy";

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
      `Consultando SAP: ${fechaInicio} - ${fechaFin} (Secretaría: ${codSecretaria})`
    );

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:med="urn://medellin.gov.co:SICGEM:ConsultaContratos">
    <soapenv:Header/>
    <soapenv:Body>
        <med:MT_Request_Req>
            <COD_SECRETARIA>${codSecretaria}</COD_SECRETARIA>
            <FECHA_INICIAL>${fechaInicio}</FECHA_INICIAL>
            <FECHA_FINAL>${fechaFin}</FECHA_FINAL>
        </med:MT_Request_Req>
    </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(this.sapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        Authorization: this.sapAuth,
      },
      body: soapBody,
    });

    if (!response.ok) {
      throw new Error(`SAP API error: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
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
      numContrato: item.NUM_CONTRATO ?? "",
      objetoContrato: item.OBJETO_CONTRATO ?? "",
      fechaInicio: this.convertDateFormat(item.FECHA_INICIO),
      fechaFinal: this.convertDateFormat(item.FECHA_FIN),
      valorInicial: item.VALOR_INICIAL ?? "",
      valorTotal: item.VALOR_TOTAL ?? "",
      valorFacturado: item.VALOR_FACTURADO ?? "",
      moneda: item.MONEDA ?? "",
      codContratista: item.COD_CONTRATISTA ?? "",
      nitContratista: item.NIT_CONTRATISTA ?? "",
      nombreContratista: item.NOMBRE_CONTRATISTA ?? "",
      direccion: item.DIRECCION ?? "",
      telefono: item.TELEFONO ?? "",
      email: item.EMAIL ?? "",
      pedido: item.PEDIDO ?? "",
      secretaria: item.SECRETARIA ?? "",
      posicion: item.POSICION ?? "",
      valorPosicion: item.VALOR_POSICION ?? "",
      cdp: item.CDP ?? "",
      valorCDP: item.VALOR_CDP ?? "",
      proyecto: item.PROYECTO ?? "",
      nombreProyecto: item.NOMBRE_PROYECTO ?? "",
      totalProyecto: item.TOTAL_PROYECTO ?? "",
      programa: item.PROGRAMA ?? "",
      nombrePrograma: item.NOMBRE_PROGRAMA ?? "",
      estudioPrevio: item.ESTUDIO_PREVIO ?? "",
      necesidad: item.NECESIDAD ?? "",
      valorNecesidad: item.VALOR_NECESIDAD ?? "",
      cantidadPlan: item.CANTIDAD_PLAN ?? "",
      unidad: item.UNIDAD ?? "",
      valorUnitPlan: item.VALOR_UNIT_PLAN ?? "",
      valorTotalPlan: item.VALOR_TOTAL_PLAN ?? "",
      modalidad: item.MODALIDAD ?? "",
      causal: item.CAUSAL ?? "",
      estado: item.ESTADO ?? "",
      totalAdicion: item.TOTAL_ADICION ?? "",
      totalAmpliacion: item.TOTAL_AMPLIACION ?? "",
      pospre: item.POSPRE ?? "",
      codigoFondo: item.CODIGOFONDO ?? "",
      descripcionFondo: item.DESCRIPCIONFONDO ?? "",
      centroGestor: item.CENTROGESTOR ?? "",
      descCentroGestor: item.DESCCENTROGESTOR ?? "",
    };
  }

  /**
   * Convierte formato de fecha de SAP (DD.MM.YYYY) a formato SP (YYYYMMDD).
   */
  private convertDateFormat(date: string | undefined): string {
    if (!date) return "";

    // SAP puede devolver DD.MM.YYYY o DD-MM-YYYY
    const parts = date.split(/[.\-\/]/);
    if (parts.length !== 3) return date;

    const [day, month, year] = parts;
    return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
  }
}

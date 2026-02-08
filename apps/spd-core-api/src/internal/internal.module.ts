import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InternalExportsController } from "./internal-exports.controller";
import { InternalExportsService } from "./internal-exports.service";
import { MgaActivitiesModule } from "../masters/mga-activities/mga-activities.module";
import { CdpsModule } from "../financial/cdps/cdps.module";
import { DetailedActivitiesModule } from "../masters/detailed-activities/detailed-activities.module";
import { ProductsModule } from "../masters/products/products.module";
import { ProjectsModule } from "../financial/projects/projects.module";
import { MgaDetailedRelation } from "../masters/mga-activities/entities/mga-detailed-relation.entity";
import { Cdp } from "../financial/cdps/entities/cdp.entity";
import { CdpPositionFunding } from "../financial/cdps/entities/cdp-position-funding.entity";
import { ContractCdpRelation } from "../financial/contract-cdp-relations/entities/contract-cdp-relation.entity";
import { CdpProject } from "../financial/cdps/entities/cdp-project.entity";

/**
 * Módulo de endpoints internos (server-to-server).
 *
 * Importa los módulos de dominio necesarios para obtener datos
 * y los expone en rutas /internal/* sin autenticación JWT.
 *
 * Estos endpoints son consumidos por spd-files-worker para
 * obtener los datos que necesita para generar archivos de exportación.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MgaDetailedRelation, Cdp, CdpPositionFunding, ContractCdpRelation, CdpProject]),
    MgaActivitiesModule,
    CdpsModule,
    DetailedActivitiesModule,
    ProductsModule,
    ProjectsModule,
  ],
  controllers: [InternalExportsController],
  providers: [InternalExportsService],
})
export class InternalModule {}

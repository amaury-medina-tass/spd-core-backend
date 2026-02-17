import { Controller, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { CdpsService } from "../services/cdps.service";
import { BaseReadPaginatedSelectController } from "../../../shared/controllers";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission("/financial/cdps", "READ")
@Controller("financial/cdps")
export class CdpsController extends BaseReadPaginatedSelectController {
    protected readonly service: CdpsService;
    protected readonly entityLabel = "CDPs";

    constructor(service: CdpsService) {
        super();
        this.service = service;
    }
}

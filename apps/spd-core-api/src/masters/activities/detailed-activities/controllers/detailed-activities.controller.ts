import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../../common/decorators/response-message.decorator";
import { DetailedActivitiesService } from "../services/detailed-activities.service";
import { CreateDetailedActivityDto } from "../dto/create-detailed-activity.dto";
import { UpdateDetailedActivityDto } from "../dto/update-detailed-activity.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/detailed-activities")
export class DetailedActivitiesController {
  constructor(private readonly service: DetailedActivitiesService) {}

  @Post()
  @RequirePermission("masters.activities.create")
  @ResponseMessage("Actividad detallada creada")
  create(@Body() dto: CreateDetailedActivityDto) {
    return this.service.create(dto);
  }

  @Get()
  //@RequirePermission("masters.activities.read")
  @ResponseMessage("Listado de actividades detalladas")
  findAll(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("search") search: string,
    @Query("sortBy") sortBy: string,
    @Query("sortOrder") sortOrder: "ASC" | "DESC"
  ) {
    return this.service.findAllPaginated(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
      sortBy,
      sortOrder
    );
  }

  @Patch(":id")
  @RequirePermission("masters.activities.update")
  @ResponseMessage("Actividad detallada actualizada")
  update(@Param("id") id: string, @Body() dto: UpdateDetailedActivityDto) {
    return this.service.update(id, dto);
  }
}

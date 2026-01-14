import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { RequirePermission } from "../../../../common/decorators/require-permission.decorator";
import { ResponseMessage } from "../../../../common/decorators/response-message.decorator";
import { MgaActivitiesService } from "../services/mga-activities.service";
import { CreateMgaActivityDto } from "../dto/create-mga-activity.dto";
import { UpdateMgaActivityDto } from "../dto/update-mga-activity.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("masters/mga-activities")
export class MgaActivitiesController {
  constructor(private readonly service: MgaActivitiesService) {}

  @Post()
  @RequirePermission("masters.activities.create")
  @ResponseMessage("Actividad MGA creada")
  create(@Body() dto: CreateMgaActivityDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission("masters.activities.read")
  @ResponseMessage("Listado de actividades MGA")
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
  @ResponseMessage("Actividad MGA actualizada")
  update(@Param("id") id: string, @Body() dto: UpdateMgaActivityDto) {
    return this.service.update(id, dto);
  }
}

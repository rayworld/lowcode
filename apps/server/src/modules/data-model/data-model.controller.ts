import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataModelService } from './data-model.service';
import { AuditService } from '../../common/audit/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { getCompatibleTypes } from './field-type-matrix';
import { CreateEntityDto, UpdateEntityDto, CreateFieldDto, UpdateFieldDto } from './dto';

@ApiTags('数据模型')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/entities')
export class DataModelController {
  constructor(
    private dataModelService: DataModelService,
    private auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取应用的所有数据实体' })
  async findEntities(@Param('appId') appId: string) {
    return this.dataModelService.findEntities(appId);
  }

  @Get('relations')
  @ApiOperation({ summary: '获取实体关系图数据 (nodes + edges)' })
  async getRelationGraph(@Param('appId') appId: string) {
    return this.dataModelService.getRelationGraph(appId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据实体详情' })
  async findEntity(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dataModelService.findEntityById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: '创建数据实体' })
  async createEntity(
    @Param('appId') appId: string,
    @Body() dto: CreateEntityDto,
    @CurrentUser('id') userId: string,
  ) {
    const entity = await this.dataModelService.createEntity(appId, dto);
    await this.auditService.logEntityCreated(userId, appId, entity.id, {
      name: entity.name,
      displayName: entity.displayName,
      fieldCount: entity.fields?.length ?? 0,
    });
    return entity;
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据实体' })
  async updateEntity(
    @Param('id') id: string,
    @Body() dto: UpdateEntityDto,
    @CurrentUser('id') userId: string,
  ) {
    const entity = await this.dataModelService.findEntityById(id);
    const updated = await this.dataModelService.updateEntity(id, dto);
    await this.auditService.logEntityUpdated(userId, entity.appId, id, {
      before: { displayName: entity.displayName, description: entity.description },
      after: dto,
    });
    return updated;
  }

  @Post(':id/clone')
  @ApiOperation({ summary: '克隆数据实体（复制实体及其所有字段）' })
  async cloneEntity(
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Body() body: { name?: string },
    @CurrentUser('id') userId: string,
  ) {
    const clone = await this.dataModelService.cloneEntity(id, body.name);
    await this.auditService.log({
      userId, appId,
      action: 'ENTITY_CLONED',
      resource: 'DataEntity',
      resourceId: clone.id,
      detail: { sourceEntityId: id, cloneName: clone.name } as any,
    });
    return clone;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据实体' })
  async removeEntity(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const entity = await this.dataModelService.findEntityById(id);
    const result = await this.dataModelService.removeEntity(id);
    await this.auditService.logEntityDeleted(userId, entity.appId, id, entity.name);
    return result;
  }

  // Field endpoints
  @Post(':entityId/fields')
  @ApiOperation({ summary: '添加字段' })
  async addField(
    @Param('appId') appId: string,
    @Param('entityId') entityId: string,
    @Body() dto: CreateFieldDto,
    @CurrentUser('id') userId: string,
  ) {
    const field = await this.dataModelService.addField(entityId, dto);
    await this.auditService.logFieldAdded(userId, appId, entityId, field.name, field.type);
    return field;
  }

  @Put('fields/:fieldId')
  @ApiOperation({ summary: '更新字段（支持修改类型，自动迁移已有数据）' })
  async updateField(
    @Param('appId') appId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFieldDto,
    @CurrentUser('id') userId: string,
  ) {
    const field = await this.dataModelService.findFieldById(fieldId);
    const updated = await this.dataModelService.updateField(fieldId, dto);
    await this.auditService.logFieldUpdated(userId, appId, fieldId, {
      before: { displayName: field.displayName, required: field.required },
      after: dto,
    });
    return updated;
  }

  @Get('fields/:fieldId/compatible-types')
  @ApiOperation({ summary: '获取字段兼容的类型列表' })
  async getCompatibleTypes(@Param('fieldId') fieldId: string) {
    const field = await this.dataModelService.findFieldById(fieldId);
    return { currentType: field.type, compatibleTypes: getCompatibleTypes(field.type) };
  }

  @Delete('fields/:fieldId')
  @ApiOperation({ summary: '删除字段' })
  async removeField(
    @Param('appId') appId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser('id') userId: string,
  ) {
    const field = await this.dataModelService.findFieldById(fieldId);
    const result = await this.dataModelService.removeField(fieldId);
    await this.auditService.logFieldDeleted(userId, appId, field.entityId, field.name);
    return result;
  }

  @Put(':entityId/fields/reorder')
  @ApiOperation({ summary: '重排序字段（传入字段ID数组，按顺序排序）' })
  async reorderFields(
    @Param('entityId') entityId: string,
    @Body('fieldIds') fieldIds: string[],
  ) {
    return this.dataModelService.reorderFields(entityId, fieldIds);
  }

  // ========== Model Export / Import ==========

  @Get('export/model')
  @ApiOperation({ summary: '导出应用的所有数据模型（JSON 格式，可用于跨环境同步）' })
  async exportModel(@Param('appId') appId: string) {
    return this.dataModelService.exportModel(appId);
  }

  @Post('import/model')
  @ApiOperation({ summary: '导入数据模型（从 JSON 格式创建/更新实体）' })
  async importModel(
    @Param('appId') appId: string,
    @Body() body: { model: any; conflictStrategy?: 'skip' | 'overwrite' | 'rename' },
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dataModelService.importModel(appId, body.model, {
      conflictStrategy: body.conflictStrategy || 'skip',
    });
    await this.auditService.log({
      userId,
      appId,
      action: 'MODEL_IMPORTED',
      resource: 'DataEntity',
      detail: { created: result.created, skipped: result.skipped, overwritten: result.overwritten } as any,
    });
    return result;
  }
}

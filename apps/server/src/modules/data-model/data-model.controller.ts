import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataModelService } from './data-model.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateEntityDto, UpdateEntityDto, CreateFieldDto, UpdateFieldDto } from './dto';

@ApiTags('数据模型')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/entities')
export class DataModelController {
  constructor(private dataModelService: DataModelService) {}

  @Get()
  @ApiOperation({ summary: '获取应用的所有数据实体' })
  async findEntities(@Param('appId') appId: string) {
    return this.dataModelService.findEntities(appId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据实体详情' })
  async findEntity(@Param('id') id: string) {
    return this.dataModelService.findEntityById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建数据实体' })
  async createEntity(@Param('appId') appId: string, @Body() dto: CreateEntityDto) {
    return this.dataModelService.createEntity(appId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据实体' })
  async updateEntity(@Param('id') id: string, @Body() dto: UpdateEntityDto) {
    return this.dataModelService.updateEntity(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据实体' })
  async removeEntity(@Param('id') id: string) {
    return this.dataModelService.removeEntity(id);
  }

  // Field endpoints
  @Post(':entityId/fields')
  @ApiOperation({ summary: '添加字段' })
  async addField(@Param('entityId') entityId: string, @Body() dto: CreateFieldDto) {
    return this.dataModelService.addField(entityId, dto);
  }

  @Put('fields/:fieldId')
  @ApiOperation({ summary: '更新字段' })
  async updateField(@Param('fieldId') fieldId: string, @Body() dto: UpdateFieldDto) {
    return this.dataModelService.updateField(fieldId, dto);
  }

  @Delete('fields/:fieldId')
  @ApiOperation({ summary: '删除字段' })
  async removeField(@Param('fieldId') fieldId: string) {
    return this.dataModelService.removeField(fieldId);
  }
}

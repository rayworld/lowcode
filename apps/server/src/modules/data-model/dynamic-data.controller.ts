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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DynamicDataService } from './dynamic-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('动态数据')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('entities/:entityId/data')
export class DynamicDataController {
  constructor(private dynamicDataService: DynamicDataService) {}

  @Get()
  @ApiOperation({ summary: '获取数据记录列表' })
  async findAll(
    @Param('entityId') entityId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.dynamicDataService.findRecords(entityId, page, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据记录详情' })
  async findOne(@Param('entityId') entityId: string, @Param('id') id: string) {
    return this.dynamicDataService.findRecordById(entityId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建数据记录' })
  async create(
    @Param('entityId') entityId: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.dynamicDataService.createRecord(entityId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据记录' })
  async update(
    @Param('entityId') entityId: string,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.dynamicDataService.updateRecord(entityId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据记录' })
  async remove(@Param('entityId') entityId: string, @Param('id') id: string) {
    return this.dynamicDataService.deleteRecord(entityId, id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DynamicDataService } from './dynamic-data.service';
import { AuditService } from '../../common/audit/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('动态数据')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('entities/:entityId/data')
export class DynamicDataController {
  constructor(
    private dynamicDataService: DynamicDataService,
    private auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取数据记录列表（支持过滤/排序/搜索/游标分页）' })
  async findAll(
    @Param('entityId') entityId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('sort') sort?: string,
    @Query('filter') filter?: string,
    @Query('q') q?: string,
    @Query('query') query?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @CurrentUser('id') userId?: string,
  ) {
    return this.dynamicDataService.findRecords(entityId, page, pageSize, { sort, filter, q, query, cursor, limit, userId });
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
    @CurrentUser('id') userId: string,
  ) {
    const record = await this.dynamicDataService.createRecord(entityId, data, userId);
    await this.auditService.logRecordCreated(userId, entityId, record.id);
    return record;
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据记录' })
  async update(
    @Param('entityId') entityId: string,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
    @CurrentUser('id') userId: string,
  ) {
    const record = await this.dynamicDataService.updateRecord(entityId, id, data);
    await this.auditService.logRecordUpdated(userId, entityId, id);
    return record;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据记录' })
  async remove(
    @Param('entityId') entityId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.dynamicDataService.deleteRecord(entityId, id);
    await this.auditService.logRecordDeleted(userId, entityId, id);
    return result;
  }

  @Get('export/csv')
  @ApiOperation({ summary: '导出为 CSV（分批拉取，支持大数据量）' })
  async exportCsv(
    @Param('entityId') entityId: string,
    @Res() res: Response,
    @Query('maxRecords') maxRecords?: number,
  ) {
    const result = await this.dynamicDataService.exportRecords(entityId, maxRecords || 100000);
    const { items, entity, total, truncated } = result as any;
    const fields = entity.fields || [];
    const fieldNames = fields.map((f: any) => f.name);

    // 正确转义 CSV 值
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      let str: string;
      if (typeof val === 'object') str = JSON.stringify(val);
      else str = String(val);
      // 如果包含逗号、引号或换行，需要包裹引号并转义内部引号
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const BOM = '﻿';
    let csv = BOM + fieldNames.map((n: string) => escapeCsv(n)).join(',');

    for (const item of items) {
      csv += '\n' + fieldNames.map((name: string) => escapeCsv(item[name])).join(',');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${entity.displayName || entity.name}_${new Date().toISOString().slice(0, 10)}.csv"`);
    if (truncated) {
      res.setHeader('X-Export-Truncated', 'true');
      res.setHeader('X-Export-Total', String(total));
    }
    res.send(csv);
  }
}

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
  @ApiOperation({ summary: '导出为 CSV' })
  async exportCsv(@Param('entityId') entityId: string, @Res() res: Response) {
    const { items, entity } = await this.dynamicDataService.exportRecords(entityId) as any;

    const fields = entity.fields || [];
    const headers = fields.map((f: any) => f.displayName || f.name);
    const fieldNames = fields.map((f: any) => f.name);

    const BOM = '﻿';
    const csvRows: string[] = [headers.join(',')];

    for (const item of items) {
      const row = fieldNames.map((name: string) => {
        let val = (item as any)[name];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(row.join(','));
    }

    const csv = BOM + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${entity.displayName || entity.name}_数据导出.csv"`);
    res.send(csv);
  }
}

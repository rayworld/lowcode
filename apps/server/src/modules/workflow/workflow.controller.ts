import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateWorkflowDto, UpdateWorkflowDto } from '@lowcode/shared';

@ApiTags('工作流')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/workflows')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get()
  @ApiOperation({ summary: '获取应用的所有工作流' })
  async findByApp(@Param('appId') appId: string) {
    return this.workflowService.findByAppId(appId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工作流详情' })
  async findOne(@Param('id') id: string) {
    return this.workflowService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建工作流' })
  async create(@Body() dto: CreateWorkflowDto, @CurrentUser('id') userId: string) {
    return this.workflowService.create(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新工作流' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowService.update(id, dto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: '启用/禁用工作流' })
  async toggle(@Param('id') id: string) {
    return this.workflowService.toggleEnabled(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: '手动执行工作流' })
  async execute(@Param('id') id: string, @Body('input') input?: Record<string, unknown>) {
    return this.workflowService.execute(id, input);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '获取工作流执行日志' })
  async logs(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.workflowService.getLogs(id, page, pageSize);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工作流' })
  async remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }
}

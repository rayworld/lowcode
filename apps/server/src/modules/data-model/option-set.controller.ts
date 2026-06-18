import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OptionSetService } from './option-set.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('选项集')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/option-sets')
export class OptionSetController {
  constructor(private optionSetService: OptionSetService) {}

  @Get()
  @ApiOperation({ summary: '获取应用的所有选项集' })
  async findAll(@Param('appId') appId: string) {
    return this.optionSetService.findAll(appId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取选项集详情' })
  async findById(@Param('id') id: string) {
    return this.optionSetService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建选项集' })
  async create(@Param('appId') appId: string, @Body() body: { name: string; displayName?: string; options: any[]; description?: string }) {
    return this.optionSetService.create(appId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新选项集' })
  async update(@Param('id') id: string, @Body() body: { displayName?: string; options?: any[]; description?: string }) {
    return this.optionSetService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除选项集' })
  async remove(@Param('id') id: string) {
    return this.optionSetService.remove(id);
  }
}

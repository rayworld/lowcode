import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComponentService } from './component.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('组件注册表')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('components')
export class ComponentController {
  constructor(private componentService: ComponentService) {}

  @Get()
  @ApiOperation({ summary: '获取所有注册组件' })
  async findAll(@Query('category') category?: string) {
    return this.componentService.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取组件详情' })
  async findOne(@Param('id') id: string) {
    return this.componentService.findById(id);
  }

  @Post('seed')
  @ApiOperation({ summary: '初始化内置组件' })
  async seed() {
    return this.componentService.seedBuiltInComponents();
  }
}

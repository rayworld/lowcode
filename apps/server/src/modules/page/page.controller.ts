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
import { PageService } from './page.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePageDto, UpdatePageDto } from '@lowcode/shared';

@ApiTags('页面')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/pages')
export class PageController {
  constructor(private pageService: PageService) {}

  @Get()
  @ApiOperation({ summary: '获取应用的所有页面' })
  async findByApp(@Param('appId') appId: string) {
    return this.pageService.findByAppId(appId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取页面详情' })
  async findOne(@Param('id') id: string) {
    return this.pageService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建页面' })
  async create(@Body() dto: CreatePageDto, @CurrentUser('id') userId: string) {
    return this.pageService.create(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新页面' })
  async update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pageService.update(id, dto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布页面' })
  async publish(@Param('id') id: string) {
    return this.pageService.publish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除页面' })
  async remove(@Param('id') id: string) {
    return this.pageService.remove(id);
  }
}

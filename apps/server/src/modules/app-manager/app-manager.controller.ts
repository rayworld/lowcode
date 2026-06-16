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
import { AppManagerService } from './app-manager.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAppDto, UpdateAppDto } from '@lowcode/shared';

@ApiTags('应用管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps')
export class AppManagerController {
  constructor(private appManagerService: AppManagerService) {}

  @Get()
  @ApiOperation({ summary: '获取应用列表' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.appManagerService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取应用详情' })
  async findOne(@Param('id') id: string) {
    return this.appManagerService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建应用' })
  async create(@Body() dto: CreateAppDto, @CurrentUser('id') userId: string) {
    return this.appManagerService.create(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新应用' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppDto) {
    return this.appManagerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除应用' })
  async remove(@Param('id') id: string) {
    return this.appManagerService.remove(id);
  }
}

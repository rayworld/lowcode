import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModelVersionService } from './model-version.service';
import { AuditService } from '../../common/audit/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('模型版本')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/entities/:entityId/versions')
export class ModelVersionController {
  constructor(
    private versionService: ModelVersionService,
    private auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取实体的所有版本' })
  async listVersions(@Param('entityId') entityId: string) {
    return this.versionService.listVersions(entityId);
  }

  @Get(':version')
  @ApiOperation({ summary: '获取指定版本的快照详情' })
  async getVersion(
    @Param('entityId') entityId: string,
    @Param('version') version: string,
  ) {
    return this.versionService.getVersion(entityId, parseInt(version, 10));
  }

  @Post('snapshot')
  @ApiOperation({ summary: '手动创建版本快照' })
  async takeSnapshot(
    @Param('appId') appId: string,
    @Param('entityId') entityId: string,
    @Body() body: { comment?: string },
    @CurrentUser('id') userId: string,
  ) {
    await this.versionService.takeSnapshot(entityId, body.comment, userId);
    await this.auditService.log({
      userId,
      appId,
      action: 'SNAPSHOT_CREATED',
      resource: 'ModelSnapshot',
      resourceId: entityId,
      detail: { comment: body.comment },
    });
    return { success: true };
  }

  @Post('compare')
  @ApiOperation({ summary: '比较两个版本的差异' })
  async compareVersions(
    @Param('entityId') entityId: string,
    @Body() body: { fromVersion: number; toVersion: number },
  ) {
    return this.versionService.compareVersions(entityId, body.fromVersion, body.toVersion);
  }

  @Post(':version/restore')
  @ApiOperation({ summary: '恢复到指定版本' })
  async restoreVersion(
    @Param('appId') appId: string,
    @Param('entityId') entityId: string,
    @Param('version') version: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.versionService.restoreVersion(entityId, parseInt(version, 10), userId);
    await this.auditService.log({
      userId,
      appId,
      action: 'VERSION_RESTORED',
      resource: 'ModelSnapshot',
      resourceId: entityId,
      detail: { restoredToVersion: parseInt(version, 10) },
    });
    return { success: true, message: `已恢复到版本 ${version}` };
  }
}

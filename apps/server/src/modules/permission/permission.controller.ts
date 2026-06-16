import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRoleDto, UpdateRoleDto, PermissionAction } from '@lowcode/shared';

@ApiTags('权限')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/roles')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: '获取应用的所有角色' })
  async findRoles(@Param('appId') appId: string) {
    return this.permissionService.findRoles(appId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async findRole(@Param('id') id: string) {
    return this.permissionService.findRoleById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  async createRole(@Param('appId') appId: string, @Body() dto: CreateRoleDto) {
    return this.permissionService.createRole(appId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.permissionService.updateRole(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async removeRole(@Param('id') id: string) {
    return this.permissionService.removeRole(id);
  }

  @Post(':roleId/permissions')
  @ApiOperation({ summary: '添加权限' })
  async addPermission(
    @Param('roleId') roleId: string,
    @Body('resource') resource: string,
    @Body('action') action: PermissionAction,
    @Body('conditions') conditions?: Record<string, unknown>,
  ) {
    return this.permissionService.addPermission(roleId, resource, action, conditions);
  }

  @Delete('permissions/:permId')
  @ApiOperation({ summary: '删除权限' })
  async removePermission(@Param('permId') id: string) {
    return this.permissionService.removePermission(id);
  }
}

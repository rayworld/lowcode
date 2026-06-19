import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRoleDto, UpdateRoleDto, PermissionAction, AddUserToRoleDto } from '@lowcode/shared';

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

  // ====== Member management ======

  @Get('members/list')
  @ApiOperation({ summary: '获取应用所有成员及其角色' })
  async findMembers(@Param('appId') appId: string) {
    return this.permissionService.findMembers(appId);
  }

  @Get('members/effective')
  @ApiOperation({ summary: '获取当前用户在应用中的聚合权限' })
  async getEffectivePermissions(
    @Param('appId') appId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.permissionService.getEffectivePermissions(userId, appId);
  }

  @Post(':roleId/members')
  @ApiOperation({ summary: '添加用户到角色' })
  async addUserToRole(
    @Param('roleId') roleId: string,
    @Body() dto: AddUserToRoleDto,
  ) {
    return this.permissionService.addUserToRole(roleId, dto.userId);
  }

  @Delete(':roleId/members/:userId')
  @ApiOperation({ summary: '从角色移除用户' })
  async removeUserFromRole(
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    return this.permissionService.removeUserFromRole(roleId, userId);
  }
}

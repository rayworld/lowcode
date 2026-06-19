import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from '@lowcode/shared';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async findRoles(appId: string) {
    return this.prisma.appRole.findMany({
      where: { appId },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });
  }

  async findRoleById(id: string) {
    const role = await this.prisma.appRole.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: { include: { user: { select: { id: true, username: true, email: true } } } },
      },
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async createRole(appId: string, dto: CreateRoleDto) {
    return this.prisma.appRole.create({
      data: {
        appId,
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions
          ? { create: dto.permissions.map((p) => ({ ...p, conditions: p.conditions as any })) }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findRoleById(id);
    return this.prisma.appRole.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: { permissions: true },
    });
  }

  async removeRole(id: string) {
    await this.findRoleById(id);
    await this.prisma.appRole.delete({ where: { id } });
    return { deleted: true };
  }

  async addPermission(roleId: string, resource: string, action: string, conditions?: Record<string, unknown>) {
    return this.prisma.permission.create({
      data: { roleId, resource, action, conditions: conditions as any },
    });
  }

  async removePermission(id: string) {
    await this.prisma.permission.delete({ where: { id } });
    return { deleted: true };
  }

  // ====== Member management ======

  /** Get all users with their assigned roles in an app */
  async findMembers(appId: string) {
    const roles = await this.prisma.appRole.findMany({
      where: { appId },
      include: { users: true },
    });

    // Build a map of userId -> role names
    const userRoleMap = new Map<string, { roleId: string; roleName: string }[]>();
    for (const role of roles) {
      for (const ur of role.users) {
        if (!userRoleMap.has(ur.userId)) userRoleMap.set(ur.userId, []);
        userRoleMap.get(ur.userId)!.push({ roleId: role.id, roleName: role.name });
      }
    }

    const userIds = Array.from(userRoleMap.keys());
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true, avatar: true, role: true, isActive: true },
    });

    return users.map((u) => ({
      ...u,
      appRoles: userRoleMap.get(u.id) || [],
    }));
  }

  /** Get effective permissions for a user in an app (aggregated across all assigned roles) */
  async getEffectivePermissions(userId: string, appId: string) {
    const userRoles = await this.prisma.userAppRole.findMany({
      where: {
        userId,
        role: { appId },
      },
      include: {
        role: { include: { permissions: true } },
      },
    });

    // Aggregate unique permissions across all roles
    const permMap = new Map<string, typeof userRoles[0]['role']['permissions'][0]>();
    for (const ur of userRoles) {
      for (const perm of ur.role.permissions) {
        const key = `${perm.resource}:${perm.action}`;
        if (!permMap.has(key)) {
          permMap.set(key, perm);
        }
      }
    }

    return Array.from(permMap.values());
  }

  /** Add a user to a role */
  async addUserToRole(roleId: string, userId: string) {
    const role = await this.prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('角色不存在');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    // Check if already exists
    const existing = await this.prisma.userAppRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (existing) throw new ConflictException('该用户已在此角色中');

    return this.prisma.userAppRole.create({
      data: { userId, roleId },
    });
  }

  /** Remove a user from a role */
  async removeUserFromRole(roleId: string, userId: string) {
    const existing = await this.prisma.userAppRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!existing) throw new NotFoundException('该用户不在这个角色中');

    await this.prisma.userAppRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
    return { deleted: true };
  }
}

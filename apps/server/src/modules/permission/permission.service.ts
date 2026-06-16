import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from '@lowcode/shared';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async findRoles(appId: string) {
    return this.prisma.appRole.findMany({
      where: { appId },
      include: { permissions: true },
    });
  }

  async findRoleById(id: string) {
    const role = await this.prisma.appRole.findUnique({
      where: { id },
      include: { permissions: true },
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
}

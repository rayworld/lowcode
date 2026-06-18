import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Data permission service that integrates the existing Role/Permission
 * system with dynamic data operations for field-level and row-level access control.
 */
@Injectable()
export class DataPermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the set of field names a user is allowed to read for a given entity.
   * If no specific field permissions exist, all fields are accessible.
   */
  async getReadableFields(userId: string, appId: string, entityId: string): Promise<string[] | null> {
    return this.getAccessibleFields(userId, appId, entityId, 'read');
  }

  /**
   * Get the set of field names a user is allowed to write for a given entity.
   * If no specific field permissions exist, all fields are accessible.
   */
  async getWritableFields(userId: string, appId: string, entityId: string): Promise<string[] | null> {
    return this.getAccessibleFields(userId, appId, entityId, 'update');
  }

  /**
   * Build additional Prisma where conditions for row-level access control.
   * Parses permission conditions like { "createdById": "$user.id" }
   */
  async buildRowFilter(userId: string, appId: string, resource: string): Promise<any[] | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return null;

    // Admin sees everything
    if (user.role === 'ADMIN') return null;

    // Get user's role in this app
    const userRole = await this.prisma.appRole.findFirst({
      where: { appId },
      include: {
        permissions: {
          where: { resource, action: 'read' },
        },
      },
    });
    if (!userRole) return null;

    const conditions: any[] = [];
    for (const perm of userRole.permissions) {
      if (!perm.conditions) continue;
      const cond = perm.conditions as Record<string, unknown>;
      const rowFilter = this.resolveCondition(cond, userId);
      if (rowFilter) conditions.push(rowFilter);
    }

    return conditions.length > 0 ? conditions : null;
  }

  /** Get accessible fields for a specific action */
  private async getAccessibleFields(
    userId: string,
    appId: string,
    entityId: string,
    action: string,
  ): Promise<string[] | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return null;

    // Admin has access to all fields
    if (user.role === 'ADMIN') return null;

    // Get field-level permissions for this role
    const userRole = await this.prisma.appRole.findFirst({
      where: { appId },
      include: {
        permissions: {
          where: {
            resource: `Field:${entityId}`,
            action,
          },
        },
      },
    });
    if (!userRole) return null;

    // If explicit field permissions exist, extract allowed field names
    const fieldPerms = userRole.permissions.filter((p) => {
      const cond = p.conditions as Record<string, unknown> | null;
      return cond?.fieldName && typeof cond.fieldName === 'string';
    });

    if (fieldPerms.length > 0) {
      return fieldPerms.map((p) => (p.conditions as any).fieldName);
    }

    return null; // null means all fields accessible
  }

  /** Resolve a condition template with user context */
  private resolveCondition(condition: Record<string, unknown>, userId: string): any {
    const result: any = {};

    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === 'string' && value === '$user.id') {
        // Resolve to current user ID
        result[key] = userId;
      } else if (typeof value === 'string' && value.startsWith('$user.')) {
        // Other user attribute references - skip resolving for now
        continue;
      } else {
        result[key] = value;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}

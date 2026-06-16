import { UserRole, PermissionAction } from '../enums';

export interface Role {
  id: string;
  name: UserRole | string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  roleId: string;
  resource: string;
  action: PermissionAction;
  conditions?: Record<string, unknown>;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions?: Omit<Permission, 'id' | 'roleId'>[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: Omit<Permission, 'id' | 'roleId'>[];
}

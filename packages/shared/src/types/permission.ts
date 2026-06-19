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

/** A user's membership in an app role */
export interface UserAppRole {
  userId: string;
  roleId: string;
}

/** User info with assigned app roles (for member management) */
export interface AppRoleMember {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  appRoles: { roleId: string; roleName: string }[];
}

/** DTO to add a user to a role */
export interface AddUserToRoleDto {
  userId: string;
}

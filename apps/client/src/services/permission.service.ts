import api from './api';
import { Role, CreateRoleDto, UpdateRoleDto, PermissionAction, AppRoleMember, AddUserToRoleDto } from '@lowcode/shared';

export const permissionService = {
  findRoles: (appId: string) =>
    api.get<Role[]>(`/apps/${appId}/roles`),

  findRoleById: (appId: string, id: string) =>
    api.get<Role>(`/apps/${appId}/roles/${id}`),

  createRole: (appId: string, dto: CreateRoleDto) =>
    api.post<Role>(`/apps/${appId}/roles`, dto),

  updateRole: (appId: string, id: string, dto: UpdateRoleDto) =>
    api.put<Role>(`/apps/${appId}/roles/${id}`, dto),

  removeRole: (appId: string, id: string) =>
    api.delete(`/apps/${appId}/roles/${id}`),

  addPermission: (
    appId: string,
    roleId: string,
    resource: string,
    action: PermissionAction,
    conditions?: Record<string, unknown>,
  ) =>
    api.post(`/apps/${appId}/roles/${roleId}/permissions`, { resource, action, conditions }),

  removePermission: (appId: string, permId: string) =>
    api.delete(`/apps/${appId}/roles/permissions/${permId}`),

  // ====== Member management ======

  findMembers: (appId: string) =>
    api.get<AppRoleMember[]>(`/apps/${appId}/roles/members/list`),

  addUserToRole: (appId: string, roleId: string, dto: AddUserToRoleDto) =>
    api.post(`/apps/${appId}/roles/${roleId}/members`, dto),

  removeUserFromRole: (appId: string, roleId: string, userId: string) =>
    api.delete(`/apps/${appId}/roles/${roleId}/members/${userId}`),
};

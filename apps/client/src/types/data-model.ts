// ============================================================
// 数据建模模块 — 完整类型定义
// ============================================================

import { FieldType, RelationType } from '@lowcode/shared';

// ─── 字段验证规则 ───────────────────────────────────────────
export interface FieldValidationRule {
  /** 验证类型 */
  type: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  /** 参数值（pattern 时为正则字符串，min/max 时为数字） */
  value?: string | number;
  /** 自定义错误消息 */
  message?: string;
}

// ─── 字段选项 ───────────────────────────────────────────────
export interface FieldOption {
  label: string;
  value: string;
  color?: string;
}

// ─── 实体字段 ───────────────────────────────────────────────
export interface EntityField {
  id: string;
  name: string;
  displayName: string;
  type: FieldType | string;
  description?: string;
  required: boolean;
  unique: boolean;
  isList: boolean;
  defaultValue?: string;
  order: number;

  // 关联相关
  relationTo?: string;
  relationType?: RelationType;

  // SELECT / MULTI_SELECT 选项
  options?: FieldOption[];

  // 验证规则
  validationRules?: FieldValidationRule[];

  // 占位符 / 帮助提示
  placeholder?: string;
  helpText?: string;

  // 元数据
  createdAt?: string;
  updatedAt?: string;
}

// ─── 实体 ───────────────────────────────────────────────────
export interface Entity {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  fields: EntityField[];
  appId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    records: number;
  };
}

// ─── 创建实体请求 ───────────────────────────────────────────
export interface CreateEntityRequest {
  name: string;
  displayName?: string;
  description?: string;
  fields?: CreateFieldRequest[];
}

// ─── 创建字段请求 ───────────────────────────────────────────
export interface CreateFieldRequest {
  name: string;
  displayName?: string;
  type: FieldType | string;
  required?: boolean;
  unique?: boolean;
  isList?: boolean;
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  relationTo?: string;
  relationType?: RelationType;
  options?: FieldOption[];
  validationRules?: FieldValidationRule[];
}

// ─── 更新字段请求 ───────────────────────────────────────────
export interface UpdateFieldRequest extends Partial<CreateFieldRequest> {
  id?: string;
}

// ─── API 通用响应 ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

// ─── 实体列表响应 ───────────────────────────────────────────
export interface EntityListResponse {
  items: Entity[];
  total: number;
}

// ─── 版本管理 ───────────────────────────────────────────────
export interface EntityVersion {
  version: number;
  comment?: string;
  snapshot?: Record<string, unknown>;
  createdAt: string;
}

export interface VersionListResponse {
  versions: EntityVersion[];
  currentVersion: number;
}

export interface VersionCompareRequest {
  fromVersion: number;
  toVersion: number;
}

export interface VersionChange {
  type: 'added' | 'removed' | 'modified';
  field: string;
  from?: unknown;
  to?: unknown;
}

export interface VersionCompareResult {
  fromVersion: number;
  toVersion: number;
  changeCount: number;
  changes: VersionChange[];
}

// ─── 代码生成 ───────────────────────────────────────────────
export interface CodeGenResult {
  typescript: string;
  formComponent: string;
  tableComponent: string;
}

// ─── 记录（数据浏览） ───────────────────────────────────────
export interface RecordItem {
  id: string;
  [key: string]: unknown;
}

export interface RecordListResponse {
  items: RecordItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  filter?: string;
  q?: string;
  query?: string;
}

// ─── 字段类型变更 ───────────────────────────────────────────
export interface CompatibleType {
  toType: string;
  description: string;
  safe: boolean;
}

export interface CompatibleTypesResponse {
  currentType: string;
  compatibleTypes: CompatibleType[];
}

// ─── 模型导入/导出 ──────────────────────────────────────────
export interface ModelExportData {
  entities: CreateEntityRequest[];
  entityCount: number;
  exportedAt: string;
}

export interface ModelImportResult {
  created: number;
  skipped: number;
  overwritten: number;
  errors?: string[];
}

export type ImportConflictStrategy = 'skip' | 'overwrite' | 'rename';

// ─── 字段排序 ───────────────────────────────────────────────
export interface FieldReorderRequest {
  fieldIds: string[];
}

// ─── 实体克隆 ───────────────────────────────────────────────
export interface CloneEntityRequest {
  name?: string;
}

// ─── CSV 导入结果 ───────────────────────────────────────────
export interface CsvImportResult {
  entityName: string;
  displayName: string;
  fieldCount: number;
}

// ─── 选项集 ─────────────────────────────────────────────────
export interface OptionSet {
  id: string;
  name: string;
  displayName: string;
  options: FieldOption[];
  appId: string;
  fieldCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── ERD 布局 ───────────────────────────────────────────────
export interface EntityLayoutPosition {
  x: number;
  y: number;
}

export interface EntityLayoutMap {
  [entityId: string]: EntityLayoutPosition;
}

// ─── 模型模板 ───────────────────────────────────────────────
export interface CreateEntityWithFieldsRequest extends CreateEntityRequest {
  fields: CreateFieldRequest[];
}

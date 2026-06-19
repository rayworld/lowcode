import { create } from 'zustand';
import { entityService } from '../services/entity.service';
import type {
  Entity,
  EntityVersion,
  VersionChange,
  EntityField,
  CreateEntityRequest,
  CreateFieldRequest,
  UpdateFieldRequest,
  VersionCompareResult,
} from '../types';

// ─── 状态类型 ───────────────────────────────────────────────
interface EntityState {
  // ── 实体列表 ──
  entities: Entity[];
  entitiesLoading: boolean;
  entitiesError: string | null;

  // ── 当前实体（含字段） ──
  currentEntity: Entity | null;
  currentEntityLoading: boolean;
  currentEntityError: string | null;

  // ── 所有实体引用（用于关联选择器） ──
  allEntities: Entity[];
  allEntitiesLoading: boolean;

  // ── 版本管理 ──
  versions: EntityVersion[];
  versionsLoading: boolean;
  compareResult: VersionCompareResult | null;

  // ── 字段排序（本地状态） ──
  fieldOrder: string[];

  // ── 操作 ──

  // 实体列表
  fetchEntities: (appId: string) => Promise<void>;
  fetchAllEntities: (appId: string) => Promise<void>;

  // 当前实体
  fetchCurrentEntity: (appId: string, entityId: string) => Promise<void>;
  clearCurrentEntity: () => void;

  // 实体 CRUD
  createEntity: (appId: string, data: CreateEntityRequest) => Promise<Entity>;
  deleteEntity: (appId: string, id: string) => Promise<void>;
  cloneEntity: (appId: string, id: string) => Promise<void>;

  // 字段 CRUD
  addField: (appId: string, entityId: string, data: CreateFieldRequest) => Promise<void>;
  updateField: (appId: string, fieldId: string, data: UpdateFieldRequest) => Promise<void>;
  deleteField: (appId: string, fieldId: string) => Promise<void>;

  // 字段排序
  setFieldOrder: (order: string[]) => void;
  moveField: (fromIndex: number, toIndex: number) => void;
  saveFieldOrder: (appId: string, entityId: string) => Promise<void>;

  // 版本
  fetchVersions: (appId: string, entityId: string) => Promise<void>;
  takeSnapshot: (appId: string, entityId: string, comment?: string) => Promise<void>;
  compareVersions: (appId: string, entityId: string, from: number, to: number) => Promise<void>;
  restoreVersion: (appId: string, entityId: string, version: number) => Promise<void>;
  clearCompareResult: () => void;
}

// ─── Store 实现 ─────────────────────────────────────────────
export const useEntityStore = create<EntityState>((set, get) => ({
  // ── 初始状态 ──
  entities: [],
  entitiesLoading: false,
  entitiesError: null,

  currentEntity: null,
  currentEntityLoading: false,
  currentEntityError: null,

  allEntities: [],
  allEntitiesLoading: false,

  versions: [],
  versionsLoading: false,
  compareResult: null,

  fieldOrder: [],

  // ── 实体列表 ──
  fetchEntities: async (appId: string) => {
    set({ entitiesLoading: true, entitiesError: null });
    try {
      const res = await entityService.findAll(appId);
      set({ entities: res.data || [], entitiesLoading: false });
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || '获取实体列表失败';
      set({ entitiesError: message, entitiesLoading: false });
    }
  },

  fetchAllEntities: async (appId: string) => {
    set({ allEntitiesLoading: true });
    try {
      const res = await entityService.findAll(appId);
      set({ allEntities: res.data || [], allEntitiesLoading: false });
    } catch {
      set({ allEntitiesLoading: false });
    }
  },

  // ── 当前实体 ──
  fetchCurrentEntity: async (appId: string, entityId: string) => {
    set({ currentEntityLoading: true, currentEntityError: null });
    try {
      const res = await entityService.findById(appId, entityId);
      const entity = res.data as Entity;
      set({
        currentEntity: entity,
        currentEntityLoading: false,
        fieldOrder: entity.fields?.map((f: EntityField) => f.id) || [],
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || '获取实体详情失败';
      set({ currentEntityError: message, currentEntityLoading: false });
    }
  },

  clearCurrentEntity: () => {
    set({ currentEntity: null, currentEntityLoading: false, currentEntityError: null, fieldOrder: [] });
  },

  // ── 实体 CRUD ──
  createEntity: async (appId, data) => {
    const res = await entityService.create(appId, data);
    await get().fetchEntities(appId);
    return res.data as Entity;
  },

  deleteEntity: async (appId, id) => {
    await entityService.remove(appId, id);
    // 乐观移除
    set((s) => ({ entities: s.entities.filter((e) => e.id !== id) }));
  },

  cloneEntity: async (appId, id) => {
    await entityService.cloneEntity(appId, id);
    await get().fetchEntities(appId);
  },

  // ── 字段 CRUD ──
  addField: async (appId, entityId, data) => {
    await entityService.addField(appId, entityId, data);
    // 刷新当前实体
    await get().fetchCurrentEntity(appId, entityId);
  },

  updateField: async (appId, fieldId, data) => {
    await entityService.updateField(appId, fieldId, data);
    // 更新本地字段（乐观更新）
    const entity = get().currentEntity;
    if (entity) {
      set({
        currentEntity: {
          ...entity,
          fields: entity.fields.map((f) =>
            f.id === fieldId ? { ...f, ...data } : f
          ),
        },
      });
    }
  },

  deleteField: async (appId, fieldId) => {
    await entityService.removeField(appId, fieldId);
    // 从本地移除
    const entity = get().currentEntity;
    if (entity) {
      set({
        currentEntity: {
          ...entity,
          fields: entity.fields.filter((f) => f.id !== fieldId),
        },
        fieldOrder: get().fieldOrder.filter((id) => id !== fieldId),
      });
    }
  },

  // ── 字段排序 ──
  setFieldOrder: (order) => set({ fieldOrder: order }),

  moveField: (fromIndex, toIndex) => {
    const order = [...get().fieldOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    set({ fieldOrder: order });
  },

  saveFieldOrder: async (appId, entityId) => {
    const order = get().fieldOrder;
    await entityService.reorderFields(appId, entityId, order);
    await get().fetchCurrentEntity(appId, entityId);
  },

  // ── 版本管理 ──
  fetchVersions: async (appId, entityId) => {
    set({ versionsLoading: true });
    try {
      const res = await entityService.listVersions(appId, entityId);
      set({ versions: res.data?.versions || [], versionsLoading: false });
    } catch {
      set({ versionsLoading: false });
    }
  },

  takeSnapshot: async (appId, entityId, comment) => {
    await entityService.takeSnapshot(appId, entityId, comment);
    await get().fetchVersions(appId, entityId);
  },

  compareVersions: async (appId, entityId, from, to) => {
    try {
      const res = await entityService.compareVersions(appId, entityId, from, to);
      set({ compareResult: res.data });
    } catch {
      // handled globally
    }
  },

  restoreVersion: async (appId, entityId, version) => {
    await entityService.restoreVersion(appId, entityId, version);
    await get().fetchVersions(appId, entityId);
    await get().fetchCurrentEntity(appId, entityId);
  },

  clearCompareResult: () => set({ compareResult: null }),
}));

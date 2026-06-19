import { useCallback, useState } from 'react';
import { message } from 'antd';
import { useEntityStore } from '../stores/entityStore';
import { entityService } from '../services/entity.service';
import type { CreateFieldRequest, UpdateFieldRequest, CompatibleType } from '../types';
import { getFieldTypeConfig, recommendFieldType } from '../config/field-type.config';

/**
 * 字段管理 Hook —— 字段 CRUD、排序、类型变更、智能推荐
 */
export function useFields(appId?: string, entityId?: string) {
  const store = useEntityStore();

  const {
    fieldOrder,
    currentEntity,
  } = store;

  // ── 新增字段 ──
  const addField = useCallback(async (data: CreateFieldRequest) => {
    if (!appId || !entityId) return;
    try {
      await store.addField(appId, entityId, data);
      message.success('字段添加成功');
    } catch (err: any) {
      message.error('添加字段失败: ' + (err?.response?.data?.message || err.message));
      throw err;
    }
  }, [appId, entityId]);

  // ── 更新字段 ──
  const updateField = useCallback(async (fieldId: string, data: UpdateFieldRequest) => {
    if (!appId) return;
    try {
      await store.updateField(appId, fieldId, data);
    } catch (err: any) {
      message.error('更新字段失败: ' + (err?.response?.data?.message || err.message));
      throw err;
    }
  }, [appId]);

  // ── 删除字段 ──
  const deleteField = useCallback(async (fieldId: string) => {
    if (!appId) return;
    try {
      await store.deleteField(appId, fieldId);
      message.success('字段已删除');
    } catch (err: any) {
      message.error('删除字段失败: ' + (err?.response?.data?.message || err.message));
      throw err;
    }
  }, [appId]);

  // ── 字段排序 ──
  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    store.moveField(fromIndex, toIndex);
  }, []);

  const saveOrder = useCallback(async () => {
    if (!appId || !entityId) return;
    try {
      await store.saveFieldOrder(appId, entityId);
      message.success('字段排序已保存');
    } catch (err: any) {
      message.error('保存排序失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [appId, entityId]);

  // ── 类型变更 ──
  const [typeChangeField, setTypeChangeField] = useState<string | null>(null);
  const [compatibleTypes, setCompatibleTypes] = useState<CompatibleType[]>([]);
  const [typeChangeLoading, setTypeChangeLoading] = useState(false);

  const openTypeChange = useCallback(async (fieldId: string) => {
    if (!appId) return;
    setTypeChangeField(fieldId);
    try {
      const res = await entityService.getCompatibleTypes(appId, fieldId);
      setCompatibleTypes(res.data?.compatibleTypes || []);
    } catch {
      setCompatibleTypes([]);
    }
  }, [appId]);

  const closeTypeChange = useCallback(() => {
    setTypeChangeField(null);
    setCompatibleTypes([]);
  }, []);

  const applyTypeChange = useCallback(async (fieldId: string, newType: string) => {
    if (!appId) return;
    setTypeChangeLoading(true);
    try {
      await store.updateField(appId, fieldId, { type: newType });
      message.success('字段类型已更改');
      closeTypeChange();
    } catch (err: any) {
      message.error('类型变更失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setTypeChangeLoading(false);
    }
  }, [appId]);

  // ── 智能推荐 ──
  const getRecommendation = useCallback((fieldName: string): string | null => {
    const rec = recommendFieldType(fieldName);
    return rec !== 'STRING' ? rec : null;
  }, []);

  // ── 字段顺序列表 ──
  const orderedFields = (fieldOrder.length > 0 && currentEntity?.fields)
    ? fieldOrder
        .map((id) => currentEntity.fields.find((f) => f.id === id))
        .filter(Boolean)
    : currentEntity?.fields || [];

  return {
    fields: orderedFields,
    fieldOrder,

    addField,
    updateField,
    deleteField,

    moveField,
    saveOrder,
    hasOrderChanged: currentEntity
      ? fieldOrder.join(',') !== (currentEntity.fields?.map((f) => f.id) || []).join(',')
      : false,

    // 类型变更
    typeChangeField,
    compatibleTypes,
    typeChangeLoading,
    openTypeChange,
    closeTypeChange,
    applyTypeChange,

    // 智能推荐
    getRecommendation,
  };
}

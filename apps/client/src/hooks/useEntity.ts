import { useEffect, useCallback } from 'react';
import { useEntityStore } from '../stores/entityStore';

/**
 * 实体详情 Hook —— 获取和管理当前实体（含字段）
 */
export function useEntity(appId?: string, entityId?: string) {
  const store = useEntityStore();

  const {
    currentEntity: entity,
    currentEntityLoading: loading,
    currentEntityError: error,
    allEntities,
    allEntitiesLoading,
  } = store;

  useEffect(() => {
    if (appId && entityId) {
      store.fetchCurrentEntity(appId, entityId);
    } else {
      store.clearCurrentEntity();
    }
    // Cleanup on unmount
    return () => { store.clearCurrentEntity(); };
  }, [appId, entityId]);

  const refresh = useCallback(() => {
    if (appId && entityId) {
      store.fetchCurrentEntity(appId, entityId);
    }
  }, [appId, entityId]);

  return {
    entity,
    loading,
    error,
    fields: entity?.fields || [],
    refresh,
  };
}

/**
 * 实体列表 Hook —— 获取应用下所有实体
 */
export function useEntityList(appId?: string) {
  const store = useEntityStore();

  const { entities, entitiesLoading, entitiesError } = store;

  useEffect(() => {
    if (appId) {
      store.fetchEntities(appId);
    }
  }, [appId]);

  const refresh = useCallback(() => {
    if (appId) store.fetchEntities(appId);
  }, [appId]);

  return {
    entities,
    loading: entitiesLoading,
    error: entitiesError,
    refresh,
  };
}

/**
 * 关联实体选择器 Hook —— 获取当前应用所有实体（用于关联字段选择器）
 */
export function useAllEntities(appId?: string) {
  const store = useEntityStore();
  const { allEntities, allEntitiesLoading } = store;

  useEffect(() => {
    if (appId) {
      store.fetchAllEntities(appId);
    }
  }, [appId]);

  return {
    allEntities,
    loading: allEntitiesLoading,
  };
}

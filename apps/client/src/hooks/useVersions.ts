import { useEffect, useCallback, useState } from 'react';
import { message } from 'antd';
import type { VersionCompareResult } from '../types';
import { useEntityStore } from '../stores/entityStore';

/**
 * 版本管理 Hook —— 版本列表、快照、对比、回滚
 */
export function useVersions(appId?: string, entityId?: string) {
  const store = useEntityStore();
  const { versions, versionsLoading, compareResult } = store as { versions: any; versionsLoading: boolean; compareResult: VersionCompareResult | null };

  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotComment, setSnapshotComment] = useState('');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState<string | null>(null);

  const fetchVersions = useCallback(() => {
    if (appId && entityId) {
      store.fetchVersions(appId, entityId);
    }
  }, [appId, entityId]);

  const takeSnapshot = useCallback(async () => {
    if (!appId || !entityId) return;
    try {
      await store.takeSnapshot(appId, entityId, snapshotComment || undefined);
      message.success('版本快照已创建');
      setSnapshotModalOpen(false);
      setSnapshotComment('');
    } catch (err: any) {
      message.error('创建快照失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [appId, entityId, snapshotComment]);

  const compare = useCallback(async (from: number, to: number) => {
    if (!appId || !entityId) return;
    await store.compareVersions(appId, entityId, from, to);
    setCompareModalOpen(true);
  }, [appId, entityId]);

  const restore = useCallback(async (version: number) => {
    if (!appId || !entityId) return;
    setRestoreLoading(String(version));
    try {
      await store.restoreVersion(appId, entityId, version);
      message.success(`已恢复到版本 ${version}`);
    } catch (err: any) {
      message.error('恢复失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setRestoreLoading(null);
    }
  }, [appId, entityId]);

  const closeCompare = useCallback(() => {
    setCompareModalOpen(false);
    store.clearCompareResult();
  }, []);

  return {
    versions,
    loading: versionsLoading,
    compareResult,
    fetchVersions,

    // 快照
    snapshotModalOpen,
    snapshotComment,
    openSnapshot: () => setSnapshotModalOpen(true),
    closeSnapshot: () => { setSnapshotModalOpen(false); setSnapshotComment(''); },
    setSnapshotComment,
    takeSnapshot,

    // 对比
    compareModalOpen,
    compare,
    closeCompare,

    // 回滚
    restoreLoading,
    restore,
  };
}

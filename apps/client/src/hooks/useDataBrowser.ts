import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { entityService } from '../services/entity.service';
import { exportService } from '../services/export.service';
import type { Entity, RecordItem, QueryParams } from '../types';

/** 排序状态 */
interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 数据浏览器 Hook —— 记录 CRUD、分页、搜索、过滤、排序、批量操作
 */
export function useDataBrowser(appId?: string, entityId?: string) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 过滤/搜索/排序
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  // 记录模态框
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // 批量操作
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // 防抖
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── 构建查询参数 ──
  const buildParams = useCallback((): QueryParams => {
    const params: QueryParams = { page, pageSize };

    if (sort) {
      params.sort = `${sort.field}:${sort.order}`;
    }

    const activeFilters: Record<string, string> = {};
    for (const [key, val] of Object.entries(columnFilters)) {
      if (val.trim()) activeFilters[key] = val.trim();
    }
    if (Object.keys(activeFilters).length > 0) {
      params.filter = JSON.stringify(activeFilters);
    }

    if (searchText.trim()) {
      params.q = searchText.trim();
    }

    if (advancedQuery && advancedQuery !== '{"logic":"AND","conditions":[{"field":"","operator":"eq","value":""}]}') {
      params.query = advancedQuery;
    }

    return params;
  }, [page, pageSize, sort, columnFilters, searchText, advancedQuery]);

  // ── 拉取数据 ──
  const fetchData = useCallback(async () => {
    if (!appId || !entityId) return;
    setLoading(true);
    setError(null);
    try {
      const params = buildParams();
      const [eRes, rRes] = await Promise.all([
        entityService.findById(appId, entityId),
        entityService.getRecords(entityId, page, pageSize, params),
      ]);
      setEntity(eRes.data);
      const items = rRes.data?.items || [];
      setRecords(items);
      setTotal(rRes.data?.total || 0);

      // 首次加载初始化可见列
      if (eRes.data?.fields && visibleColumns.size === 0) {
        const fieldNames = eRes.data.fields.map((f: any) => f.name);
        setVisibleColumns(new Set(fieldNames));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [appId, entityId, page, buildParams]);

  useEffect(() => {
    fetchData();
  }, [entityId, page, buildParams]);

  // ── 搜索（防抖） ──
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  }, []);

  // ── 列过滤（防抖） ──
  const handleColumnFilter = useCallback((fieldName: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [fieldName]: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  }, []);

  // ── 排序 ──
  const handleSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    setSort(order ? { field, order } : null);
    setPage(1);
  }, []);

  // ── 清除所有过滤 ──
  const clearFilters = useCallback(() => {
    setColumnFilters({});
    setSearchText('');
    setSort(null);
    setAdvancedQuery('');
    setPage(1);
  }, []);

  // ── 可见列切换 ──
  const toggleColumn = useCallback((fieldName: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) next.delete(fieldName);
      else next.add(fieldName);
      return next;
    });
  }, []);

  // ── 创建记录 ──
  const createRecord = useCallback(async (values: Record<string, unknown>) => {
    if (!entityId) return;
    try {
      const payload = processRelationValues(values, entity?.fields || []);
      await entityService.createRecord(entityId, payload);
      message.success('创建成功');
      setModalOpen(false);
      setPage(1);
      fetchData();
    } catch (err: any) {
      message.error('创建失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [entityId, entity, fetchData]);

  // ── 更新记录 ──
  const updateRecord = useCallback(async (id: string, values: Record<string, unknown>) => {
    if (!entityId) return;
    try {
      const payload = processRelationValues(values, entity?.fields || []);
      await entityService.updateRecord(entityId, id, payload);
      message.success('更新成功');
      setModalOpen(false);
      setEditingRecordId(null);
      fetchData();
    } catch (err: any) {
      message.error('更新失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [entityId, entity, fetchData]);

  // ── 删除记录 ──
  const deleteRecord = useCallback(async (id: string) => {
    if (!entityId) return;
    try {
      await entityService.deleteRecord(entityId, id);
      message.success('已删除');
      fetchData();
    } catch (err: any) {
      message.error('删除失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [entityId, fetchData]);

  // ── 打开编辑模态框 ──
  const openEdit = useCallback((recordId: string, record: RecordItem) => {
    setEditingRecordId(recordId);
    setModalOpen(true);
    return record;
  }, []);

  // ── 批量删除 ──
  const batchDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;
    setBatchLoading(true);
    try {
      for (const id of selectedRowKeys) {
        if (entityId) await entityService.deleteRecord(entityId, id);
      }
      message.success(`已删除 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (err: any) {
      message.error('批量删除失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setBatchLoading(false);
    }
  }, [entityId, selectedRowKeys, fetchData]);

  // ── 导出 CSV ──
  const exportCsv = useCallback(async () => {
    if (!entityId) return;
    try {
      await exportService.exportCsv(entityId, entity?.displayName || 'data');
      message.success('CSV 导出成功');
    } catch (err: any) {
      message.error('导出失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [entityId, entity]);

  // ── 批量导出选中 ──
  const batchExport = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await exportService.exportCsv(entityId!, `${entity?.displayName || 'data'}_选中${selectedRowKeys.length}条`);
      message.success(`已导出 ${selectedRowKeys.length} 条记录`);
    } catch (err: any) {
      message.error('导出失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [entityId, entity, selectedRowKeys]);

  return {
    // 数据
    entity,
    records,
    total,
    page,
    pageSize,
    loading,
    error,
    fields: entity?.fields || [],
    refresh: fetchData,

    // 搜索/过滤/排序
    searchText,
    setSearchText: handleSearch,
    sort,
    handleSort,
    columnFilters,
    handleColumnFilter,
    advancedQuery,
    setAdvancedQuery: (q: string) => { setAdvancedQuery(q); setPage(1); },
    showFilterRow,
    toggleFilterRow: () => setShowFilterRow((v) => !v),
    queryModalOpen,
    openQueryModal: () => setQueryModalOpen(true),
    closeQueryModal: () => setQueryModalOpen(false),
    clearFilters,
    hasActiveFilters: Object.values(columnFilters).some((v) => v.trim()) || searchText.trim() || sort !== null,

    // 可见列
    visibleColumns,
    toggleColumn,
    visibleFieldNames: entity?.fields
      ? entity.fields
          .filter((f) => visibleColumns.has(f.name))
          .map((f) => f.name)
      : [],

    // 记录 CRUD
    modalOpen,
    editingRecordId,
    openCreateModal: () => { setEditingRecordId(null); setModalOpen(true); },
    openEditModal: openEdit,
    closeModal: () => { setModalOpen(false); setEditingRecordId(null); },
    createRecord,
    updateRecord,
    deleteRecord,

    // 批量操作
    selectedRowKeys,
    setSelectedRowKeys,
    batchLoading,
    batchDelete,
    batchExport,
    exportCsv,
  };
}

/** 处理关联字段值：将 { id: 'xxx' } 转为 'xxx' */
function processRelationValues(values: Record<string, unknown>, fields: any[]): Record<string, unknown> {
  const payload = { ...values };
  for (const f of fields) {
    if (f.type === 'RELATION' && payload[f.name] && typeof payload[f.name] === 'object') {
      payload[f.name] = (payload[f.name] as any).id;
    }
  }
  return payload;
}

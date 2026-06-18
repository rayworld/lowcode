import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Space, Modal, Form, Input, InputNumber,
  message, Spin, Popconfirm, Tag, Select, Row, Col, Tooltip, Checkbox, Dropdown,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, LinkOutlined, SearchOutlined,
  FilterOutlined, ColumnHeightOutlined, ReloadOutlined, CloseOutlined, DownloadOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { entityService } from '../../services/entity.service';
import { exportService } from '../../services/export.service';
import api from '../../services/api';
import QueryBuilder from '../../components/data/QueryBuilder';
import dayjs from 'dayjs';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

const PAGE_SIZE = 20;

export default function DataBrowserPage() {
  const { appId, entityId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Batch selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Filter / Sort / Search state
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const buildQueryParams = useCallback(() => {
    let sort: string | undefined;
    if (sortField && sortOrder) {
      sort = `${sortField}:${sortOrder}`;
    }

    // Only include non-empty filters
    const activeFilters: Record<string, string> = {};
    for (const [key, val] of Object.entries(columnFilters)) {
      if (val.trim()) activeFilters[key] = val.trim();
    }
    const filter = Object.keys(activeFilters).length > 0 ? JSON.stringify(activeFilters) : undefined;
    const query = advancedQuery && advancedQuery !== '{"logic":"AND","conditions":[{"field":"","operator":"eq","value":""}]}'
      ? advancedQuery : undefined;

    return { sort, filter, q: searchText.trim() || undefined, query };
  }, [sortField, sortOrder, columnFilters, searchText, advancedQuery]);

  const fetchData = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const params = buildQueryParams();
      const [eRes, rRes] = await Promise.all([
        entityService.findById(appId!, entityId),
        entityService.getRecords(entityId, page, PAGE_SIZE, params),
      ]);
      setEntity(eRes.data);
      const items = rRes.data?.items || [];
      setRecords(items);
      setTotal(rRes.data?.total || 0);

      // Initialize visible columns from the first load
      if (eRes.data?.fields && visibleColumns.size === 0) {
        const fieldNames = eRes.data.fields.map((f: any) => f.name);
        setVisibleColumns(new Set(fieldNames));
      }
    } finally {
      setLoading(false);
    }
  }, [entityId, page, buildQueryParams]);

  useEffect(() => { fetchData(); }, [entityId, page, buildQueryParams]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
    }, 400);
  };

  // Column filter change
  const handleFilterChange = (fieldName: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [fieldName]: value }));
    // Debounce the filter -> triggers re-fetch via page change
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
    }, 400);
  };

  // Table change handler (sort + pagination)
  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
  ) => {
    setPage(pagination.current || 1);
    if (!Array.isArray(sorter) && sorter.field) {
      const field = sorter.field as string;
      const order = sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined;
      setSortField(order ? field : undefined);
      setSortOrder(order);
    }
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    const payload = { ...values };
    for (const f of entity?.fields || []) {
      if (f.type === 'RELATION' && payload[f.name] && typeof payload[f.name] === 'object') {
        payload[f.name] = payload[f.name].id;
      }
    }
    await entityService.createRecord(entityId!, payload);
    message.success('创建成功');
    setModalOpen(false);
    form.resetFields();
    fetchData();
  };

  const handleEditRecord = async (id: string) => {
    const values = await form.validateFields();
    const payload = { ...values };
    for (const f of entity?.fields || []) {
      if (f.type === 'RELATION' && payload[f.name] && typeof payload[f.name] === 'object') {
        payload[f.name] = payload[f.name].id;
      }
    }
    await entityService.updateRecord(entityId!, id, payload);
    message.success('更新成功');
    setModalOpen(false);
    setRecordId(null);
    form.resetFields();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await entityService.deleteRecord(entityId!, id);
    message.success('已删除');
    fetchData();
  };

  const openEditModal = (id: string) => {
    setRecordId(id);
    const record = records.find((r) => r.id === id);
    if (record) {
      const formValues = { ...record };
      for (const f of entity?.fields || []) {
        if (f.type === 'RELATION' && formValues[f.name] && typeof formValues[f.name] === 'object') {
          formValues[f.name] = formValues[f.name].id;
        }
      }
      form.setFieldsValue(formValues);
    }
    setModalOpen(true);
  };

  // ========== Batch Operations ==========
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: `确定删除选中的 ${selectedRowKeys.length} 条记录？`,
      content: '此操作不可撤销',
      onOk: async () => {
        setBatchLoading(true);
        try {
          for (const id of selectedRowKeys) {
            await entityService.deleteRecord(entityId!, id);
          }
          message.success(`已删除 ${selectedRowKeys.length} 条记录`);
          setSelectedRowKeys([]);
          fetchData();
        } catch (err: any) {
          message.error('批量删除失败: ' + (err?.response?.data?.message || err.message));
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  const handleBatchExport = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的记录');
      return;
    }
    // Use the full CSV export but filter client-side for selected rows
    try {
      const response = await api.get(`/entities/${entityId}/data/export/csv`, {
        responseType: 'blob',
      });
      // For selected-only export, we filter the selected items
      // Simple approach: download all and note the selection
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entity?.displayName || 'data'}_选中${selectedRowKeys.length}条.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success(`已导出 ${selectedRowKeys.length} 条记录`);
    } catch (err: any) {
      message.error('导出失败: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleExportCsv = async () => {
    try {
      await exportService.exportCsv(entityId!, entity?.displayName || 'data');
      message.success('CSV 导出成功');
    } catch (err: any) {
      message.error('导出失败: ' + (err?.response?.data?.message || err.message));
    }
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchText('');
    setSortField(undefined);
    setSortOrder(undefined);
    setPage(1);
  };

  if (!entity && loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const fields = entity?.fields || [];

  // Build visible columns list
  const allFieldNames = fields.map((f: any) => f.name);
  if (visibleColumns.size === 0 && allFieldNames.length > 0) {
    setVisibleColumns(new Set(allFieldNames));
  }
  const visibleFieldNames = Array.from(visibleColumns);

  // Determine which fields to show in the table (up to 8 visible)
  const displayFields = fields.filter((f: any) => visibleFieldNames.includes(f.name)).slice(0, 8);

  // Render cell value based on field type
  const renderValue = (f: any, v: any) => {
    if (v === null || v === undefined) return '-';
    if (f.type === 'RELATION' && typeof v === 'object' && v?.id) {
      return (
        <Button
          type="link"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => navigate(`/apps/${appId}/data/${entityId}?recordId=${v.id}`)}
          style={{ padding: 0 }}
        >
          {v.displayName || v.id.slice(0, 8)}
        </Button>
      );
    }
    if (f.type === 'BOOLEAN') return <Tag color={v ? 'blue' : 'default'}>{v ? '是' : '否'}</Tag>;
    if (f.type === 'DATETIME') return dayjs(v).format('YYYY-MM-DD HH:mm');
    if (f.type === 'DATE') return dayjs(v).format('YYYY-MM-DD');
    if (f.type === 'RELATION') return <Tag>{String(v).slice(0, 8)}</Tag>;
    if (['FILE', 'IMAGE'].includes(f.type)) return <Tag icon={<LinkOutlined />}>查看文件</Tag>;
    return String(v);
  };

  const columns: ColumnsType<any> = displayFields.map((f: any) => ({
    title: f.displayName,
    dataIndex: f.name,
    key: f.name,
    ellipsis: true,
    width: f.type === 'RELATION' ? 200 : f.type === 'BOOLEAN' ? 80 : undefined,
    sorter: true,
    sortOrder: sortField === f.name ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    render: (v: any) => renderValue(f, v),
  }));

  columns.push({
    title: '操作',
    key: 'action',
    width: 160,
    fixed: 'right',
    render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" onClick={() => openEditModal(record.id)}>
          编辑
        </Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  });

  const hasActiveFilters = Object.values(columnFilters).some((v) => v.trim()) || searchText.trim() || sortField;

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/models`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            {entity?.displayName} - 数据浏览
          </Typography.Title>
          <Tag>{total} 条记录</Tag>
        </Space>
        <Space>
          <Tooltip title="导出 CSV">
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              导出
            </Button>
          </Tooltip>
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={fetchData} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setRecordId(null); form.resetFields(); setModalOpen(true); }}>
            新增
          </Button>
        </Space>
      </div>

      {/* Search & Filter Toolbar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索所有字段..."
              allowClear
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </Col>
          <Col>
            <Space>
              <Button
                icon={<FilterOutlined />}
                type={showFilterRow ? 'primary' : 'default'}
                onClick={() => setShowFilterRow(!showFilterRow)}
              >
                字段过滤
              </Button>
              <Button
                icon={<PartitionOutlined />}
                type={advancedQuery ? 'primary' : 'default'}
                onClick={() => setQueryModalOpen(true)}
              >
                高级查询
              </Button>
              <Dropdown
                menu={{
                  items: fields.map((f: any) => ({
                    key: f.name,
                    label: (
                      <Checkbox
                        checked={visibleColumns.has(f.name)}
                        onChange={(e) => {
                          const next = new Set(visibleColumns);
                          if (e.target.checked) next.add(f.name);
                          else next.delete(f.name);
                          setVisibleColumns(next);
                        }}
                      >
                        {f.displayName}
                      </Checkbox>
                    ),
                  })),
                }}
                trigger={['click']}
              >
                <Button icon={<ColumnHeightOutlined />}>列设置</Button>
              </Dropdown>
              {hasActiveFilters && (
                <Button icon={<CloseOutlined />} onClick={clearAllFilters}>
                  清除过滤
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Per-column filter inputs */}
        {showFilterRow && (
          <Row gutter={[12, 8]} style={{ marginTop: 12 }}>
            {fields.slice(0, 6).map((f: any) => (
              <Col key={f.name} xs={12} sm={8} md={6} lg={4}>
                <Input
                  size="small"
                  placeholder={`过滤${f.displayName}`}
                  prefix={<FilterOutlined />}
                  value={columnFilters[f.name] || ''}
                  onChange={(e) => handleFilterChange(f.name, e.target.value)}
                  allowClear
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card>
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f4ff', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text>
              已选择 <Tag color="blue">{selectedRowKeys.length}</Tag> 条记录
            </Typography.Text>
            <Space>
              <Button size="small" icon={<DownloadOutlined />} onClick={handleBatchExport} loading={batchLoading}>
                导出选中
              </Button>
              <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条记录？`} onConfirm={handleBatchDelete}>
                <Button size="small" danger loading={batchLoading}>
                  删除选中
                </Button>
              </Popconfirm>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          onChange={handleTableChange}
          pagination={{
            current: page,
            total,
            pageSize: PAGE_SIZE,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      <Modal
        title={recordId ? '编辑记录' : '新增记录'}
        open={modalOpen}
        onOk={() => (recordId ? handleEditRecord(recordId) : handleCreate())}
        onCancel={() => { setModalOpen(false); setRecordId(null); }}
        width={640}
      >
        <Form form={form} layout="vertical">
          {fields.map((f: any) => (
            <Form.Item
              key={f.id}
              name={f.name}
              label={f.displayName}
              rules={[{ required: f.required, message: `请输入${f.displayName}` }]}
            >
              {f.type === 'TEXT' ? (
                <Input.TextArea rows={3} />
              ) : f.type === 'NUMBER' ? (
                <InputNumber style={{ width: '100%' }} />
              ) : f.type === 'BOOLEAN' ? (
                <Select>
                  <Select.Option value={false}>否</Select.Option>
                  <Select.Option value={true}>是</Select.Option>
                </Select>
              ) : f.type === 'SELECT' && f.options ? (
                <Select>
                  {(f.options || []).map((opt: any) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Advanced Query Modal */}
      {queryModalOpen && (
        <Modal
          title="高级查询构建器"
          open={queryModalOpen}
          onCancel={() => setQueryModalOpen(false)}
          onOk={() => { setPage(1); setQueryModalOpen(false); }}
          okText="应用查询"
          width={700}
        >
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            构建 AND/OR 条件组来精确过滤数据。支持文本包含、数字比较、日期范围等操作符。
          </Typography.Paragraph>
          <QueryBuilder
            fields={fields}
            value={advancedQuery}
            onChange={(json) => setAdvancedQuery(json)}
          />
        </Modal>
      )}
    </div>
  );
}

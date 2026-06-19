import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Space, Modal, Form, Input, InputNumber,
  message, Popconfirm, Tag, Select, Row, Col, Tooltip, Checkbox, Dropdown, Skeleton, Alert,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, LinkOutlined, SearchOutlined,
  FilterOutlined, ColumnHeightOutlined, ReloadOutlined, CloseOutlined, DownloadOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

import { useDataBrowser } from '../../hooks';
import { getFieldTypeConfig } from '../../config/field-type.config';
import QueryBuilder from '../../components/data/QueryBuilder';
import dayjs from 'dayjs';

const PAGE_SIZE = 20;

export default function DataBrowserPage() {
  const { appId, entityId } = useParams<{ appId: string; entityId: string }>();
  const navigate = useNavigate();

  const {
    entity, records, total, page, pageSize, loading, error, fields, refresh,
    searchText, setSearchText,
    sort, handleSort,
    columnFilters, handleColumnFilter,
    advancedQuery, setAdvancedQuery,
    showFilterRow, toggleFilterRow,
    queryModalOpen, openQueryModal, closeQueryModal,
    clearFilters, hasActiveFilters,
    visibleColumns, toggleColumn, visibleFieldNames,
    modalOpen, editingRecordId,
    openCreateModal, openEditModal, closeModal,
    createRecord, updateRecord, deleteRecord,
    selectedRowKeys, setSelectedRowKeys, batchLoading, batchDelete, batchExport, exportCsv,
  } = useDataBrowser(appId, entityId);

  const [form] = Form.useForm();
  // ── 打开编辑记录 ──
  const handleOpenEdit = useCallback((record: any) => {
    openEditModal(record.id, record);
    const formValues = { ...record };
    for (const f of fields) {
      if (f.type === 'RELATION' && formValues[f.name] && typeof formValues[f.name] === 'object') {
        formValues[f.name] = (formValues[f.name] as any).id;
      }
    }
    form.setFieldsValue(formValues);
  }, [fields, openEditModal, form]);

  // ── 表格变更 ──
  const handleTableChange = useCallback(
    (pagination: TablePaginationConfig, _filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[]) => {
      if (!Array.isArray(sorter) && sorter.field) {
        const field = sorter.field as string;
        const order = sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined;
        handleSort(field, order);
      }
    },
    [handleSort],
  );

  // ── 提交表单 ──
  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    if (editingRecordId) {
      await updateRecord(editingRecordId, values);
    } else {
      await createRecord(values);
    }
    form.resetFields();
  }, [editingRecordId, form, createRecord, updateRecord]);

  // ── 渲染单元格值 ──
  const renderValue = useCallback((f: any, v: any) => {
    if (v === null || v === undefined) return '-';
    if (f.type === 'RELATION' && typeof v === 'object' && v?.id) {
      return (
        <Button type="link" size="small" icon={<LinkOutlined />}
          onClick={() => navigate(`/apps/${appId}/data/${entityId}?recordId=${v.id}`)}
          style={{ padding: 0 }}>
          {v.displayName || v.name || v.id.slice(0, 8)}
        </Button>
      );
    }
    if (f.type === 'BOOLEAN') return <Tag color={v ? 'blue' : 'default'}>{v ? '是' : '否'}</Tag>;
    if (f.type === 'DATETIME') return dayjs(v).format('YYYY-MM-DD HH:mm');
    if (f.type === 'DATE') return dayjs(v).format('YYYY-MM-DD');
    if (['FILE', 'IMAGE'].includes(f.type)) return <Tag icon={<LinkOutlined />}>查看文件</Tag>;
    return String(v);
  }, [appId, entityId, navigate]);

  // ── Loading 状态 ──
  if (loading && !entity) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Button type="text" icon={<ArrowLeftOutlined />} />
          <Skeleton.Input active style={{ width: 200 }} />
        </div>
        <Card><Skeleton active paragraph={{ rows: 10 }} /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Alert type="error" message="加载数据失败" description={error} showIcon
          action={<Button onClick={() => navigate(`/apps/${appId}/models`)}>返回模型列表</Button>} />
      </div>
    );
  }

  if (!entity) return null;

  // ── 显示字段（最多 8 个 + 操作列） ──
  const displayFields = fields.filter((f) => visibleColumns.has(f.name)).slice(0, 8);

  const columns: ColumnsType<any> = displayFields.map((f) => ({
    title: (
      <Space size={4}>
        <span>{f.displayName}</span>
        {f.type === 'RELATION' && <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>关联</Tag>}
      </Space>
    ),
    dataIndex: f.name,
    key: f.name,
    ellipsis: true,
    width: f.type === 'RELATION' ? 200 : f.type === 'BOOLEAN' ? 80 : undefined,
    sorter: true,
    sortOrder: sort?.field === f.name ? (sort.order === 'asc' ? 'ascend' : 'descend') : undefined,
    render: (v: any) => renderValue(f, v),
  }));

  columns.push({
    title: '操作', key: 'action', width: 120, fixed: 'right',
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" onClick={() => handleOpenEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => deleteRecord(record.id)}>
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      </Space>
    ),
  });

  // ── 列设置菜单 ──
  const columnMenuItems = fields.map((f) => ({
    key: f.name,
    label: (
      <Checkbox checked={visibleColumns.has(f.name)}
        onChange={() => toggleColumn(f.name)}>
        {f.displayName}
        <Tag style={{ marginLeft: 4, fontSize: 10, lineHeight: '16px' }}>
          {getFieldTypeConfig(f.type)?.label || f.type}
        </Tag>
      </Checkbox>
    ),
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/models`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>{entity.displayName} - 数据浏览</Typography.Title>
          {total > 0 && <Tag>{total} 条记录</Tag>}
        </Space>
        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>导出</Button>
          <Tooltip title="刷新"><Button icon={<ReloadOutlined />} onClick={refresh} /></Tooltip>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); openCreateModal(); }}>
            新增
          </Button>
        </Space>
      </div>

      {/* Search & Filter Toolbar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input prefix={<SearchOutlined />} placeholder="搜索所有字段..." allowClear
              value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </Col>
          <Col flex="auto">
            <Space wrap>
              <Button icon={<FilterOutlined />} type={showFilterRow ? 'primary' : 'default'}
                onClick={toggleFilterRow}>字段过滤</Button>
              <Button icon={<PartitionOutlined />} type={advancedQuery ? 'primary' : 'default'}
                onClick={openQueryModal}>高级查询</Button>
              <Dropdown menu={{ items: columnMenuItems }} trigger={['click']}>
                <Button icon={<ColumnHeightOutlined />}>列设置</Button>
              </Dropdown>
              {hasActiveFilters && (
                <Button icon={<CloseOutlined />} onClick={clearFilters}>清除过滤</Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Per-column filter inputs */}
        {showFilterRow && (
          <Row gutter={[12, 8]} style={{ marginTop: 12 }}>
            {fields.slice(0, 6).map((f) => (
              <Col key={f.name} xs={12} sm={8} md={6} lg={4}>
                <Input size="small" placeholder={`过滤${f.displayName}`}
                  prefix={<FilterOutlined />}
                  value={columnFilters[f.name] || ''}
                  onChange={(e) => handleColumnFilter(f.name, e.target.value)}
                  allowClear />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Batch selection bar */}
      {selectedRowKeys.length > 0 && (
        <div style={{
          marginBottom: 12, padding: '8px 12px', background: '#e6f4ff', borderRadius: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Typography.Text>
            已选择 <Tag color="blue">{selectedRowKeys.length}</Tag> 条记录
          </Typography.Text>
          <Space>
            <Button size="small" icon={<DownloadOutlined />} onClick={batchExport} loading={batchLoading}>
              导出选中
            </Button>
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条记录？`} onConfirm={batchDelete}>
              <Button size="small" danger loading={batchLoading}>删除选中</Button>
            </Popconfirm>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </div>
      )}

      {/* Data table */}
      <Card>
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
            pageSize,
            onChange: (p) => setSelectedRowKeys([]),
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRecordId ? '编辑记录' : '新增记录'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        width={640}
      >
        <Form form={form} layout="vertical">
          {fields.map((f) => (
            <Form.Item key={f.id} name={f.name} label={
              <Space size={4}>
                <span>{f.displayName}</span>
                {f.helpText && <Tooltip title={f.helpText}><span style={{ color: '#999', fontSize: 12 }}>ⓘ</span></Tooltip>}
              </Space>
            }
              rules={[
                { required: f.required, message: `请输入${f.displayName}` },
                ...(f.validationRules?.map((rule) => {
                  if (rule.type === 'minLength') return { min: Number(rule.value), message: rule.message };
                  if (rule.type === 'maxLength') return { max: Number(rule.value), message: rule.message };
                  if (rule.type === 'pattern') return { pattern: new RegExp(String(rule.value)), message: rule.message };
                  return {};
                }) || []),
              ]}
            >
              {f.type === 'TEXT' ? (
                <Input.TextArea rows={3} placeholder={f.placeholder} />
              ) : f.type === 'NUMBER' ? (
                <InputNumber style={{ width: '100%' }} placeholder={f.placeholder} />
              ) : f.type === 'BOOLEAN' ? (
                <Select>
                  <Select.Option value={false}>否</Select.Option>
                  <Select.Option value={true}>是</Select.Option>
                </Select>
              ) : f.type === 'SELECT' && f.options ? (
                <Select placeholder={f.placeholder}>
                  {(f.options || []).map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.color ? <Tag color={opt.color}>{opt.label}</Tag> : opt.label}
                    </Select.Option>
                  ))}
                </Select>
              ) : f.type === 'MULTI_SELECT' && f.options ? (
                <Select mode="multiple" placeholder={f.placeholder}>
                  {(f.options || []).map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                  ))}
                </Select>
              ) : (
                <Input placeholder={f.placeholder} />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Advanced Query Modal */}
      {queryModalOpen && (
        <Modal title="高级查询构建器" open={queryModalOpen}
          onCancel={closeQueryModal}
          onOk={() => { closeQueryModal(); }}
          okText="应用查询" width={700}>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            构建 AND/OR 条件组来精确过滤数据。
          </Typography.Paragraph>
          <QueryBuilder fields={fields} value={advancedQuery}
            onChange={(json) => setAdvancedQuery(json)} />
        </Modal>
      )}
    </div>
  );
}

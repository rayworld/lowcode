import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Tag, Modal, Form, Input, Select, Switch,
  message, Space, Popconfirm, Spin, Tooltip, Tabs, List, Descriptions, Divider, Alert,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, QuestionCircleOutlined, StarOutlined,
  HistoryOutlined, FieldNumberOutlined, RollbackOutlined, CameraOutlined, CodeOutlined, CopyOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SortAscendingOutlined,
} from '@ant-design/icons';
import { entityService } from '../../services/entity.service';
import { FIELD_TYPE_CONFIGS, getFieldTypeConfig, recommendFieldType } from '../../config/field-type.config';
import { AVAILABLE_EXPRESSIONS } from '../../config/default-expressions';

const RELATION_TYPES = [
  { value: 'ONE_TO_ONE', label: '一对一 (1:1)' },
  { value: 'ONE_TO_MANY', label: '一对多 (1:N)' },
  { value: 'MANY_TO_MANY', label: '多对多 (M:N)' },
];

export default function EntityDesignerPage() {
  const { appId, entityId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<any>(null);
  const [allEntities, setAllEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fields');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('STRING');
  const [recommendedType, setRecommendedType] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [form] = Form.useForm();

  // Versions state
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotComment, setSnapshotComment] = useState('');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState<string | null>(null);

  // Codegen state
  const [codegenModalOpen, setCodegenModalOpen] = useState(false);
  const [codegenLoading, setCodegenLoading] = useState(false);
  const [codegenResult, setCodegenResult] = useState<any>(null);

  // Field reorder state
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);
  const [reorderLoading, setReorderLoading] = useState(false);

  // Type change state
  const [typeChangeModalOpen, setTypeChangeModalOpen] = useState(false);
  const [typeChangeField, setTypeChangeField] = useState<any>(null);
  const [compatibleTypes, setCompatibleTypes] = useState<any[]>([]);
  const [typeChangeLoading, setTypeChangeLoading] = useState(false);
  const [selectedNewType, setSelectedNewType] = useState<string>('');

  useEffect(() => {
    if (!appId || !entityId) return;
    Promise.all([
      entityService.findById(appId, entityId).then((r) => {
        setEntity(r.data);
        return r.data;
      }),
      entityService.findAll(appId).then((r) => setAllEntities(r.data || [])),
    ]).finally(() => setLoading(false));
  }, [appId, entityId]);

  const fetchVersions = async () => {
    if (!appId || !entityId) return;
    setVersionsLoading(true);
    try {
      const res = await entityService.listVersions(appId, entityId);
      setVersions(res.data?.versions || []);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'versions') {
      fetchVersions();
    }
  }, [activeTab, appId, entityId]);

  const handleAddField = async () => {
    const values = await form.validateFields();
    const payload: Record<string, any> = {
      name: values.name,
      displayName: values.displayName || values.name,
      type: values.type,
      required: values.required || false,
      unique: values.unique || false,
      isList: values.isList || false,
      defaultValue: values.defaultValue || undefined,
    };
    if (values.type === 'RELATION') {
      payload.relationTo = values.relationTo;
      payload.relationType = values.relationType;
      payload.required = false;
    }
    await entityService.addField(appId!, entityId!, payload);
    message.success('字段添加成功');
    setModalOpen(false);
    setSelectedType('STRING');
    form.resetFields();
    const res = await entityService.findById(appId!, entityId!);
    setEntity(res.data);
  };

  const handleDeleteField = async (fieldId: string) => {
    await entityService.removeField(appId!, fieldId);
    message.success('字段已删除');
    const res = await entityService.findById(appId!, entityId!);
    setEntity(res.data);
  };

  const onTypeChange = (value: string) => {
    setSelectedType(value);
    form.setFieldsValue({ relationTo: undefined, relationType: undefined });
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFieldName(name);
    if (name.trim()) {
      const rec = recommendFieldType(name);
      setRecommendedType(rec);
    } else {
      setRecommendedType(null);
    }
  };

  const applyRecommendation = () => {
    if (recommendedType) {
      setSelectedType(recommendedType);
      form.setFieldsValue({ type: recommendedType });
      setRecommendedType(null);
    }
  };

  // ========== Version Management ==========
  const handleTakeSnapshot = async () => {
    await entityService.takeSnapshot(appId!, entityId!, snapshotComment || undefined);
    message.success('版本快照已创建');
    setSnapshotModalOpen(false);
    setSnapshotComment('');
    fetchVersions();
  };

  const handleCompare = async (fromVersion: number, toVersion: number) => {
    setCompareLoading(true);
    try {
      const res = await entityService.compareVersions(appId!, entityId!, fromVersion, toVersion);
      setCompareResult(res.data);
      setCompareModalOpen(true);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    setRestoreLoading(String(version));
    try {
      await entityService.restoreVersion(appId!, entityId!, version);
      message.success(`已恢复到版本 ${version}`);
      fetchVersions();
      const res = await entityService.findById(appId!, entityId!);
      setEntity(res.data);
    } finally {
      setRestoreLoading(null);
    }
  };

  // ========== Field Reorder ==========
  const moveField = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...fieldOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setFieldOrder(newOrder);
  };

  const saveFieldOrder = async () => {
    setReorderLoading(true);
    try {
      await entityService.reorderFields(appId!, entityId!, fieldOrder);
      message.success('字段排序已保存');
      const res = await entityService.findById(appId!, entityId!);
      setEntity(res.data);
    } catch (err: any) {
      message.error('保存排序失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setReorderLoading(false);
    }
  };

  // ========== Type Change ==========
  const openTypeChange = async (field: any) => {
    setTypeChangeField(field);
    setTypeChangeModalOpen(true);
    setSelectedNewType('');
    try {
      const res = await entityService.getCompatibleTypes(appId!, field.id);
      setCompatibleTypes(res.data?.compatibleTypes || []);
    } catch {
      setCompatibleTypes([]);
    }
  };

  const handleTypeChange = async () => {
    if (!typeChangeField || !selectedNewType) return;
    setTypeChangeLoading(true);
    try {
      await entityService.updateField(appId!, typeChangeField.id, { type: selectedNewType });
      message.success(`字段 "${typeChangeField.displayName}" 类型已更改为 ${selectedNewType}`);
      setTypeChangeModalOpen(false);
      const res = await entityService.findById(appId!, entityId!);
      setEntity(res.data);
    } catch (err: any) {
      message.error('类型变更失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setTypeChangeLoading(false);
    }
  };

  // Initialize field order when entity loads
  useEffect(() => {
    if (entity?.fields) {
      setFieldOrder(entity.fields.map((f: any) => f.id));
    }
  }, [entity?.fields?.length]);

  // ========== Code Generation ==========
  const handleGenerateCode = async () => {
    setCodegenLoading(true);
    setCodegenModalOpen(true);
    try {
      const res = await entityService.generateCode(appId!, entityId!);
      setCodegenResult(res.data);
    } catch (err: any) {
      message.error('代码生成失败: ' + (err?.response?.data?.message || err.message));
      setCodegenModalOpen(false);
    } finally {
      setCodegenLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('代码已复制到剪贴板');
    });
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!entity) return <Typography.Text type="danger">实体不存在</Typography.Text>;

  const targetEntities = allEntities.filter((e: any) => e.id !== entityId);

  const typeRenderer = (t: string) => {
    const cfg = getFieldTypeConfig(t);
    if (!cfg) return <Tag>{t}</Tag>;
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
  };

  const fieldColumns = [
    {
      title: '#', dataIndex: 'order', key: 'order', width: 50,
      render: (_v: number, _r: any, idx: number) => {
        const fieldId = fieldOrder[idx];
        return (
          <Space size={0}>
            <Button type="text" size="small" icon={<ArrowUpOutlined />}
              disabled={idx === 0} onClick={() => moveField(idx, 'up')}
              style={{ padding: 2, height: 20, width: 20 }} />
            <Button type="text" size="small" icon={<ArrowDownOutlined />}
              disabled={idx === fieldOrder.length - 1} onClick={() => moveField(idx, 'down')}
              style={{ padding: 2, height: 20, width: 20 }} />
          </Space>
        );
      },
    },
    { title: '字段名', dataIndex: 'displayName', key: 'displayName' },
    { title: '标识', dataIndex: 'name', key: 'name' },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (t: string, record: any) => {
        if (t === 'RELATION') {
          const relType = record.relationType === 'ONE_TO_ONE' ? '1:1'
            : record.relationType === 'MANY_TO_MANY' ? 'M:N' : '1:N';
          return <Tag color="blue">关联 {record.relationTo} ({relType})</Tag>;
        }
        return typeRenderer(t);
      },
    },
    {
      title: '必填', dataIndex: 'required', key: 'required',
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '唯一', dataIndex: 'unique', key: 'unique',
      render: (v: boolean) => v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => openTypeChange(record)}>
            修改类型
          </Button>
          <Popconfirm title="确定删除此字段？" onConfirm={() => handleDeleteField(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const versionColumns = [
    {
      title: '版本', dataIndex: 'version', key: 'version', width: 80,
      render: (v: number) => <Tag color="blue">v{v}</Tag>,
    },
    { title: '说明', dataIndex: 'comment', key: 'comment', ellipsis: true },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作', key: 'action', width: 240,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleCompare(record.version - 1, record.version)}
            disabled={record.version <= 1}
          >
            对比差异
          </Button>
          <Popconfirm
            title={`确定恢复到版本 ${record.version}？当前状态将保存为新版本`}
            onConfirm={() => handleRestore(record.version)}
          >
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              loading={restoreLoading === String(record.version)}
            >
              恢复
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'fields',
      label: <span><FieldNumberOutlined /> 字段管理</span>,
      children: (
        <Card
          extra={
            <Space>
              {fieldOrder.join(',') !== (entity.fields?.map((f: any) => f.id) || []).join(',') && (
                <Button
                  size="small"
                  icon={<SortAscendingOutlined />}
                  onClick={saveFieldOrder}
                  loading={reorderLoading}
                  type="primary"
                >
                  保存排序
                </Button>
              )}
            </Space>
          }
        >
          <Table
            columns={fieldColumns}
            dataSource={entity.fields?.length ? fieldOrder.map((id) => entity.fields.find((f: any) => f.id === id)).filter(Boolean) : []}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '还没有字段，点击"添加字段"开始' }}
          />
        </Card>
      ),
    },
    {
      key: 'versions',
      label: <span><HistoryOutlined /> 版本历史</span>,
      children: (
        <Card
          title={`共 ${versions.length} 个版本`}
          extra={
            <Button icon={<CameraOutlined />} onClick={() => setSnapshotModalOpen(true)}>
              手动创建快照
            </Button>
          }
        >
          <Table
            columns={versionColumns}
            dataSource={versions}
            rowKey="version"
            pagination={false}
            loading={versionsLoading}
            locale={{ emptyText: '暂无版本记录。每次修改实体或字段时将自动创建快照。' }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/models`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>{entity.displayName} - 字段管理</Typography.Title>
          <Tag color="blue">v{versions.length || 1}</Tag>
        </Space>
        <Space>
          <Button icon={<CodeOutlined />} onClick={handleGenerateCode}>
            生成代码
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedType('STRING'); setModalOpen(true); }}>
            添加字段
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Add Field Modal */}
      <Modal
        title="添加字段"
        open={modalOpen}
        onOk={handleAddField}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'STRING' }}>
          <Form.Item name="name" label="字段标识" rules={[
            { required: true },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' },
          ]}>
            <Input
              placeholder="如：name, email"
              onChange={onNameChange}
              suffix={
                recommendedType && fieldName.trim() && selectedType !== recommendedType ? (
                  <Button type="link" size="small" icon={<StarOutlined />}
                    onClick={applyRecommendation} style={{ fontSize: 12, padding: 0 }}>
                    推荐: {getFieldTypeConfig(recommendedType)?.label}
                  </Button>
                ) : null
              }
            />
          </Form.Item>
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="如：姓名, 邮箱" />
          </Form.Item>
          <Form.Item name="type" label={
            <Space size={4}>
              <span>字段类型</span>
              <Tooltip title="根据字段标识自动推荐类型，点击输入框右侧的星标可快速应用">
                <QuestionCircleOutlined style={{ color: '#999', fontSize: 13 }} />
              </Tooltip>
            </Space>
          } rules={[{ required: true }]}>
            <Select onChange={onTypeChange} showSearch placeholder="选择字段类型" optionFilterProp="label">
              {FIELD_TYPE_CONFIGS.map((cfg) => (
                <Select.Option key={cfg.value} value={cfg.value}>
                  <Space>
                    <Tag color={cfg.color} style={{ minWidth: 64, textAlign: 'center' }}>{cfg.label}</Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{cfg.description}</Typography.Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {selectedType !== 'RELATION' && (
            <div style={{ marginTop: -16, marginBottom: 16, padding: '0 0 0 12px' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {getFieldTypeConfig(selectedType)?.description} —— 例：{getFieldTypeConfig(selectedType)?.example}
              </Typography.Text>
            </div>
          )}
          {selectedType === 'RELATION' && (
            <>
              <Form.Item name="relationTo" label="关联实体" rules={[{ required: true, message: '请选择关联实体' }]}>
                <Select placeholder="选择目标实体"
                  options={targetEntities.map((e: any) => ({ value: e.name, label: `${e.displayName} (${e.name})` }))} />
              </Form.Item>
              <Form.Item name="relationType" label="关联类型" rules={[{ required: true, message: '请选择关联类型' }]}>
                <Select options={RELATION_TYPES} placeholder="选择关联类型" />
              </Form.Item>
            </>
          )}
          {selectedType !== 'RELATION' && (
            <>
              <Form.Item name="defaultValue" label={
                <Space size={4}>
                  <span>默认值</span>
                  <Select
                    size="small"
                    style={{ width: 140 }}
                    placeholder="插入表达式"
                    value={undefined}
                    onChange={(val) => {
                      const current = form.getFieldValue('defaultValue') || '';
                      form.setFieldsValue({ defaultValue: current + val });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select.OptGroup label="动态表达式">
                      {AVAILABLE_EXPRESSIONS.map((exp) => (
                        <Select.Option key={exp.expression} value={exp.expression}>
                          <Tooltip title={exp.description}>{exp.label}</Tooltip>
                        </Select.Option>
                      ))}
                    </Select.OptGroup>
                  </Select>
                </Space>
              }>
                <Input.TextArea rows={2} placeholder="静态值或选择右侧的动态表达式" />
              </Form.Item>
              <Form.Item name="required" label="必填" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="unique" label="唯一" valuePropName="checked"><Switch /></Form.Item>
              {['STRING', 'TEXT', 'SELECT', 'MULTI_SELECT'].includes(selectedType) && (
                <Form.Item name="isList" label="允许多个值（数组）" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* Snapshot Modal */}
      <Modal
        title="手动创建版本快照"
        open={snapshotModalOpen}
        onOk={handleTakeSnapshot}
        onCancel={() => { setSnapshotModalOpen(false); setSnapshotComment(''); }}
      >
        <Typography.Paragraph type="secondary">
          创建快照将记录当前实体和字段的完整状态，方便后续对比和回滚。
        </Typography.Paragraph>
        <Input
          placeholder="输入版本说明（可选）"
          value={snapshotComment}
          onChange={(e) => setSnapshotComment(e.target.value)}
        />
      </Modal>

      {/* Type Change Modal */}
      <Modal
        title={`修改字段类型 - ${typeChangeField?.displayName || ''}`}
        open={typeChangeModalOpen}
        onOk={handleTypeChange}
        onCancel={() => { setTypeChangeModalOpen(false); setTypeChangeField(null); }}
        confirmLoading={typeChangeLoading}
        okText="确认修改"
      >
        <Typography.Paragraph type="secondary">
          当前类型：<Tag color="blue">{typeChangeField?.type}</Tag>
        </Typography.Paragraph>
        <Typography.Paragraph type="warning" style={{ fontSize: 12 }}>
          修改字段类型后，已有数据将自动转换。部分转换可能导致数据丢失（如文本→数字时非数字值会被清空）。
        </Typography.Paragraph>
        <Select
          style={{ width: '100%' }}
          placeholder="选择新类型"
          value={selectedNewType || undefined}
          onChange={setSelectedNewType}
        >
          {compatibleTypes.map((ct: any) => (
            <Select.Option key={ct.toType} value={ct.toType}>
              {getFieldTypeConfig(ct.toType)?.label || ct.toType} — {ct.description}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Code Generation Modal */}
      <Modal
        title="生成代码"
        open={codegenModalOpen}
        onCancel={() => { setCodegenModalOpen(false); setCodegenResult(null); }}
        footer={null}
        width={720}
      >
        {codegenLoading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : codegenResult ? (
          <Tabs
            items={[
              {
                key: 'typescript',
                label: 'TypeScript 类型',
                children: (
                  <div>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(codegenResult.typescript)}
                      style={{ float: 'right', marginBottom: 8 }}>
                      复制
                    </Button>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 400, overflow: 'auto', clear: 'both' }}>
                      <code>{codegenResult.typescript}</code>
                    </pre>
                  </div>
                ),
              },
              {
                key: 'form',
                label: '表单组件',
                children: (
                  <div>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(codegenResult.formComponent)}
                      style={{ float: 'right', marginBottom: 8 }}>
                      复制
                    </Button>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 400, overflow: 'auto', clear: 'both' }}>
                      <code>{codegenResult.formComponent}</code>
                    </pre>
                  </div>
                ),
              },
              {
                key: 'table',
                label: '表格列定义',
                children: (
                  <div>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(codegenResult.tableComponent)}
                      style={{ float: 'right', marginBottom: 8 }}>
                      复制
                    </Button>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 400, overflow: 'auto', clear: 'both' }}>
                      <code>{codegenResult.tableComponent}</code>
                    </pre>
                  </div>
                ),
              },
            ]}
          />
        ) : null}
      </Modal>

      {/* Compare Result Modal */}
      <Modal
        title="版本差异对比"
        open={compareModalOpen}
        onCancel={() => { setCompareModalOpen(false); setCompareResult(null); }}
        footer={null}
        width={640}
      >
        {compareResult && (
          <div>
            <Typography.Text>
              从 v{compareResult.fromVersion} 到 v{compareResult.toVersion}，
              共 <Tag color={compareResult.changeCount > 0 ? 'orange' : 'green'}>{compareResult.changeCount}</Tag> 处变更
            </Typography.Text>
            <Divider />
            {compareResult.changes.length === 0 ? (
              <Typography.Text type="secondary">无差异</Typography.Text>
            ) : (
              <List
                dataSource={compareResult.changes}
                renderItem={(change: any) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        {change.type === 'added' && <Tag color="green">新增</Tag>}
                        {change.type === 'removed' && <Tag color="red">删除</Tag>}
                        {change.type === 'modified' && <Tag color="orange">修改</Tag>}
                        <Typography.Text strong>{change.field}</Typography.Text>
                      </Space>
                      {change.type === 'modified' && (
                        <Descriptions size="small" column={1}>
                          <Descriptions.Item label="旧值">{JSON.stringify(change.from)}</Descriptions.Item>
                          <Descriptions.Item label="新值">{JSON.stringify(change.to)}</Descriptions.Item>
                        </Descriptions>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Tag, Modal, Form, Input, Select, Switch,
  message, Space, Popconfirm, Tooltip, Tabs, List, Descriptions, Divider, Skeleton, Alert,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, QuestionCircleOutlined, StarOutlined,
  HistoryOutlined, FieldNumberOutlined, RollbackOutlined, CameraOutlined, CodeOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SortAscendingOutlined, DeleteOutlined,
} from '@ant-design/icons';

import { useEntity, useFields, useVersions, useCodeGen, useAllEntities, useKeyboard } from '../../hooks';
import { FIELD_TYPE_CONFIGS, getFieldTypeConfig } from '../../config/field-type.config';
import { AVAILABLE_EXPRESSIONS } from '../../config/default-expressions';
import type { CreateFieldRequest, FieldValidationRule } from '../../types';

const RELATION_TYPES = [
  { value: 'ONE_TO_ONE', label: '一对一 (1:1)' },
  { value: 'ONE_TO_MANY', label: '一对多 (1:N)' },
  { value: 'MANY_TO_MANY', label: '多对多 (M:N)' },
];

const VALIDATION_RULE_TYPES = [
  { value: 'minLength', label: '最小长度' },
  { value: 'maxLength', label: '最大长度' },
  { value: 'min', label: '最小值' },
  { value: 'max', label: '最大值' },
  { value: 'pattern', label: '正则匹配' },
] as const;

export default function EntityDesignerPage() {
  const { appId, entityId } = useParams<{ appId: string; entityId: string }>();
  const navigate = useNavigate();

  // ── Hooks ──
  const { entity, loading, error } = useEntity(appId, entityId);
  const fieldsApi = useFields(appId, entityId);
  const versionsApi = useVersions(appId, entityId);
  const codeGen = useCodeGen(appId, entityId);
  const { allEntities } = useAllEntities(appId);

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('fields');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('STRING');
  const [recommendedType, setRecommendedType] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [validationRules, setValidationRules] = useState<FieldValidationRule[]>([]);
  const [form] = Form.useForm();

  // ── 键盘快捷键 ──
  useKeyboard([
    { key: 'n', ctrl: true, handler: () => { setSelectedType('STRING'); setValidationRules([]); setModalOpen(true); } },
    { key: 's', ctrl: true, handler: () => { if (fieldsApi.hasOrderChanged) fieldsApi.saveOrder(); } },
    { key: 'f', ctrl: true, shift: true, handler: () => setActiveTab('fields') },
    { key: 'v', ctrl: true, shift: true, handler: () => setActiveTab('versions') },
  ]);

  // ── 拉取版本数据 ──
  useEffect(() => {
    if (activeTab === 'versions' && appId && entityId) {
      versionsApi.fetchVersions();
    }
  }, [activeTab, appId, entityId]);

  // ── 添加字段 ──
  const handleAddField = useCallback(async () => {
    const values = await form.validateFields();
    const payload: CreateFieldRequest = {
      name: values.name,
      displayName: values.displayName || values.name,
      type: values.type,
      required: values.required || false,
      unique: values.unique || false,
      isList: values.isList || false,
      defaultValue: values.defaultValue || undefined,
      validationRules: validationRules.length > 0 ? validationRules : undefined,
      placeholder: values.placeholder,
      helpText: values.helpText,
    };
    if (values.type === 'RELATION') {
      payload.relationTo = values.relationTo;
      payload.relationType = values.relationType;
    }
    if (['SELECT', 'MULTI_SELECT'].includes(values.type)) {
      payload.options = values.options;
    }
    await fieldsApi.addField(payload);
    setModalOpen(false);
    setSelectedType('STRING');
    setValidationRules([]);
    form.resetFields();
  }, [appId, entityId, form, fieldsApi, validationRules]);

  // ── 删除字段 ──
  const handleDeleteField = useCallback(async (fieldId: string) => {
    await fieldsApi.deleteField(fieldId);
  }, [fieldsApi]);

  // ── 类型变更 ──
  const onTypeChange = useCallback((value: string) => {
    setSelectedType(value);
    form.setFieldsValue({ relationTo: undefined, relationType: undefined });
  }, [form]);

  const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFieldName(name);
    if (name.trim()) {
      const rec = fieldsApi.getRecommendation(name);
      setRecommendedType(rec);
    } else {
      setRecommendedType(null);
    }
  }, [fieldsApi]);

  const applyRecommendation = useCallback(() => {
    if (recommendedType) {
      setSelectedType(recommendedType);
      form.setFieldsValue({ type: recommendedType });
      setRecommendedType(null);
    }
  }, [recommendedType, form]);

  // ── 类型变更状态 ──
  const [selectedNewType, setSelectedNewType] = useState<string>('');

  // ── 验证规则管理 ──
  const addValidationRule = useCallback(() => {
    setValidationRules((prev) => [...prev, { type: 'minLength', value: '' }]);
  }, []);

  const updateValidationRule = useCallback((index: number, rule: Partial<FieldValidationRule>) => {
    setValidationRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...rule };
      return next;
    });
  }, []);

  const removeValidationRule = useCallback((index: number) => {
    setValidationRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── 加载状态 ──
  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} />
            <Skeleton.Input active style={{ width: 200 }} />
          </Space>
        </div>
        <Card><Skeleton active paragraph={{ rows: 10 }} /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Alert type="error" message="加载实体失败" description={error} showIcon
          action={<Button onClick={() => navigate(`/apps/${appId}/models`)}>返回列表</Button>} />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="page-container">
        <Alert type="warning" message="实体不存在" showIcon
          action={<Button onClick={() => navigate(`/apps/${appId}/models`)}>返回列表</Button>} />
      </div>
    );
  }

  const targetEntities = allEntities.filter((e) => e.id !== entityId);

  // ── 渲染字段类型标签 ──
  const typeRenderer = (t: string) => {
    const cfg = getFieldTypeConfig(t);
    if (!cfg) return <Tag>{t}</Tag>;
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
  };

  // ── 字段表格列 ──
  const fieldColumns = [
    {
      title: '#', key: 'order', width: 60,
      render: (_v: unknown, _r: unknown, idx: number) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<ArrowUpOutlined />}
            disabled={idx === 0}
            onClick={() => fieldsApi.moveField(idx, idx - 1)}
            style={{ padding: 2, height: 20, width: 20 }} />
          <Button type="text" size="small" icon={<ArrowDownOutlined />}
            disabled={idx === fieldsApi.fields.length - 1}
            onClick={() => fieldsApi.moveField(idx, idx + 1)}
            style={{ padding: 2, height: 20, width: 20 }} />
        </Space>
      ),
    },
    { title: '字段名', dataIndex: 'displayName', key: 'displayName', ellipsis: true },
    { title: '标识', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 160,
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
      title: '必填', dataIndex: 'required', key: 'required', width: 60,
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '唯一', dataIndex: 'unique', key: 'unique', width: 60,
      render: (v: boolean) => v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button type="link" size="small"
            onClick={() => fieldsApi.openTypeChange(record.id)}>
            修改类型
          </Button>
          <Popconfirm title="确定删除此字段？" onConfirm={() => handleDeleteField(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── 版本表格列 ──
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
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button type="link" size="small"
            onClick={() => versionsApi.compare(record.version - 1, record.version)}
            disabled={record.version <= 1}>
            对比差异
          </Button>
          <Popconfirm
            title={`确定恢复到版本 ${record.version}？`}
            onConfirm={() => versionsApi.restore(record.version)}>
            <Button type="link" size="small" icon={<RollbackOutlined />}
              loading={versionsApi.restoreLoading === String(record.version)}>
              恢复
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Tab 定义 ──
  const tabItems = [
    {
      key: 'fields',
      label: <span><FieldNumberOutlined /> 字段管理</span>,
      children: (
        <Card
          extra={
            fieldsApi.hasOrderChanged && (
              <Button size="small" icon={<SortAscendingOutlined />}
                onClick={fieldsApi.saveOrder} type="primary">
                保存排序
              </Button>
            )
          }
        >
          <Table
            columns={fieldColumns}
            dataSource={fieldsApi.fields}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '还没有字段，点击上方"添加字段"开始' }}
          />
        </Card>
      ),
    },
    {
      key: 'versions',
      label: <span><HistoryOutlined /> 版本历史</span>,
      children: (
        <Card
          title={`共 ${versionsApi.versions.length} 个版本`}
          extra={
            <Button icon={<CameraOutlined />} onClick={versionsApi.openSnapshot}>
              手动创建快照
            </Button>
          }
        >
          <Table
            columns={versionColumns}
            dataSource={versionsApi.versions}
            rowKey="version"
            pagination={false}
            loading={versionsApi.loading}
            locale={{ emptyText: '暂无版本记录。每次修改时将自动创建快照。' }}
          />
        </Card>
      ),
    },
  ];

  // ── 判断是否显示验证规则 UI ──
  const showValidationRules = ['STRING', 'TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'URL'].includes(selectedType);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/models`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>{entity.displayName} - 字段管理</Typography.Title>
          <Tag color="blue">{entity.name}</Tag>
          <Tag>v{versionsApi.versions.length || 1}</Tag>
        </Space>
        <Space>
          <Button icon={<CodeOutlined />} onClick={codeGen.generateCode}>生成代码</Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setSelectedType('STRING'); setValidationRules([]); setModalOpen(true); }}>
            添加字段
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* ── 添加字段 Modal ── */}
      <Modal
        title="添加字段"
        open={modalOpen}
        onOk={handleAddField}
        onCancel={() => { setModalOpen(false); form.resetFields(); setValidationRules([]); }}
        width={580}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'STRING' }}>
          <Form.Item name="name" label="字段标识" rules={[
            { required: true },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' },
          ]}>
            <Input placeholder="如：name, email"
              onChange={onNameChange}
              suffix={recommendedType && fieldName.trim() && selectedType !== recommendedType ? (
                <Button type="link" size="small" icon={<StarOutlined />}
                  onClick={applyRecommendation} style={{ fontSize: 12, padding: 0 }}>
                  推荐: {getFieldTypeConfig(recommendedType)?.label}
                </Button>
              ) : null}
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

          {/* ── 关联字段选项 ── */}
          {selectedType === 'RELATION' && (
            <>
              <Form.Item name="relationTo" label="关联实体" rules={[{ required: true, message: '请选择关联实体' }]}>
                <Select placeholder="选择目标实体"
                  options={targetEntities.map((e) => ({ value: e.name, label: `${e.displayName} (${e.name})` }))} />
              </Form.Item>
              <Form.Item name="relationType" label="关联类型" rules={[{ required: true, message: '请选择关联类型' }]}>
                <Select options={RELATION_TYPES} placeholder="选择关联类型" />
              </Form.Item>
            </>
          )}

          {/* ── 非关联字段选项 ── */}
          {selectedType !== 'RELATION' && (
            <>
              <Form.Item name="placeholder" label="占位符提示">
                <Input placeholder="输入框内的提示文字" />
              </Form.Item>
              <Form.Item name="helpText" label="帮助说明">
                <Input placeholder="显示在字段下方的帮助文字" />
              </Form.Item>
              <Form.Item name="defaultValue" label={
                <Space size={4}>
                  <span>默认值</span>
                  <Select size="small" style={{ width: 140 }} placeholder="插入表达式"
                    value={undefined}
                    onChange={(val) => {
                      const current = form.getFieldValue('defaultValue') || '';
                      form.setFieldsValue({ defaultValue: current + val });
                    }}
                    onClick={(e) => e.stopPropagation()}>
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

              {/* ── 验证规则 ── */}
              {showValidationRules && (
                <Form.Item label="验证规则">
                  <div style={{ marginBottom: 8 }}>
                    {validationRules.map((rule, idx) => (
                      <Space key={idx} style={{ display: 'flex', marginBottom: 6 }} align="start">
                        <Select value={rule.type} onChange={(v) => updateValidationRule(idx, { type: v })}
                          style={{ width: 120 }} size="small">
                          {VALIDATION_RULE_TYPES.map((rt) => (
                            <Select.Option key={rt.value} value={rt.value}>{rt.label}</Select.Option>
                          ))}
                        </Select>
                        <Input size="small" placeholder={rule.type === 'pattern' ? '输入正则表达式' : '输入值'}
                          value={String(rule.value || '')}
                          onChange={(e) => updateValidationRule(idx, { value: e.target.value })}
                          style={{ width: 180 }} />
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}
                          onClick={() => removeValidationRule(idx)} />
                      </Space>
                    ))}
                    <Button type="dashed" size="small" onClick={addValidationRule}>
                      + 添加验证规则
                    </Button>
                  </div>
                </Form.Item>
              )}

              <Space size="middle">
                <Form.Item name="required" label="必填" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="unique" label="唯一" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Space>

              {['STRING', 'TEXT', 'SELECT', 'MULTI_SELECT'].includes(selectedType) && (
                <Form.Item name="isList" label="允许多个值（数组）" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* ── 快照 Modal ── */}
      <Modal title="手动创建版本快照"
        open={versionsApi.snapshotModalOpen}
        onOk={versionsApi.takeSnapshot}
        onCancel={versionsApi.closeSnapshot}>
        <Typography.Paragraph type="secondary">
          创建快照将记录当前实体和字段的完整状态，方便后续对比和回滚。
        </Typography.Paragraph>
        <Input placeholder="输入版本说明（可选）"
          value={versionsApi.snapshotComment}
          onChange={(e) => versionsApi.setSnapshotComment(e.target.value)} />
      </Modal>

      {/* ── 类型变更 Modal ── */}
      <Modal title={`修改字段类型`}
        open={fieldsApi.typeChangeField !== null}
        onOk={() => {
          if (fieldsApi.typeChangeField && selectedNewType) {
            fieldsApi.applyTypeChange(fieldsApi.typeChangeField, selectedNewType);
          }
        }}
        onCancel={() => { fieldsApi.closeTypeChange(); setSelectedNewType(''); }}
        confirmLoading={fieldsApi.typeChangeLoading}
        okText="确认修改"
        okButtonProps={{ disabled: !selectedNewType }}>
        <Typography.Paragraph type="warning" style={{ fontSize: 12 }}>
          修改字段类型后，已有数据将自动转换。部分转换可能导致数据丢失。
        </Typography.Paragraph>
        <Select style={{ width: '100%' }} placeholder="选择新类型"
          value={selectedNewType || undefined}
          onChange={setSelectedNewType}>
          {fieldsApi.compatibleTypes.map((ct) => (
            <Select.Option key={ct.toType} value={ct.toType}>
              {getFieldTypeConfig(ct.toType)?.label || ct.toType} — {ct.description}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* ── 代码生成 Modal ── */}
      <Modal title="生成代码"
        open={codeGen.codegenModalOpen}
        onCancel={codeGen.closeCodeGen}
        footer={null}
        width={720}>
        {codeGen.codegenLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : codeGen.codegenResult ? (
          <Tabs items={[
            {
              key: 'typescript',
              label: 'TypeScript 类型',
              children: (
                <div>
                  <Button size="small" style={{ float: 'right', marginBottom: 8 }}
                    onClick={() => codeGen.copyToClipboard(codeGen.codegenResult!.typescript)}>
                    复制
                  </Button>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 400, overflow: 'auto', clear: 'both' }}>
                    <code>{codeGen.codegenResult.typescript}</code>
                  </pre>
                </div>
              ),
            },
            {
              key: 'form',
              label: '表单组件',
              children: (
                <div>
                  <Button size="small" style={{ float: 'right', marginBottom: 8 }}
                    onClick={() => codeGen.copyToClipboard(codeGen.codegenResult!.formComponent)}>
                    复制
                  </Button>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 400, overflow: 'auto', clear: 'both' }}>
                    <code>{codeGen.codegenResult.formComponent}</code>
                  </pre>
                </div>
              ),
            },
            {
              key: 'table',
              label: '表格列定义',
              children: (
                <div>
                  <Button size="small" style={{ float: 'right', marginBottom: 8 }}
                    onClick={() => codeGen.copyToClipboard(codeGen.codegenResult!.tableComponent)}>
                    复制
                  </Button>
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 400, overflow: 'auto', clear: 'both' }}>
                    <code>{codeGen.codegenResult.tableComponent}</code>
                  </pre>
                </div>
              ),
            },
          ]} />
        ) : null}
      </Modal>

      {/* ── 版本对比 Modal ── */}
      <Modal title="版本差异对比"
        open={versionsApi.compareModalOpen}
        onCancel={versionsApi.closeCompare}
        footer={null}
        width={640}>
        {versionsApi.compareResult && (
          <div>
            <Typography.Text>
              从 v{versionsApi.compareResult.fromVersion} 到 v{versionsApi.compareResult.toVersion}，
              共 <Tag color={versionsApi.compareResult.changeCount > 0 ? 'orange' : 'green'}>
                {versionsApi.compareResult.changeCount}</Tag> 处变更
            </Typography.Text>
            <Divider />
            {versionsApi.compareResult.changes.length === 0 ? (
              <Typography.Text type="secondary">无差异</Typography.Text>
            ) : (
              <List dataSource={versionsApi.compareResult.changes}
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
                )} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

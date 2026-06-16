import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Tag, Modal, Form, Input, Select, Switch,
  message, Space, Popconfirm, Spin,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { entityService } from '../../services/entity.service';

const FIELD_TYPES = [
  { value: 'STRING', label: '单行文本' },
  { value: 'TEXT', label: '多行文本' },
  { value: 'NUMBER', label: '数字' },
  { value: 'BOOLEAN', label: '布尔' },
  { value: 'DATE', label: '日期' },
  { value: 'DATETIME', label: '日期时间' },
  { value: 'EMAIL', label: '邮箱' },
  { value: 'PHONE', label: '电话' },
  { value: 'URL', label: '链接' },
  { value: 'SELECT', label: '下拉选择' },
  { value: 'FILE', label: '文件' },
  { value: 'IMAGE', label: '图片' },
  { value: 'JSON', label: 'JSON' },
  { value: 'RELATION', label: '表关联' },
];

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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('STRING');
  const [form] = Form.useForm();

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

  const handleAddField = async () => {
    const values = await form.validateFields();

    // Build the field payload
    const payload: Record<string, any> = {
      name: values.name,
      displayName: values.displayName || values.name,
      type: values.type,
      required: values.required || false,
      unique: values.unique || false,
    };

    // If relation field, add relation metadata
    if (values.type === 'RELATION') {
      payload.relationTo = values.relationTo;
      payload.relationType = values.relationType;
      payload.required = false; // relation fields are always optional references
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

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!entity) return <Typography.Text type="danger">实体不存在</Typography.Text>;

  // Filter out the current entity from the target list (can't relate to self)
  const targetEntities = allEntities.filter((e: any) => e.id !== entityId);

  const typeRenderer = (t: string) => {
    const found = FIELD_TYPES.find(f => f.value === t);
    if (t === 'RELATION') return <Tag color="blue">表关联</Tag>;
    return <Tag>{found?.label || t}</Tag>;
  };

  const columns = [
    { title: '字段名', dataIndex: 'displayName', key: 'displayName' },
    { title: '标识', dataIndex: 'name', key: 'name' },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (t: string, record: any) => {
        if (t === 'RELATION') {
          const relType = record.relationType === 'ONE_TO_ONE' ? '1:1'
            : record.relationType === 'MANY_TO_MANY' ? 'M:N' : '1:N';
          const target = record.relationTo || '?';
          return (
            <Tag color="blue">
              关联 {target} ({relType})
            </Tag>
          );
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
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm title="确定删除此字段？" onConfirm={() => handleDeleteField(record.id)}>
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/models`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>{entity.displayName} - 字段管理</Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedType('STRING'); setModalOpen(true); }}>
          添加字段
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={entity.fields} rowKey="id" pagination={false}
          locale={{ emptyText: '还没有字段，点击"添加字段"开始' }} />
      </Card>

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
            <Input placeholder="如：name, email" />
          </Form.Item>
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="如：姓名, 邮箱" />
          </Form.Item>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select options={FIELD_TYPES} onChange={onTypeChange} />
          </Form.Item>

          {/* Relation-specific fields */}
          {selectedType === 'RELATION' && (
            <>
              <Form.Item name="relationTo" label="关联实体" rules={[{ required: true, message: '请选择关联实体' }]}>
                <Select
                  placeholder="选择目标实体"
                  options={targetEntities.map((e: any) => ({
                    value: e.name,
                    label: `${e.displayName} (${e.name})`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="relationType" label="关联类型" rules={[{ required: true, message: '请选择关联类型' }]}>
                <Select options={RELATION_TYPES} placeholder="选择关联类型" />
              </Form.Item>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {form.getFieldValue('relationType') === 'MANY_TO_MANY'
                  ? '多对多关联将自动生成中间关系表'
                  : form.getFieldValue('relationType') === 'ONE_TO_ONE'
                    ? '一对一关联将在目标实体中存储本实体的 ID'
                    : '一对多关联将在本实体中存储目标实体的 ID'}
              </Typography.Text>
            </>
          )}

          {selectedType !== 'RELATION' && (
            <>
              <Form.Item name="required" label="必填" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="unique" label="唯一" valuePropName="checked">
                <Switch />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

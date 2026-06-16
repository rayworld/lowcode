import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Table, Tag, Modal, Form, Input, Select, Switch, message, Space, Popconfirm, Spin } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, FieldStringOutlined } from '@ant-design/icons';
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
];

export default function EntityDesignerPage() {
  const { appId, entityId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (entityId) {
      entityService.findById(entityId).then((res) => setEntity(res.data)).finally(() => setLoading(false));
    }
  }, [entityId]);

  const handleAddField = async () => {
    const values = await form.validateFields();
    await entityService.addField(entityId!, values);
    message.success('字段添加成功');
    setModalOpen(false);
    form.resetFields();
    const res = await entityService.findById(entityId!);
    setEntity(res.data);
  };

  const handleDeleteField = async (fieldId: string) => {
    await entityService.removeField(fieldId);
    message.success('字段已删除');
    const res = await entityService.findById(entityId!);
    setEntity(res.data);
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!entity) return <Typography.Text type="danger">实体不存在</Typography.Text>;

  const columns = [
    { title: '字段名', dataIndex: 'displayName', key: 'displayName' },
    { title: '标识', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{FIELD_TYPES.find(f => f.value === t)?.label || t}</Tag> },
    { title: '必填', dataIndex: 'required', key: 'required', render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag> },
    { title: '唯一', dataIndex: 'unique', key: 'unique', render: (v: boolean) => v ? <Tag color="blue">是</Tag> : <Tag>否</Tag> },
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>添加字段</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={entity.fields} rowKey="id" pagination={false}
          locale={{ emptyText: '还没有字段，点击"添加字段"开始' }} />
      </Card>

      <Modal title="添加字段" open={modalOpen} onOk={handleAddField} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
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
            <Select options={FIELD_TYPES} />
          </Form.Item>
          <Form.Item name="required" label="必填" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="unique" label="唯一" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

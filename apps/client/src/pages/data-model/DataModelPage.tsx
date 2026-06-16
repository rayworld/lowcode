import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Table, Tag, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, DatabaseOutlined } from '@ant-design/icons';
import { entityService } from '../../services/entity.service';

export default function DataModelPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchEntities = async () => {
    if (!appId) return;
    try {
      const res = await entityService.findAll(appId);
      setEntities(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntities(); }, [appId]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await entityService.create(appId!, values);
    message.success('数据实体创建成功');
    setModalOpen(false);
    form.resetFields();
    fetchEntities();
  };

  const handleDelete = async (id: string) => {
    await entityService.remove(id);
    message.success('已删除');
    fetchEntities();
  };

  const columns = [
    { title: '实体名称', dataIndex: 'displayName', key: 'displayName' },
    { title: '标识符', dataIndex: 'name', key: 'name' },
    { title: '字段数', dataIndex: 'fields', key: 'fieldsCount', render: (fields: any[]) => fields?.length || 0 },
    { title: '记录数', key: 'recordsCount', render: (_: any, record: any) => record._count?.records || 0 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString('zh-CN') },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/apps/${appId}/models/${record.id}`)}>编辑字段</Button>
          <Button type="link" onClick={() => navigate(`/apps/${appId}/data/${record.id}`)}>浏览数据</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>数据模型</Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>创建实体</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={entities} rowKey="id" loading={loading}
          locale={{ emptyText: '还没有数据实体，创建一个吧' }} />
      </Card>

      <Modal title="创建数据实体" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="实体标识" rules={[
            { required: true, message: '请输入实体标识' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线，以字母开头' },
          ]}>
            <Input placeholder="如：User, Order" />
          </Form.Item>
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="如：用户, 订单" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

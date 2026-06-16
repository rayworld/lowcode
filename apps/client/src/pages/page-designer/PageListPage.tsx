import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Table, Tag, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { pageService } from '../../services/page.service';

export default function PageListPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchPages = async () => {
    if (!appId) return;
    try {
      const res = await pageService.findByApp(appId);
      setPages(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, [appId]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    const route = '/' + values.title.toLowerCase().replace(/\s+/g, '-');
    const res = await pageService.create({ appId: appId!, title: values.title, route });
    message.success('页面创建成功');
    setModalOpen(false);
    form.resetFields();
    navigate(`/apps/${appId}/pages/${res.data.id}/design`);
  };

  const handleDelete = async (id: string) => {
    await pageService.remove(appId!, id);
    message.success('页面已删除');
    fetchPages();
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: '草稿', color: 'default' },
    PUBLISHED: { label: '已发布', color: 'green' },
  };

  const columns = [
    { title: '页面名称', dataIndex: 'title', key: 'title' },
    { title: '路由', dataIndex: 'route', key: 'route', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const s = statusMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '版本', dataIndex: 'version', key: 'version',
      render: (v: number) => <span>v{v}</span>,
    },
    {
      title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/apps/${appId}/pages/${record.id}/design`)}>
            编辑
          </Button>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/apps/${appId}/pages/${record.id}/design`)}>
            预览
          </Button>
          <Popconfirm title="确定删除此页面？" description="删除后无法恢复" onConfirm={() => handleDelete(record.id)}>
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
          <Typography.Title level={4} style={{ margin: 0 }}>页面管理</Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
          创建页面
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '还没有页面，创建一个吧' }}
        />
      </Card>

      <Modal
        title="创建新页面"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题' }]}
          >
            <Input placeholder="如：用户列表, 订单详情" />
          </Form.Item>
          <Typography.Text type="secondary">
            路由将自动生成: /
            {form.getFieldValue('title')
              ? form.getFieldValue('title').toLowerCase().replace(/\s+/g, '-')
              : 'page-name'}
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}

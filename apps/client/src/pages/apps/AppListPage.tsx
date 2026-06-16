import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Row, Col, Tag, Modal, Input, Form, message, Empty } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { appService } from '../../services/app.service';
import { Application } from '@lowcode/shared';

export default function AppListPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchApps = async () => {
    try {
      const res = await appService.findAll();
      setApps(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await appService.create(values);
    message.success('应用创建成功');
    setModalOpen(false);
    form.resetFields();
    fetchApps();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Typography.Title level={4}>应用管理</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          创建应用
        </Button>
      </div>

      {apps.length === 0 && !loading ? (
        <Card>
          <Empty description="暂无应用" style={{ padding: 60 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建你的第一个应用
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {apps.map((app) => (
            <Col xs={24} sm={12} md={8} lg={6} key={app.id}>
              <Card
                hoverable
                onClick={() => navigate(`/apps/${app.id}`)}
                actions={[
                  <Button type="link" key="open" onClick={(e) => { e.stopPropagation(); navigate(`/apps/${app.id}`); }}>
                    打开
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={<AppstoreOutlined style={{ fontSize: 32, color: '#1677ff' }} />}
                  title={app.name}
                  description={
                    <>
                      <p style={{ color: '#999', fontSize: 12, marginBottom: 8, minHeight: 36 }}>
                        {app.description || '暂无描述'}
                      </p>
                      <Tag color={app.status === 'PUBLISHED' ? 'green' : app.status === 'ARCHIVED' ? 'default' : 'blue'}>
                        {app.status === 'PUBLISHED' ? '已发布' : app.status === 'ARCHIVED' ? '已归档' : '草稿'}
                      </Tag>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title="创建应用" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
            <Input placeholder="输入应用名称" />
          </Form.Item>
          <Form.Item name="description" label="应用描述">
            <Input.TextArea rows={3} placeholder="输入应用描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

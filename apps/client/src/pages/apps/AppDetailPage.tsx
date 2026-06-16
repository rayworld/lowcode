import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Button, Tag, Descriptions, Spin } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { appService } from '../../services/app.service';
import { Application } from '@lowcode/shared';

export default function AppDetailPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appId) {
      appService.findById(appId).then((res) => setApp(res.data)).finally(() => setLoading(false));
    }
  }, [appId]);

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!app) return <Typography.Text type="danger">应用不存在</Typography.Text>;

  const features = [
    { key: 'models', title: '数据模型', icon: <DatabaseOutlined style={{ fontSize: 28, color: '#1677ff' }} />, desc: '定义业务数据结构', path: `/apps/${appId}/models` },
    { key: 'pages', title: '页面设计', icon: <FileTextOutlined style={{ fontSize: 28, color: '#52c41a' }} />, desc: '可视化页面构建', path: `/apps/${appId}/pages` },
    { key: 'workflows', title: '工作流', icon: <NodeIndexOutlined style={{ fontSize: 28, color: '#faad14' }} />, desc: '自动化业务流程', path: `/apps/${appId}/workflows` },
    { key: 'settings', title: '应用设置', icon: <SettingOutlined style={{ fontSize: 28, color: '#999' }} />, desc: '配置应用信息', path: `/apps/${appId}/settings` },
  ];

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/apps')}>
          返回应用列表
        </Button>
      </div>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions title={app.name} extra={<Tag>{app.status === 'PUBLISHED' ? '已发布' : app.status === 'ARCHIVED' ? '已归档' : '草稿'}</Tag>}>
          <Descriptions.Item label="描述">{app.description || '暂无描述'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(app.createdAt).toLocaleDateString('zh-CN')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Typography.Title level={5} style={{ marginBottom: 16 }}>功能模块</Typography.Title>
      <Row gutter={[16, 16]}>
        {features.map((f) => (
          <Col xs={24} sm={12} md={12} lg={6} key={f.key}>
            <Card hoverable onClick={() => navigate(f.path)} style={{ height: '100%' }}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                {f.icon}
                <Typography.Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>{f.title}</Typography.Title>
                <Typography.Text type="secondary">{f.desc}</Typography.Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

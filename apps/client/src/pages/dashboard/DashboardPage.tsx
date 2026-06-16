import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, List, Tag } from 'antd';
import { AppstoreOutlined, FileTextOutlined, DatabaseOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { appService } from '../../services/app.service';
import { Application } from '@lowcode/shared';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<(Application & { _count?: { pages: number; dataModels: number; workflows: number } })[]>([]);

  useEffect(() => {
    appService.findAll().then((res) => setApps(res.data || []));
  }, []);

  const totalPages = apps.reduce((sum, a) => sum + (a._count?.pages || 0), 0);
  const totalModels = apps.reduce((sum, a) => sum + (a._count?.dataModels || 0), 0);
  const totalWorkflows = apps.reduce((sum, a) => sum + (a._count?.workflows || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <Typography.Title level={4}>工作台</Typography.Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="应用总数" value={apps.length} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="页面总数" value={totalPages} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="数据模型" value={totalModels} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="工作流" value={totalWorkflows} prefix={<NodeIndexOutlined />} />
          </Card>
        </Col>
      </Row>

      <Typography.Title level={5} style={{ marginBottom: 16 }}>最近的应用</Typography.Title>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
        dataSource={apps.slice(0, 8)}
        renderItem={(app) => (
          <List.Item>
            <Card
              hoverable
              onClick={() => navigate(`/apps/${app.id}`)}
            >
              <Card.Meta
                title={app.name}
                description={
                  <>
                    <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                      {app.description || '暂无描述'}
                    </p>
                    <Tag color={app.status === 'PUBLISHED' ? 'green' : app.status === 'ARCHIVED' ? 'default' : 'blue'}>
                      {app.status === 'PUBLISHED' ? '已发布' : app.status === 'ARCHIVED' ? '已归档' : '草稿'}
                    </Tag>
                  </>
                }
              />
            </Card>
          </List.Item>
        )}
        locale={{ emptyText: '还没有创建应用，去"应用管理"创建一个吧' }}
      />
    </div>
  );
}

import { Card, Typography, Descriptions, Tag, Divider, Space } from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        系统设置
      </Typography.Title>

      {/* User Profile */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>个人信息</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2}>
          <Descriptions.Item label="用户名">{user?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color={user?.role === 'ADMIN' ? 'red' : 'blue'}>
              {user?.role === 'ADMIN' ? '管理员' : user?.role === 'DEVELOPER' ? '开发者' : '普通用户'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="账号状态">
            <Tag color={user?.isActive ? 'green' : 'default'}>
              {user?.isActive ? '正常' : '已禁用'}
            </Tag>
          </Descriptions.Item>
          {user?.createdAt && (
            <Descriptions.Item label="注册时间">
              {new Date(user.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Security */}
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>安全</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Typography.Text type="secondary">
          密码和安全相关设置请联系管理员。
        </Typography.Text>
      </Card>

      {/* About */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            <span>关于</span>
          </Space>
        }
      >
        <Descriptions column={1}>
          <Descriptions.Item label="平台名称">低代码开发平台</Descriptions.Item>
          <Descriptions.Item label="版本">1.0.0</Descriptions.Item>
        </Descriptions>
        <Divider />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          低代码开发平台 — 快速构建企业级应用
        </Typography.Text>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: { email: string; username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.register(values);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      message.success('注册成功');
      navigate('/dashboard');
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          🛠 注册新账号
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱', type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            已有账号？<Link to="/login">返回登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

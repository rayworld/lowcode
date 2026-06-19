import { useEffect, useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Typography } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const menuItems = useMemo(() => {
    const items: any[] = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
      { key: '/apps', icon: <AppstoreOutlined />, label: '应用管理' },
    ];
    if (isAdmin) {
      items.push({
        key: 'admin',
        icon: <SafetyOutlined />,
        label: '后台管理',
        children: [
          { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
        ],
      });
    }
    items.push({ key: '/settings', icon: <SettingOutlined />, label: '系统设置' });
    return items;
  }, [isAdmin]);

  useEffect(() => {
    useAuthStore.getState().loadFromStorage();
  }, []);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) navigate(key);
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/apps')) return ['/apps'];
    return [path];
  };

  // Auto-open admin submenu when on admin page
  useEffect(() => {
    if (location.pathname.startsWith('/admin') && isAdmin) {
      setOpenKeys((prev) => prev.includes('admin') ? prev : [...prev, 'admin']);
    }
  }, [location.pathname, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Typography.Title level={4} style={{ margin: 0, fontSize: collapsed ? 16 : 18 }}>
            {collapsed ? '🛠' : '🛠 低代码平台'}
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={getSelectedKeys()}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #f0f0f0',
            cursor: 'pointer',
            color: '#999',
            fontSize: 16,
            transition: 'all 0.2s',
          }}
          className="sider-trigger"
        >
          {collapsed ? '▶' : '◀'}
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
          }}
        >
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') handleLogout();
              },
            }}
          >
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.username || user?.email || '用户'}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

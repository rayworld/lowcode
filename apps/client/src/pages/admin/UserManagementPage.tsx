import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Card, Typography, Tag, Space, Button, Modal, Form,
  Select, message, Popconfirm, Switch, Tooltip, Input,
} from 'antd';
import {
  UserOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, SearchOutlined, CrownOutlined,
} from '@ant-design/icons';
import { User, UserRole, UpdateUserDto } from '@lowcode/shared';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/user.service';

const ROLE_MAP: Record<UserRole, { label: string; color: string }> = {
  ADMIN: { label: '管理员', color: 'red' },
  DEVELOPER: { label: '开发者', color: 'blue' },
  EDITOR: { label: '编辑者', color: 'green' },
  VIEWER: { label: '查看者', color: 'default' },
};

const ROLE_OPTIONS = Object.entries(ROLE_MAP).map(([value, { label }]) => ({
  value,
  label,
}));

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Check permission
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <CrownOutlined style={{ fontSize: 48, color: '#faad14' }} />
        <Typography.Title level={4} type="secondary" style={{ marginTop: 16 }}>
          需要管理员权限才能访问此页面
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          返回工作台
        </Button>
      </div>
    );
  }

  return <UserManagementInner
    currentUser={currentUser!}
    users={users} setUsers={setUsers}
    total={total} setTotal={setTotal}
    page={page} setPage={setPage}
    pageSize={pageSize} setPageSize={setPageSize}
    loading={loading} setLoading={setLoading}
    editModalOpen={editModalOpen} setEditModalOpen={setEditModalOpen}
    editingUser={editingUser} setEditingUser={setEditingUser}
    saving={saving} setSaving={setSaving}
    searchText={searchText} setSearchText={setSearchText}
    form={form}
  />;
}

function UserManagementInner({
  currentUser, users, setUsers, total, setTotal,
  page, setPage, pageSize, setPageSize,
  loading, setLoading,
  editModalOpen, setEditModalOpen,
  editingUser, setEditingUser,
  saving, setSaving,
  searchText, setSearchText,
  form,
}: {
  currentUser: User;
  users: User[]; setUsers: (u: User[]) => void;
  total: number; setTotal: (t: number) => void;
  page: number; setPage: (p: number) => void;
  pageSize: number; setPageSize: (p: number) => void;
  loading: boolean; setLoading: (l: boolean) => void;
  editModalOpen: boolean; setEditModalOpen: (o: boolean) => void;
  editingUser: User | null; setEditingUser: (u: User | null) => void;
  saving: boolean; setSaving: (s: boolean) => void;
  searchText: string; setSearchText: (s: string) => void;
  form: any;
}) {
  const fetchUsers = async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const res = await userService.findAll(p, ps);
      setUsers(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      role: user.role,
      isActive: user.isActive,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const dto: UpdateUserDto = {
        role: values.role,
        isActive: values.isActive,
      };
      await userService.update(editingUser.id, dto);
      message.success('用户信息已更新');
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser.id) {
      message.warning('不能删除自己');
      return;
    }
    await userService.remove(user.id);
    message.success('用户已删除');
    fetchUsers();
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (text: string, record: User) => (
        <Space>
          <UserOutlined />
          <Typography.Text strong>{text || '-'}</Typography.Text>
          {record.id === currentUser.id && (
            <Tag color="processing" style={{ fontSize: 10 }}>我</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => {
        const info = ROLE_MAP[role] || { label: role, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '正常' : '已禁用'}</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: User) => (
        <Space>
          <Tooltip title="编辑角色/状态">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={`确定删除用户「${record.username || record.email}」？`}
            description="此操作不可恢复"
            onConfirm={() => handleDelete(record)}
            okText="确定删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除用户">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={record.id === currentUser.id}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>用户管理</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索用户名或邮箱..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => fetchUsers()}
              style={{ width: 220 }}
              allowClear
            />
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={() => fetchUsers()} />
            </Tooltip>
          </Space>
        }
      >
        <Table
          dataSource={
            searchText
              ? users.filter(u =>
                  u.username?.toLowerCase().includes(searchText.toLowerCase()) ||
                  u.email?.toLowerCase().includes(searchText.toLowerCase())
                )
              : users
          }
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 个用户`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="编辑用户"
        open={editModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {editingUser && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
              <Typography.Text strong>{editingUser.username}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                ({editingUser.email})
              </Typography.Text>
            </div>
          )}
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="正常" unCheckedChildren="已禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

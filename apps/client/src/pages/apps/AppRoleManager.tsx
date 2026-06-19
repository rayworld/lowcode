import { useEffect, useState } from 'react';
import {
  Table, Card, Typography, Tag, Space, Button, Modal, Form,
  Input, message, Popconfirm, Checkbox, Drawer, Row, Col, Tooltip,
  Select, Avatar,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SafetyOutlined, SettingOutlined, UserOutlined,
  TeamOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { Role, PermissionAction, AppRoleMember } from '@lowcode/shared';
import { permissionService } from '../../services/permission.service';
import { userService } from '../../services/user.service';

const RESOURCES = [
  { key: 'app', label: '应用管理' },
  { key: 'model', label: '数据模型（含数据记录）' },
  { key: 'page', label: '页面设计' },
  { key: 'workflow', label: '工作流' },
  { key: 'setting', label: '应用设置' },
];

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: PermissionAction.CREATE, label: '创建' },
  { key: PermissionAction.READ, label: '查看' },
  { key: PermissionAction.UPDATE, label: '编辑' },
  { key: PermissionAction.DELETE, label: '删除' },
  { key: PermissionAction.MANAGE, label: '管理' },
];

interface Props {
  appId: string;
}

export default function AppRoleManager({ appId }: Props) {
  // ====== Role management state ======
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [permDrawerOpen, setPermDrawerOpen] = useState(false);
  const [permRole, setPermRole] = useState<Role | null>(null);
  const [permSelections, setPermSelections] = useState<Record<string, PermissionAction[]>>({});
  const [permSaving, setPermSaving] = useState(false);
  const [roleForm] = Form.useForm();

  // ====== Member management state ======
  const [members, setMembers] = useState<AppRoleMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; email: string }[]>([]);
  const [addMemberSaving, setAddMemberSaving] = useState(false);
  const [addMemberForm] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await permissionService.findRoles(appId);
      setRoles(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await permissionService.findMembers(appId);
      setMembers(res.data);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchMembers();
  }, [appId]);

  // Build permission map from role permissions array
  const buildPermMap = (role: Role): Record<string, PermissionAction[]> => {
    const map: Record<string, PermissionAction[]> = {};
    for (const p of role.permissions || []) {
      if (!map[p.resource]) map[p.resource] = [];
      map[p.resource].push(p.action as PermissionAction);
    }
    return map;
  };

  // ====== Role CRUD ======
  const handleCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue({ name: role.name, description: role.description });
    setRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    setSaving(true);
    try {
      const values = await roleForm.validateFields();
      if (editingRole) {
        await permissionService.updateRole(appId, editingRole.id, values);
        message.success('角色已更新');
      } else {
        await permissionService.createRole(appId, values);
        message.success('角色已创建');
      }
      setRoleModalOpen(false);
      setEditingRole(null);
      fetchRoles();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    await permissionService.removeRole(appId, role.id);
    message.success('角色已删除');
    fetchRoles();
    fetchMembers();
  };

  // ====== Permission editing ======
  const openPermDrawer = (role: Role) => {
    setPermRole(role);
    setPermSelections(buildPermMap(role));
    setPermDrawerOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!permRole) return;
    setPermSaving(true);
    try {
      const currentMap = buildPermMap(permRole);

      // Remove permissions that were unchecked
      for (const resource of Object.keys(currentMap)) {
        const currentActions = currentMap[resource] || [];
        const newActions = permSelections[resource] || [];
        for (const action of currentActions) {
          if (!newActions.includes(action)) {
            const perm = permRole.permissions?.find(
              (p) => p.resource === resource && p.action === action,
            );
            if (perm) {
              await permissionService.removePermission(appId, perm.id);
            }
          }
        }
      }

      // Add permissions that were newly checked
      for (const resource of Object.keys(permSelections)) {
        const newActions = permSelections[resource] || [];
        const currentActions = currentMap[resource] || [];
        for (const action of newActions) {
          if (!currentActions.includes(action)) {
            await permissionService.addPermission(appId, permRole.id, resource, action);
          }
        }
      }

      message.success('权限已更新');
      setPermDrawerOpen(false);
      setPermRole(null);
      fetchRoles();
    } finally {
      setPermSaving(false);
    }
  };

  // ====== Member management ======
  const handleOpenAddMember = async () => {
    // Load all users for selection
    try {
      const res = await userService.findAll(1, 200);
      setAllUsers(res.data.items || []);
    } catch {
      setAllUsers([]);
    }
    addMemberForm.resetFields();
    setAddMemberOpen(true);
  };

  const handleAddMember = async () => {
    setAddMemberSaving(true);
    try {
      const values = await addMemberForm.validateFields();
      // Assign user to each selected role
      for (const roleId of values.roleIds) {
        await permissionService.addUserToRole(appId, roleId, { userId: values.userId });
      }
      message.success('成员已添加');
      setAddMemberOpen(false);
      fetchMembers();
    } finally {
      setAddMemberSaving(false);
    }
  };

  const handleRemoveMember = async (roleId: string, userId: string, username: string, roleName: string) => {
    await permissionService.removeUserFromRole(appId, roleId, userId);
    message.success(`已从「${roleName}」移除 ${username}`);
    fetchMembers();
  };

  const handleRemoveMemberAllRoles = async (userId: string, username: string) => {
    // Find all roles for this user and remove from each
    const userMemberships = members.find((m) => m.id === userId)?.appRoles || [];
    for (const r of userMemberships) {
      await permissionService.removeUserFromRole(appId, r.roleId, userId);
    }
    message.success(`${username} 已从所有角色移除`);
    fetchMembers();
  };

  // ====== Table columns ======
  const roleColumns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string) => text || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: '成员数',
      key: 'memberCount',
      width: 100,
      render: (_: any, record: Role & { _count?: { users: number } }) => (
        <Tag>{record._count?.users ?? 0} 人</Tag>
      ),
    },
    {
      title: '权限',
      key: 'permissions',
      render: (_: any, record: Role) => {
        const permCount = record.permissions?.length || 0;
        return (
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openPermDrawer(record)}>
            {permCount > 0 ? `${permCount} 项权限` : '配置权限'}
          </Button>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: any, record: Role) => (
        <Space>
          <Tooltip title="编辑角色">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEditRole(record)} />
          </Tooltip>
          <Popconfirm
            title={`确定删除角色「${record.name}」？`}
            onConfirm={() => handleDeleteRole(record)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除角色">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const memberColumns = [
    {
      title: '用户',
      key: 'user',
      width: 220,
      render: (_: any, record: AppRoleMember) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Typography.Text strong>{record.username || '-'}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '系统角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>
          {role === 'ADMIN' ? '管理员' : role === 'DEVELOPER' ? '开发者' : role === 'EDITOR' ? '编辑者' : '查看者'}
        </Tag>
      ),
    },
    {
      title: '应用角色',
      key: 'appRoles',
      render: (_: any, record: AppRoleMember) => (
        <Space wrap>
          {(record.appRoles || []).length > 0
            ? record.appRoles.map((r) => (
                <Tag
                  key={r.roleId}
                  closable
                  onClose={() => handleRemoveMember(r.roleId, record.id, record.username || record.email, r.roleName)}
                >
                  {r.roleName}
                </Tag>
              ))
            : <Typography.Text type="secondary">未分配角色</Typography.Text>
          }
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: AppRoleMember) => (
        <Popconfirm
          title={`确定移除 ${record.username || record.email} 的所有角色？`}
          onConfirm={() => handleRemoveMemberAllRoles(record.id, record.username || record.email)}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="移除所有角色">
            <Button type="link" danger icon={<CloseCircleOutlined />} disabled={(record.appRoles || []).length === 0}>
              移除
            </Button>
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {/* 应用角色列表 */}
      <Card
        title={
          <Space><SafetyOutlined />应用角色</Space>
        }
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={handleOpenAddMember}>
              添加成员
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
              新建角色
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          dataSource={roles}
          columns={roleColumns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* 成员分配 */}
      <Card
        title={
          <Space><TeamOutlined />成员分配</Space>
        }
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          一个用户可分配多个角色，权限取所有角色的并集。
        </Typography.Text>
        <Table
          dataSource={members}
          columns={memberColumns}
          rowKey="id"
          loading={membersLoading}
          pagination={false}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Create/Edit Role Modal */}
      <Modal
        title={editingRole ? '编辑角色' : '新建角色'}
        open={roleModalOpen}
        onOk={handleSaveRole}
        onCancel={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="例如：管理员、编辑者" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="角色描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Drawer */}
      <Drawer
        title={permRole ? `编辑权限 — ${permRole.name}` : '编辑权限'}
        open={permDrawerOpen}
        onClose={() => {
          setPermDrawerOpen(false);
          setPermRole(null);
        }}
        width={520}
        extra={
          <Space>
            <Button onClick={() => { setPermDrawerOpen(false); setPermRole(null); }}>取消</Button>
            <Button type="primary" loading={permSaving} onClick={handleSavePermissions}>
              保存权限
            </Button>
          </Space>
        }
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          勾选允许的操作，未勾选的操作将被禁止。数据模型权限同时控制模型设计和数据记录的访问。
        </Typography.Text>
        {RESOURCES.map((resource) => (
          <div
            key={resource.key}
            style={{
              marginBottom: 12,
              padding: 12,
              background: '#fafafa',
              borderRadius: 6,
            }}
          >
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              {resource.label}
            </Typography.Text>
            <Checkbox.Group
              value={permSelections[resource.key] || []}
              onChange={(checkedValues) => {
                setPermSelections((prev) => ({
                  ...prev,
                  [resource.key]: checkedValues as PermissionAction[],
                }));
              }}
            >
              <Row>
                {ACTIONS.map((action) => (
                  <Col key={action.key} span={8} style={{ marginBottom: 4 }}>
                    <Checkbox value={action.key}>{action.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </div>
        ))}
      </Drawer>

      {/* Add Member Modal */}
      <Modal
        title="添加成员"
        open={addMemberOpen}
        onOk={handleAddMember}
        onCancel={() => setAddMemberOpen(false)}
        confirmLoading={addMemberSaving}
        okText="添加"
        cancelText="取消"
      >
        <Form form={addMemberForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="userId"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select
              showSearch
              placeholder="搜索并选择用户"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={allUsers.map((u) => ({
                value: u.id,
                label: `${u.username || u.email} (${u.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="roleIds"
            label="分配角色"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择角色（可多选）"
              options={roles.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

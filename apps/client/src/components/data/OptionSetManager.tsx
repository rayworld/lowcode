import { useEffect, useState } from 'react';
import {
  Modal, Table, Button, Space, Tag, Typography, Form, Input, Select,
  message, Popconfirm, Spin, Row, Col,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { optionSetService } from '../../services/option-set.service';

interface Props {
  appId: string;
  open: boolean;
  onClose: () => void;
}

export default function OptionSetManager({ appId, open, onClose }: Props) {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [optionItems, setOptionItems] = useState<{ label: string; value: string; color?: string }[]>([]);
  const [form] = Form.useForm();

  const fetchSets = async () => {
    setLoading(true);
    try {
      const res = await optionSetService.findAll(appId);
      setSets(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) fetchSets(); }, [open, appId]);

  const openEdit = (set?: any) => {
    setEditingSet(set || null);
    if (set) {
      form.setFieldsValue({ name: set.name, displayName: set.displayName, description: set.description });
      setOptionItems(set.options || []);
    } else {
      form.resetFields();
      setOptionItems([{ label: '', value: '' }]);
    }
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const data = { ...values, options: optionItems.filter((o) => o.label && o.value) };
    if (editingSet) {
      await optionSetService.update(appId, editingSet.id, data);
      message.success('选项集已更新');
    } else {
      await optionSetService.create(appId, data);
      message.success('选项集已创建');
    }
    setEditModalOpen(false);
    fetchSets();
  };

  const handleDelete = async (id: string) => {
    const res = await optionSetService.remove(appId, id);
    const msg = res.data.usageCount > 0 ? `已删除，被 ${res.data.usageCount} 个字段引用` : '已删除';
    message.success(msg);
    fetchSets();
  };

  const columns = [
    { title: '名称', dataIndex: 'displayName', key: 'displayName' },
    { title: '标识', dataIndex: 'name', key: 'name' },
    {
      title: '选项', key: 'options', ellipsis: true,
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          {(record.options || []).slice(0, 5).map((o: any) => (
            <Tag key={o.value} color={o.color || undefined}>{o.label}</Tag>
          ))}
          {(record.options || []).length > 5 && <Tag>+{(record.options || []).length - 5}</Tag>}
        </Space>
      ),
    },
    {
      title: '使用次数', key: '_count',
      render: (_: any, record: any) => record._count?.fields || 0,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal title="选项集管理" open={open} onCancel={onClose} footer={null} width={800}>
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新建选项集</Button>
        </div>
        <Table columns={columns} dataSource={sets} rowKey="id" loading={loading} pagination={false}
          locale={{ emptyText: '暂无选项集' }} />
      </Modal>

      <Modal
        title={editingSet ? '编辑选项集' : '新建选项集'}
        open={editModalOpen}
        onOk={handleSave}
        onCancel={() => setEditModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="标识" rules={[{ required: true }, { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/ }]}>
                <Input placeholder="如：status_options" disabled={!!editingSet} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayName" label="名称">
                <Input placeholder="如：状态选项" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>选项列表</Typography.Text>
          {optionItems.map((item, idx) => (
            <Row key={idx} gutter={8} style={{ marginBottom: 8 }} align="middle">
              <Col span={8}>
                <Input size="small" placeholder="标签" value={item.label}
                  onChange={(e) => {
                    const next = [...optionItems]; next[idx] = { ...next[idx], label: e.target.value };
                    if (e.target.value && !next[idx].value) next[idx].value = e.target.value;
                    setOptionItems(next);
                  }} />
              </Col>
              <Col span={6}>
                <Input size="small" placeholder="值" value={item.value}
                  onChange={(e) => {
                    const next = [...optionItems]; next[idx] = { ...next[idx], value: e.target.value };
                    setOptionItems(next);
                  }} />
              </Col>
              <Col span={6}>
                <Input size="small" placeholder="颜色 (可选)" value={item.color || ''}
                  onChange={(e) => {
                    const next = [...optionItems]; next[idx] = { ...next[idx], color: e.target.value };
                    setOptionItems(next);
                  }} />
              </Col>
              <Col span={2}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />}
                  onClick={() => setOptionItems(optionItems.filter((_, i) => i !== idx))} />
              </Col>
            </Row>
          ))}
          <Button size="small" icon={<PlusOutlined />} onClick={() => setOptionItems([...optionItems, { label: '', value: '' }])}>
            添加选项
          </Button>
        </Form>
      </Modal>
    </>
  );
}

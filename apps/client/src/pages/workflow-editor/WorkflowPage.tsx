import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Table, Tag, Modal, Form, Input, Select, message, Space, Popconfirm, Switch } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { workflowService } from '../../services/workflow.service';
import { WorkflowTriggerType } from '@lowcode/shared';

const TRIGGER_LABELS: Record<string, string> = {
  FORM_SUBMIT: '表单提交',
  DATA_CHANGE: '数据变更',
  SCHEDULE: '定时任务',
  WEBHOOK: 'Webhook',
  MANUAL: '手动触发',
};

export default function WorkflowPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchWorkflows = async () => {
    if (!appId) return;
    try {
      const res = await workflowService.findByApp(appId);
      setWorkflows(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkflows(); }, [appId]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await workflowService.create({ ...values, appId });
    message.success('工作流创建成功');
    setModalOpen(false);
    form.resetFields();
    fetchWorkflows();
  };

  const handleToggle = async (id: string) => {
    await workflowService.toggle(id);
    fetchWorkflows();
  };

  const handleExecute = async (id: string) => {
    await workflowService.execute(id);
    message.success('工作流已触发执行');
  };

  const handleDelete = async (id: string) => {
    await workflowService.remove(id);
    message.success('已删除');
    fetchWorkflows();
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', render: (t: string) => <Tag>{TRIGGER_LABELS[t] || t}</Tag> },
    {
      title: '步骤数', key: 'stepsCount',
      render: (_: any, record: any) => record.steps?.length || 0,
    },
    {
      title: '启用', dataIndex: 'enabled', key: 'enabled',
      render: (v: boolean, record: any) => <Switch checked={v} onChange={() => handleToggle(record.id)} />,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/apps/${appId}/workflows/${record.id}`)}>编辑</Button>
          <Button type="link" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record.id)}>执行</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
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
          <Typography.Title level={4} style={{ margin: 0 }}>工作流</Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>创建</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={workflows} rowKey="id" loading={loading} />
      </Card>

      <Modal title="创建工作流" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="工作流名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="triggerType" label="触发方式" rules={[{ required: true }]}>
            <Select>
              {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

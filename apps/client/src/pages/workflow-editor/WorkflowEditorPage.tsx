import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Card, Spin, message, Tag, Modal, Form, Input, Select } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { workflowService } from '../../services/workflow.service';

const STEP_TYPE_LABELS: Record<string, string> = {
  CONDITION: '条件判断',
  DATA_OPERATION: '数据操作',
  NOTIFICATION: '通知',
  API_CALL: 'API调用',
  DELAY: '延时',
  APPROVAL: '审批',
};

export default function WorkflowEditorPage() {
  const { appId, workflowId } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (workflowId) {
      workflowService.findById(workflowId).then((res) => setWorkflow(res.data)).finally(() => setLoading(false));
    }
  }, [workflowId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await workflowService.update(workflowId!, { name: workflow.name, description: workflow.description });
      message.success('保存成功');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    try {
      const values = await form.validateFields();
      const steps = [...(workflow.steps || [])];
      steps.push({
        ...values,
        order: steps.length,
        config: values.config ? JSON.parse(values.config) : {},
      });
      setWorkflow({ ...workflow, steps });
      setModalOpen(false);
      form.resetFields();
      message.success('步骤已添加');
    } catch {
      // validation error
    }
  };

  const handleExecute = async () => {
    const res = await workflowService.execute(workflowId!);
    message.success('工作流已加入执行队列');
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!workflow) return <Typography.Text type="danger">工作流不存在</Typography.Text>;

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/workflows`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>{workflow.name}</Typography.Title>
          <Tag>{workflow.triggerType}</Tag>
          <Tag color={workflow.enabled ? 'green' : 'default'}>{workflow.enabled ? '已启用' : '已禁用'}</Tag>
        </Space>
        <Space>
          <Button icon={<PlayCircleOutlined />} onClick={handleExecute}>执行</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存</Button>
        </Space>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form layout="vertical" style={{ maxWidth: 500 }}>
          <Form.Item label="名称">
            <Input value={workflow.name} onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })} />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea value={workflow.description || ''} onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })} rows={2} />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="工作流步骤"
        extra={<Button type="primary" onClick={() => setModalOpen(true)}>添加步骤</Button>}
      >
        {(!workflow.steps || workflow.steps.length === 0) ? (
          <div className="empty-state">
            <h3>暂无步骤</h3>
            <p>添加步骤来构建工作流逻辑</p>
          </div>
        ) : (
          workflow.steps.map((step: any, index: number) => (
            <Card
              key={step.id || index}
              size="small"
              style={{ marginBottom: 8 }}
              title={
                <Space>
                  <Tag color="blue">{index + 1}</Tag>
                  <Tag>{STEP_TYPE_LABELS[step.type] || step.type}</Tag>
                  {step.label && <span>{step.label}</span>}
                </Space>
              }
            >
              <pre style={{ fontSize: 12, margin: 0 }}>
                {JSON.stringify(step.config, null, 2)}
              </pre>
            </Card>
          ))
        )}
      </Card>

      <Modal title="添加步骤" open={modalOpen} onOk={handleAddStep} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="步骤类型" rules={[{ required: true }]}>
            <Select>
              {Object.entries(STEP_TYPE_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="label" label="步骤名称">
            <Input placeholder="如：创建订单" />
          </Form.Item>
          <Form.Item name="config" label="配置 (JSON)">
            <Input.TextArea rows={4} placeholder='{"operation": "createRecord", "entityId": "..."}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Spin, Popconfirm, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { appService } from '../../services/app.service';
import { Application, AppStatus } from '@lowcode/shared';

export default function AppSettingsPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (appId) {
      appService.findById(appId).then((res) => {
        setApp(res.data);
        form.setFieldsValue(res.data);
      }).finally(() => setLoading(false));
    }
  }, [appId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await appService.update(appId!, values);
      message.success('保存成功');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await appService.remove(appId!);
    message.success('应用已删除');
    navigate('/apps');
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!app) return <Typography.Text type="danger">应用不存在</Typography.Text>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}`)}>
          返回应用
        </Button>
      </div>
      <Card title="应用设置">
        <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
          <Form.Item name="name" label="应用名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="应用描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="DRAFT">草稿</Select.Option>
              <Select.Option value="PUBLISHED">已发布</Select.Option>
              <Select.Option value="ARCHIVED">已归档</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSave} loading={saving}>保存</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="危险操作" style={{ marginTop: 16 }}>
        <Popconfirm title="确定删除此应用？此操作不可恢复！" onConfirm={handleDelete}>
          <Button danger>删除此应用</Button>
        </Popconfirm>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, message, Spin, Select, Modal, Input, Form, Popconfirm } from 'antd';
import { SaveOutlined, UndoOutlined, RedoOutlined, EyeOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { pageService } from '../../services/page.service';
import { useDesignerStore } from '../../stores/designerStore';
import { ComponentNode } from '@lowcode/shared';
import ComponentList from '../../components/designer/ComponentList';
import Canvas from '../../components/designer/Canvas';
import PropertyPanel from '../../components/designer/PropertyPanel';

// Simple uuid generator that doesn't require a dependency
function generateId(): string {
  return 'node_' + Math.random().toString(36).substring(2, 11);
}

export default function PageDesignerPage() {
  const { appId, pageId } = useParams();
  const navigate = useNavigate();
  const { schema, selectedNodeId, setSchema, undo, redo } = useDesignerStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [pageTitle, setPageTitle] = useState('');

  // Create page modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    if (appId) {
      pageService.findByApp(appId).then((res) => setPages(res.data || []));
    }
    if (pageId) {
      pageService.findById(appId!, pageId).then((res) => {
        setPageTitle(res.data.title);
        if (res.data.schema) {
          setSchema(res.data.schema.root || res.data.schema);
        } else {
          setSchema({
            id: 'root',
            type: 'Page',
            props: { title: '新页面' },
            children: [],
          });
        }
      }).finally(() => setLoading(false));
    }
  }, [appId, pageId]);

  const handleSave = async () => {
    if (!pageId) return;
    setSaving(true);
    try {
      await pageService.update(appId!, pageId, {
        schema: { root: schema! },
      });
      message.success('保存成功');
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleCreatePage = async () => {
    const values = await createForm.validateFields();
    const route = '/' + values.title.toLowerCase().replace(/\s+/g, '-');
    const res = await pageService.create({ appId: appId!, title: values.title, route });
    message.success('页面创建成功');
    setCreateModalOpen(false);

    // Refresh page list
    const pagesRes = await pageService.findByApp(appId!);
    setPages(pagesRes.data || []);

    // Auto-navigate to new page
    navigate(`/apps/${appId}/pages/${res.data.id}/design`);
  };

  const handlePublish = async () => {
    if (!pageId) return;
    setPublishing(true);
    try {
      await pageService.publish(appId!, pageId);
      message.success('页面已发布');
    } catch {
      // handled by api interceptor
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!pageId || !appId) return;
    await pageService.remove(appId!, pageId);
    message.success('页面已删除');
    navigate(`/apps/${appId}`);
  };

  const handleSelectPage = (id: string) => {
    navigate(`/apps/${appId}/pages/${id}/design`);
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        height: 48, background: '#fff', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between',
      }}>
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}`)} />
          <Typography.Text strong>{pageTitle || '页面设计器'}</Typography.Text>
          <Select
            style={{ width: 180 }}
            placeholder="切换页面"
            value={pageId}
            onChange={handleSelectPage}
            options={pages.map((p: any) => ({ label: p.title, value: p.id }))}
          />
          <Button type="link" icon={<PlusOutlined />} onClick={handleAddPage}>新建页面</Button>
          {pageId && (
            <Popconfirm
              title="确定删除此页面？"
              description="删除后无法恢复"
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />} size="small">删除</Button>
            </Popconfirm>
          )}
        </Space>
        <Space>
          <Button icon={<UndoOutlined />} onClick={undo}>撤销</Button>
          <Button icon={<RedoOutlined />} onClick={redo}>重做</Button>
          <Button icon={<EyeOutlined />}>预览</Button>
          <Button onClick={handlePublish} loading={publishing}>
            发布
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
        </Space>
      </div>

      {/* Designer body */}
      <div className="designer-layout">
        <div className="designer-sidebar">
          <ComponentList />
        </div>
        <div className="designer-canvas">
          <div className="canvas-container">
            {schema ? <Canvas node={schema} /> : <div className="empty-state"><h3>选择一个页面或创建新页面开始设计</h3></div>}
          </div>
        </div>
        {selectedNodeId && (
          <div className="designer-property">
            <PropertyPanel />
          </div>
        )}
      </div>

      {/* Create page modal */}
      <Modal
        title="创建新页面"
        open={createModalOpen}
        onOk={handleCreatePage}
        onCancel={() => setCreateModalOpen(false)}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: '请输入页面标题' }]}
          >
            <Input placeholder="如：用户列表, 订单详情" />
          </Form.Item>
          <Typography.Text type="secondary">
            路由将自动生成: /
            {createForm.getFieldValue('title')
              ? createForm.getFieldValue('title').toLowerCase().replace(/\s+/g, '-')
              : 'page-name'}
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}

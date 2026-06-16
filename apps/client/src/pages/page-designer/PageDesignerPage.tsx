import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Space, message, Spin, Select, Modal, Input, Form } from 'antd';
import { SaveOutlined, UndoOutlined, RedoOutlined, EyeOutlined, ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
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
  const [pages, setPages] = useState<any[]>([]);
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (appId) {
      pageService.findByApp(appId).then((res) => setPages(res.data || []));
    }
    if (pageId) {
      pageService.findById(pageId).then((res) => {
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
      await pageService.update(pageId, {
        schema: { root: schema! },
      });
      message.success('保存成功');
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = async () => {
    if (!appId) return;
    const title = prompt('输入页面标题：');
    if (!title) return;
    const route = '/' + title.toLowerCase().replace(/\s+/g, '-');
    await pageService.create({ appId, title, route });
    message.success('页面创建成功');
    const res = await pageService.findByApp(appId);
    setPages(res.data || []);
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
        </Space>
        <Space>
          <Button icon={<UndoOutlined />} onClick={undo}>撤销</Button>
          <Button icon={<RedoOutlined />} onClick={redo}>重做</Button>
          <Button icon={<EyeOutlined />}>预览</Button>
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
    </div>
  );
}

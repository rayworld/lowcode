import { useDesignerStore } from '../../stores/designerStore';
import { ComponentNode } from '@lowcode/shared';
import { Button, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const BUILTIN_COMPONENTS: Record<string, { title: string; render: (node: ComponentNode) => React.ReactNode }> = {
  Page: {
    title: '页面',
    render: (node) => <PageRenderer node={node} />,
  },
  Row: {
    title: '行布局',
    render: (node) => (
      <div style={{ display: 'flex', gap: (node.props.gap as number) || 16, padding: 8, minHeight: 40 }}>
        {node.children?.map((child) => <Canvas key={child.id} node={child} />)}
        {(!node.children || node.children.length === 0) && (
          <div style={{ width: '100%', textAlign: 'center', color: '#ccc', fontSize: 12, padding: 8, border: '1px dashed #d9d9d9', borderRadius: 4 }}>
            拖拽组件到行内
          </div>
        )}
      </div>
    ),
  },
  Column: {
    title: '列布局',
    render: (node) => (
      <div style={{ flex: (node.props.span as number) || 1, padding: 4, minHeight: 40 }}>
        {node.children?.map((child) => <Canvas key={child.id} node={child} />)}
        {(!node.children || node.children.length === 0) && (
          <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12, padding: 4, border: '1px dashed #d9d9d9', borderRadius: 4 }}>
            拖拽组件
          </div>
        )}
      </div>
    ),
  },
  Card: {
    title: '卡片',
    render: (node) => (
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff' }}>
        {!!(node.props.title) && <Typography.Title level={5}>{node.props.title as string}</Typography.Title>}
        {node.children?.map((child) => <Canvas key={child.id} node={child} />)}
      </div>
    ),
  },
  Button: {
    title: '按钮',
    render: (node) => (
      <Button type={(node.props.type as any) || 'default'} style={{ margin: 4 }}>
        {(node.props.text as string) || '按钮'}
      </Button>
    ),
  },
  Text: {
    title: '文本',
    render: (node) => {
      const content = (node.props.content as string) || '文本内容';
      switch (node.props.type) {
        case 'h1': return <Typography.Title level={2}>{content}</Typography.Title>;
        case 'h2': return <Typography.Title level={3}>{content}</Typography.Title>;
        default: return <Typography.Text>{content}</Typography.Text>;
      }
    },
  },
  Input: {
    title: '输入框',
    render: (node) => (
      <div style={{ margin: '4px 0' }}>
        {!!(node.props.label) && <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{node.props.label as string}</label>}
        <input
          placeholder={(node.props.placeholder as string) || '请输入'}
          style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6, outline: 'none' }}
        />
      </div>
    ),
  },
  Divider: {
    title: '分割线',
    render: (node) => (
      <div style={{ borderTop: '1px solid #f0f0f0', margin: '16px 0', textAlign: 'center' }}>
        {!!(node.props.text) && <span style={{ position: 'relative', top: -10, background: '#fff', padding: '0 10px', color: '#999', fontSize: 12 }}>{node.props.text as string}</span>}
      </div>
    ),
  },
};

function PageRenderer({ node }: { node: ComponentNode }) {
  return (
    <div style={{ padding: 16, minHeight: 400 }}>
      {node.children?.map((child) => <Canvas key={child.id} node={child} />)}
      {(!node.children || node.children.length === 0) && (
        <div className="empty-state" style={{ border: '2px dashed #d9d9d9', borderRadius: 8 }}>
          <h3>从左侧拖拽组件到此处</h3>
        </div>
      )}
    </div>
  );
}

interface CanvasProps {
  node: ComponentNode;
}

export default function Canvas({ node }: CanvasProps) {
  const { selectedNodeId, selectNode, removeNode } = useDesignerStore();
  const isSelected = selectedNodeId === node.id;
  const component = BUILTIN_COMPONENTS[node.type];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newNode: ComponentNode = {
        id: 'node_' + Math.random().toString(36).substring(2, 9),
        type: data.name || data.type,
        props: data.defaultProps || {},
        children: [],
      };
      useDesignerStore.getState().addChild(node.id, newNode);
    } catch {
      // Invalid drop data
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const content = component ? component.render(node) : (
    <div style={{ padding: 8, color: '#999', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
      ⚠️ 未知组件: {node.type}
    </div>
  );

  return (
    <div
      className={`canvas-node ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {isSelected && node.id !== 'root' && (
        <Button
          type="text"
          size="small"
          danger
          className="remove-btn"
          icon={<CloseOutlined />}
          onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
        />
      )}
      {content}
    </div>
  );
}

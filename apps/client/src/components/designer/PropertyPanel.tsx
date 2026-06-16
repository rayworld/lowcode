import { useDesignerStore } from '../../stores/designerStore';
import { Form, Input, InputNumber, Switch, Select, Typography, Divider } from 'antd';

export default function PropertyPanel() {
  const { schema, selectedNodeId, updateNodeProps } = useDesignerStore();

  const findNode = (node: typeof schema, id: string): typeof schema => {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.children || []) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  const selectedNode = findNode(schema, selectedNodeId || '');
  if (!selectedNode) return null;

  const handlePropChange = (name: string, value: unknown) => {
    updateNodeProps(selectedNode.id, { [name]: value });
  };

  const renderPropInput = (prop: { name: string; label: string; type: string; defaultValue?: unknown; options?: { label: string; value: unknown }[] }) => {
    const value = selectedNode.props[prop.name] ?? prop.defaultValue;
    switch (prop.type) {
      case 'string':
        return <Input value={value as string} onChange={(e) => handlePropChange(prop.name, e.target.value)} />;
      case 'number':
        return <InputNumber value={value as number} onChange={(v) => handlePropChange(prop.name, v)} style={{ width: '100%' }} />;
      case 'boolean':
        return <Switch checked={value as boolean} onChange={(v) => handlePropChange(prop.name, v)} />;
      case 'select':
        return (
          <Select value={value} onChange={(v) => handlePropChange(prop.name, v)} style={{ width: '100%' }}>
            {prop.options?.map((opt) => (
              <Select.Option key={String(opt.value)} value={opt.value}>{opt.label}</Select.Option>
            ))}
          </Select>
        );
      case 'json':
        return (
          <Input.TextArea
            rows={4}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                handlePropChange(prop.name, JSON.parse(e.target.value));
              } catch {
                handlePropChange(prop.name, e.target.value);
              }
            }}
          />
        );
      default:
        return <Input value={String(value ?? '')} onChange={(e) => handlePropChange(prop.name, e.target.value)} />;
    }
  };

  // Get component prop definitions (simplified - using built-in knowledge)
  const getPropDefs = (type: string) => {
    const defs: Record<string, { name: string; label: string; type: string; defaultValue?: unknown; options?: { label: string; value: unknown }[] }[]> = {
      Page: [{ name: 'title', label: '页面标题', type: 'string' }],
      Row: [{ name: 'gap', label: '间距(px)', type: 'number', defaultValue: 16 }],
      Column: [{ name: 'span', label: '宽度比例', type: 'number', defaultValue: 1 }],
      Card: [{ name: 'title', label: '卡片标题', type: 'string' }],
      Button: [
        { name: 'text', label: '按钮文字', type: 'string', defaultValue: '按钮' },
        { name: 'type', label: '按钮类型', type: 'select', defaultValue: 'default', options: [{ label: '默认', value: 'default' }, { label: '主要', value: 'primary' }, { label: '危险', value: 'danger' }] },
      ],
      Text: [
        { name: 'content', label: '文本内容', type: 'string' },
        { name: 'type', label: '文本类型', type: 'select', defaultValue: 'body', options: [{ label: '标题1', value: 'h1' }, { label: '标题2', value: 'h2' }, { label: '正文', value: 'body' }] },
      ],
      Input: [
        { name: 'label', label: '标签', type: 'string' },
        { name: 'placeholder', label: '占位文字', type: 'string' },
      ],
      Divider: [{ name: 'text', label: '分割线文字', type: 'string' }],
    };
    return defs[type] || [];
  };

  const propDefs = getPropDefs(selectedNode.type);

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={5}>属性配置</Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>组件类型: {selectedNode.type}</Typography.Text>
      <Divider />
      <Form layout="vertical" size="small">
        {propDefs.map((prop) => (
          <Form.Item key={prop.name} label={prop.label}>
            {renderPropInput(prop)}
          </Form.Item>
        ))}
        {propDefs.length === 0 && (
          <Typography.Text type="secondary">此组件没有可配置属性</Typography.Text>
        )}
      </Form>
    </div>
  );
}

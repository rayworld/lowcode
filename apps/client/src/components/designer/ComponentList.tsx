import { useEffect, useState } from 'react';
import { Typography, Collapse, Tag } from 'antd';
import { componentService } from '../../services/component.service';
import { useDesignerStore } from '../../stores/designerStore';
import { ComponentDefinition, ComponentNode } from '@lowcode/shared';

const CATEGORY_LABELS: Record<string, string> = {
  LAYOUT: '布局组件',
  FORM: '表单组件',
  DISPLAY: '展示组件',
  DATA: '数据组件',
};

export default function ComponentList() {
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const { addChild, schema } = useDesignerStore();

  useEffect(() => {
    componentService.findAll().then((res) => setComponents(res.data || []));
  }, []);

  const grouped = components.reduce<Record<string, ComponentDefinition[]>>((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {});

  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const items = Object.entries(grouped).map(([category, comps]) => ({
    key: category,
    label: CATEGORY_LABELS[category] || category,
    children: comps.map((comp) => (
      <div
        key={comp.id}
        className="component-item"
        draggable
        onDragStart={(e) => handleDragStart(e, comp)}
      >
        <span style={{ marginRight: 8 }}>{comp.icon || '📦'}</span>
        {comp.title}
      </div>
    )),
  }));

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 12 }}>组件库</Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        拖拽组件到画布
      </Typography.Text>
      <Collapse items={items} defaultActiveKey={Object.keys(grouped)} size="small" />
    </div>
  );
}

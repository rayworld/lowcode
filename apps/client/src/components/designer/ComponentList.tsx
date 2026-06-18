import { useEffect, useState } from 'react';
import { Typography, Tag } from 'antd';
import {
  LayoutOutlined,
  MenuOutlined,
  ColumnWidthOutlined,
  CreditCardOutlined,
  TableOutlined,
  FormOutlined,
  EditOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  SwapOutlined,
  BorderOutlined,
  FontSizeOutlined,
  PictureOutlined,
  MinusOutlined,
  AppstoreOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { componentService } from '../../services/component.service';
import { ComponentDefinition } from '@lowcode/shared';

const ICON_MAP: Record<string, React.ReactNode> = {
  Layout: <LayoutOutlined />,
  RowHorizontal: <MenuOutlined />,
  ColumnHorizontal: <ColumnWidthOutlined />,
  Card: <CreditCardOutlined />,
  Tab: <AppstoreOutlined />,
  Form: <FormOutlined />,
  Input: <EditOutlined />,
  TextArea: <UnorderedListOutlined />,
  Select: <CheckSquareOutlined />,
  Date: <CalendarOutlined />,
  Switch: <SwapOutlined />,
  Button: <BorderOutlined />,
  Text: <FontSizeOutlined />,
  Image: <PictureOutlined />,
  Divider: <MinusOutlined />,
  Table: <TableOutlined />,
  List: <UnorderedListOutlined />,
};

const CATEGORY_LABELS: Record<string, string> = {
  LAYOUT: '布局组件',
  FORM: '表单组件',
  DISPLAY: '展示组件',
  DATA: '数据组件',
};

export default function ComponentList() {
  const [components, setComponents] = useState<ComponentDefinition[]>([]);

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

  return (
    <div style={{ padding: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        拖拽组件到画布
      </Typography.Text>
      {Object.entries(grouped).map(([category, comps]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <Tag style={{ marginBottom: 8, fontSize: 11 }}>{CATEGORY_LABELS[category] || category}</Tag>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {comps.map((comp) => (
              <div
                key={comp.id}
                className="component-item"
                draggable
                onDragStart={(e) => handleDragStart(e, comp)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '10px 4px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: 6,
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  fontSize: 12,
                  background: '#fafafa',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#1677ff';
                  (e.currentTarget as HTMLElement).style.color = '#1677ff';
                  (e.currentTarget as HTMLElement).style.background = '#f0f5ff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#d9d9d9';
                  (e.currentTarget as HTMLElement).style.color = '';
                  (e.currentTarget as HTMLElement).style.background = '#fafafa';
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>
                  {ICON_MAP[comp.icon] || <CodeOutlined />}
                </span>
                <span style={{ lineHeight: 1.2 }}>{comp.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {components.length === 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>暂无可用组件</Typography.Text>
      )}
    </div>
  );
}

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Input, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// ── 字段显示数据 ──
export interface FieldDisplayData {
  id: string;
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  isRelation: boolean;
  relationType?: string;
}

// ── 节点数据 ──
export interface EntityNodeData extends Record<string, unknown> {
  label: string;
  name: string;
  entityId: string;
  appId?: string;
  color?: string;
  borderColor?: string;
  fields: FieldDisplayData[];
  onEntityClick?: (entityId: string) => void;
  onFieldEdit?: (fieldId: string, fieldName: string, newDisplayName: string) => Promise<void>;
  onFieldCreate?: (entityId: string) => void;
}

export type EntityNodeType = Node<EntityNodeData, 'entityNode'>;

function EntityNode({ data }: NodeProps<EntityNodeType>) {
  const { label, name, fields, onEntityClick, entityId, color, borderColor, onFieldEdit, onFieldCreate } = data;
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const bgColor = color || '#1677ff';
  const bdColor = borderColor || '#1677ff';

  // ── 行内编辑 ──
  const startEdit = useCallback((fieldId: string, currentName: string) => {
    setEditingField(fieldId);
    setEditValue(currentName);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingField || !onFieldEdit) { setEditingField(null); return; }
    const field = fields.find((f) => f.id === editingField);
    if (!field || editValue === field.displayName) { setEditingField(null); return; }
    try { await onFieldEdit(editingField, field.name, editValue); }
    catch { /* handled by caller */ }
    setEditingField(null);
  }, [editingField, editValue, fields, onFieldEdit]);

  const cancelEdit = useCallback(() => { setEditingField(null); }, []);

  // ── 关联类型标签 ──
  const relationLabel = (rt?: string) => {
    if (rt === 'ONE_TO_ONE') return '1:1';
    if (rt === 'MANY_TO_MANY') return 'M:N';
    return '1:N';
  };

  // ── 字段行 ──
  const renderFieldRow = (field: FieldDisplayData, showBorder = true) => (
    <div
      key={field.id}
      className="erd-field-row"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 12px',
        borderBottom: showBorder ? '1px solid #f0f0f0' : 'none',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 12 }}>
        {field.displayName || field.name}
        {field.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
      </span>

      {field.isRelation ? (
        <span style={{
          fontSize: 10, color: bgColor, background: `${bgColor}12`,
          padding: '1px 6px', borderRadius: 4, fontWeight: 500,
        }}>
          {relationLabel(field.relationType)}
        </span>
      ) : (
        <span style={{
          fontSize: 10, color: '#8c8c8c', background: '#f5f5f5',
          padding: '1px 6px', borderRadius: 4,
        }}>
          {field.type}
        </span>
      )}

      {/* 关联字段的 Handles */}
      {field.isRelation && (
        <>
          <Handle type="target" position={Position.Left} id={`field-${field.name}`}
            style={{ background: bgColor, width: 8, height: 8, border: '2px solid #fff', opacity: 0.6 }} />
          <Handle type="source" position={Position.Right} id={`field-${field.name}`}
            style={{ background: bgColor, width: 8, height: 8, border: '2px solid #fff' }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.4)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }} />
        </>
      )}
    </div>
  );

  // ── 拆分为关联字段和普通字段 ──
  const relationFields = fields.filter((f) => f.isRelation);
  const normalFields = fields.filter((f) => !f.isRelation);

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${bdColor}99`,
        borderRadius: 8,
        minWidth: 220,
        maxWidth: 280,
        boxShadow: `0 2px 8px ${bgColor}15`,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 13,
      }}
    >
      {/* ── Header（点击进入字段编辑） ── */}
      <div
        onClick={() => onEntityClick?.(entityId)}
        style={{
          background: bgColor, color: '#fff', padding: '8px 12px',
          borderRadius: '7px 7px 0 0', cursor: 'pointer',
          fontWeight: 600, fontSize: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{name}</span>
      </div>

      {/* ── 字段列表 ── */}
      <div style={{ padding: '4px 0' }}>
        {/* 关联字段：始终显示 */}
        {relationFields.map((f, _, arr) => renderFieldRow(f, true))}

        {/* 分隔线 */}
        {relationFields.length > 0 && normalFields.length > 0 && (
          <div style={{ borderTop: '1px solid #e8e8e8', margin: '2px 0' }} />
        )}

        {/* 普通字段 */}
        {normalFields.length === 0 && expanded ? (
          <div style={{ borderTop: '1px dashed #d9d9d9', padding: '4px 12px' }}>
            <Button type="link" size="small" icon={<PlusOutlined />}
              onClick={(e) => { e.stopPropagation(); onFieldCreate?.(entityId); }}
              style={{ fontSize: 12, color: bgColor, padding: 0, height: 28 }}>
              新建字段
            </Button>
          </div>
        ) : expanded ? (
          <>
            {normalFields.map((f, idx) => (
              <div key={f.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px 12px',
                  borderBottom: idx < normalFields.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
                onDoubleClick={() => { if (onFieldEdit) startEdit(f.id, f.displayName); }}>
                <span style={{ fontSize: 12 }}>
                  {editingField === f.id ? (
                    <Input size="small" value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onPressEnter={saveEdit} onBlur={saveEdit}
                      onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      autoFocus style={{ width: 120, height: 22, fontSize: 12 }}
                      onClick={(e) => e.stopPropagation()} />
                  ) : (
                    <>{f.displayName || f.name}
                      {f.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
                    </>
                  )}
                </span>
                <span style={{
                  fontSize: 10, color: '#8c8c8c', background: '#f5f5f5',
                  padding: '1px 6px', borderRadius: 4,
                }}>
                  {f.type}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #d9d9d9', padding: '4px 12px' }}>
              <Button type="link" size="small" icon={<PlusOutlined />}
                onClick={(e) => { e.stopPropagation(); onFieldCreate?.(entityId); }}
                style={{ fontSize: 12, color: bgColor, padding: 0, height: 28 }}>
                新建字段
              </Button>
            </div>
            <div onClick={() => setExpanded(false)}
              style={{
                padding: '4px 12px 6px', textAlign: 'center', cursor: 'pointer',
                fontSize: 12, color: bgColor, userSelect: 'none',
              }}>
              收起字段
            </div>
          </>
        ) : normalFields.length > 0 ? (
          <div onClick={() => setExpanded(true)}
            style={{
              padding: '6px 12px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', cursor: 'pointer', fontSize: 12,
              color: '#8c8c8c', userSelect: 'none',
            }}>
            <span>{normalFields.length} 个字段</span>
            <span style={{ color: bgColor }}>展开 ▸</span>
          </div>
        ) : null}
      </div>

      {/* ── 顶端 Handle（供其他实体连线到本实体整体） ── */}
      <Handle type="target" position={Position.Top} id="entity-target"
        style={{ background: bgColor, width: 8, height: 8, border: '2px solid #fff' }} />
    </div>
  );
}

export default memo(EntityNode);

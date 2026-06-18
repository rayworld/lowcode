import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Input } from 'antd';

export interface EntityNodeData extends Record<string, unknown> {
  label: string;
  name: string;
  entityId: string;
  appId?: string;
  color?: string;
  borderColor?: string;
  fields: {
    id: string;
    name: string;
    displayName: string;
    type: string;
    required: boolean;
    isRelation: boolean;
    relationType?: string;
  }[];
  onEntityClick?: (entityId: string) => void;
  onFieldEdit?: (fieldId: string, fieldName: string, newDisplayName: string) => Promise<void>;
}

export type EntityNodeType = Node<EntityNodeData, 'entityNode'>;

const MAX_VISIBLE_FIELDS = 8;

function EntityNode({ data }: NodeProps<EntityNodeType>) {
  const { label, name, fields, onEntityClick, entityId, color, borderColor, onFieldEdit } = data;
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const bgColor = color || '#1677ff';
  const bdColor = borderColor || '#1677ff';

  const showExpand = fields.length > MAX_VISIBLE_FIELDS;
  const visibleFields = expanded ? fields : fields.slice(0, MAX_VISIBLE_FIELDS);
  const hasMore = fields.length > MAX_VISIBLE_FIELDS;

  const startEdit = useCallback((fieldId: string, currentName: string) => {
    setEditingField(fieldId);
    setEditValue(currentName);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingField || !onFieldEdit) {
      setEditingField(null);
      return;
    }
    const field = fields.find((f) => f.id === editingField);
    if (!field || editValue === field.displayName) {
      setEditingField(null);
      return;
    }
    try {
      await onFieldEdit(editingField, field.name, editValue);
    } catch {
      // Error handled by caller
    }
    setEditingField(null);
  }, [editingField, editValue, fields, onFieldEdit]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
  }, []);

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
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${bgColor}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${bgColor}15`;
      }}
    >
      {/* Header */}
      <div
        onClick={() => onEntityClick?.(entityId)}
        style={{
          background: bgColor,
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '7px 7px 0 0',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{name}</span>
      </div>

      {/* Fields */}
      <div style={{ padding: '4px 0' }}>
        {visibleFields.map((field, idx) => (
          <div
            key={field.id}
            className="erd-field-row"
            data-field-type={field.type}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 12px',
              borderBottom: idx < visibleFields.length - 1 ? '1px solid #f0f0f0' : 'none',
              position: 'relative',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (field.isRelation) (e.currentTarget as HTMLElement).style.background = `${bgColor}08`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
            onDoubleClick={() => {
              if (!field.isRelation && onFieldEdit) startEdit(field.id, field.displayName);
            }}
          >
            <span style={{ fontSize: 12 }}>
              {editingField === field.id ? (
                <Input
                  size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onPressEnter={saveEdit}
                  onBlur={saveEdit}
                  onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                  style={{ width: 120, height: 22, fontSize: 12 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  {field.displayName || field.name}
                  {field.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
                </>
              )}
            </span>
            <span
              style={{
                fontSize: 10,
                color: field.isRelation ? bgColor : '#8c8c8c',
                background: field.isRelation ? `${bgColor}12` : '#f5f5f5',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: field.isRelation ? 500 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {field.isRelation
                ? field.relationType === 'ONE_TO_ONE'
                  ? '1:1'
                  : field.relationType === 'MANY_TO_MANY'
                    ? 'M:N'
                    : '1:N'
                : field.type}
            </span>

            {field.isRelation && (
              <Handle
                type="source"
                position={Position.Right}
                id={`field-${field.name}`}
                style={{
                  background: bgColor,
                  width: 8,
                  height: 8,
                  border: '2px solid #fff',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.4)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
              />
            )}
          </div>
        ))}

        {/* Expand/collapse toggle */}
        {showExpand && (
          <div
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '6px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 12,
              color: bgColor,
              borderTop: '1px solid #f0f0f0',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${bgColor}06`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {expanded ? `收起 (${fields.length} 字段)` : `展开全部 ${fields.length} 个字段`}
          </div>
        )}

        {/* Show count badge when collapsed */}
        {!expanded && hasMore && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 10,
              color: '#999',
              padding: '2px 0 4px',
            }}
          >
            +{fields.length - MAX_VISIBLE_FIELDS} 个字段
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="entity-target"
        style={{
          background: bgColor,
          width: 8,
          height: 8,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
}

export default memo(EntityNode);

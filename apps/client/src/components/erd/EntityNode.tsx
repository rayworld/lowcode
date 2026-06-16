import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

export interface EntityNodeData extends Record<string, unknown> {
  label: string;
  name: string;
  entityId: string;
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
}

export type EntityNodeType = Node<EntityNodeData, 'entityNode'>;

function EntityNode({ data }: NodeProps<EntityNodeType>) {
  const { label, name, fields, onEntityClick, entityId } = data;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        minWidth: 220,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 13,
      }}
    >
      <div
        onClick={() => onEntityClick?.(entityId)}
        style={{
          background: '#1677ff',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '7px 7px 0 0',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{name}</span>
      </div>

      <div style={{ padding: '4px 0' }}>
        {fields.map((field) => (
          <div
            key={field.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 12px',
              borderBottom: '1px solid #f0f0f0',
              position: 'relative',
            }}
          >
            <span>
              {field.displayName || field.name}
              {field.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
            </span>
            <span
              style={{
                fontSize: 11,
                color: field.isRelation ? '#1677ff' : '#8c8c8c',
                background: field.isRelation ? '#e6f4ff' : '#f5f5f5',
                padding: '0 6px',
                borderRadius: 4,
                fontWeight: field.isRelation ? 500 : 400,
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
                style={{ background: '#1677ff', width: 8, height: 8, border: '2px solid #fff' }}
              />
            )}
          </div>
        ))}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="entity-target"
        style={{ background: '#1677ff', width: 8, height: 8, border: '2px solid #fff' }}
      />
    </div>
  );
}

export default memo(EntityNode);

import { useState } from 'react';
import { Button, Select, Input, InputNumber, Space, Tag, Typography, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined, BranchesOutlined } from '@ant-design/icons';

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

interface QueryBuilderProps {
  fields: { name: string; displayName: string; type: string }[];
  value: string; // JSON string of ConditionGroup
  onChange: (json: string) => void;
}

const OPERATORS: Record<string, { value: string; label: string; types: string[] }[]> = {
  string: [
    { value: 'eq', label: '等于', types: ['STRING', 'TEXT', 'EMAIL', 'PHONE', 'URL', 'COLOR', 'SELECT'] },
    { value: 'neq', label: '不等于', types: ['STRING', 'TEXT', 'EMAIL', 'PHONE', 'URL', 'COLOR', 'SELECT'] },
    { value: 'contains', label: '包含', types: ['STRING', 'TEXT', 'EMAIL', 'URL'] },
    { value: 'startsWith', label: '开头是', types: ['STRING', 'TEXT'] },
    { value: 'endsWith', label: '结尾是', types: ['STRING', 'TEXT'] },
  ],
  number: [
    { value: 'eq', label: '等于', types: ['NUMBER', 'CURRENCY', 'RATING'] },
    { value: 'neq', label: '不等于', types: ['NUMBER', 'CURRENCY', 'RATING'] },
    { value: 'gt', label: '大于', types: ['NUMBER', 'CURRENCY', 'RATING'] },
    { value: 'gte', label: '大于等于', types: ['NUMBER', 'CURRENCY', 'RATING'] },
    { value: 'lt', label: '小于', types: ['NUMBER', 'CURRENCY', 'RATING'] },
    { value: 'lte', label: '小于等于', types: ['NUMBER', 'CURRENCY', 'RATING'] },
  ],
  date: [
    { value: 'eq', label: '等于', types: ['DATE', 'DATETIME'] },
    { value: 'gt', label: '晚于', types: ['DATE', 'DATETIME'] },
    { value: 'lt', label: '早于', types: ['DATE', 'DATETIME'] },
  ],
  boolean: [
    { value: 'eq', label: '是', types: ['BOOLEAN'] },
  ],
  relation: [
    { value: 'eq', label: '等于', types: ['RELATION'] },
    { value: 'isNull', label: '为空', types: ['RELATION'] },
    { value: 'isNotNull', label: '不为空', types: ['RELATION'] },
  ],
};

function getFieldCategory(type: string): string {
  if (['STRING', 'TEXT', 'EMAIL', 'PHONE', 'URL', 'COLOR', 'SELECT', 'MULTI_SELECT'].includes(type)) return 'string';
  if (['NUMBER', 'CURRENCY', 'RATING'].includes(type)) return 'number';
  if (['DATE', 'DATETIME'].includes(type)) return 'date';
  if (['BOOLEAN'].includes(type)) return 'boolean';
  if (['RELATION'].includes(type)) return 'relation';
  return 'string';
}

function getOperatorsForField(type: string) {
  const cat = getFieldCategory(type);
  return OPERATORS[cat] || OPERATORS.string;
}

function emptyGroup(): ConditionGroup {
  return { logic: 'AND', conditions: [{ field: '', operator: 'eq', value: '' }] };
}

function SingleConditionRow({
  condition,
  fields,
  onChange,
  onDelete,
  index,
}: {
  condition: Condition;
  fields: { name: string; displayName: string; type: string }[];
  onChange: (c: Condition) => void;
  onDelete: () => void;
  index: number;
}) {
  const selectedField = fields.find((f) => f.name === condition.field);
  const operators = selectedField ? getOperatorsForField(selectedField.type) : OPERATORS.string;
  const isNumber = selectedField && ['NUMBER', 'CURRENCY', 'RATING'].includes(selectedField.type);
  const isBool = selectedField && ['BOOLEAN'].includes(selectedField.type);
  const hasNoValue = ['isNull', 'isNotNull'].includes(condition.operator);

  return (
    <Row gutter={[8, 8]} align="middle" style={{ marginBottom: 4 }}>
      <Col flex="160px">
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="选择字段"
          value={condition.field || undefined}
          onChange={(v) => onChange({ ...condition, field: v, value: '' })}
        >
          {fields.map((f) => (
            <Select.Option key={f.name} value={f.name}>{f.displayName}</Select.Option>
          ))}
        </Select>
      </Col>
      <Col flex="120px">
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="条件"
          value={condition.operator}
          onChange={(v) => onChange({ ...condition, operator: v })}
        >
          {operators.map((op) => (
            <Select.Option key={op.value} value={op.value}>{op.label}</Select.Option>
          ))}
        </Select>
      </Col>
      <Col flex="auto">
        {hasNoValue ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
        ) : isBool ? (
          <Select size="small" style={{ width: '100%' }} value={condition.value} onChange={(v) => onChange({ ...condition, value: v })}>
            <Select.Option value="true">是</Select.Option>
            <Select.Option value="false">否</Select.Option>
          </Select>
        ) : isNumber ? (
          <InputNumber size="small" style={{ width: '100%' }} value={Number(condition.value) || undefined}
            onChange={(v) => onChange({ ...condition, value: String(v ?? '') })} />
        ) : (
          <Input size="small" placeholder="值" value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })} />
        )}
      </Col>
      <Col flex="24px">
        <Button type="text" size="small" danger icon={<MinusCircleOutlined />} onClick={onDelete} />
      </Col>
    </Row>
  );
}

function GroupView({
  group,
  fields,
  onChange,
  depth,
}: {
  group: ConditionGroup;
  fields: { name: string; displayName: string; type: string }[];
  onChange: (g: ConditionGroup) => void;
  depth: number;
}) {
  const addCondition = () => {
    onChange({
      ...group,
      conditions: [...group.conditions, { field: fields[0]?.name || '', operator: 'eq', value: '' }],
    });
  };

  const addSubGroup = () => {
    onChange({
      ...group,
      conditions: [...group.conditions, emptyGroup()],
    });
  };

  const toggleLogic = () => {
    onChange({
      ...group,
      logic: group.logic === 'AND' ? 'OR' : 'AND',
    });
  };

  const updateCondition = (index: number, condition: Condition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = condition;
    onChange({ ...group, conditions: newConditions });
  };

  const removeItem = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({ ...group, conditions: newConditions.length > 0 ? newConditions : [{ field: fields[0]?.name || '', operator: 'eq', value: '' }] });
  };

  const updateSubGroup = (index: number, subGroup: ConditionGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = subGroup;
    onChange({ ...group, conditions: newConditions });
  };

  return (
    <div style={{
      border: '1px solid #d9d9d9',
      borderRadius: 6,
      padding: 8,
      marginBottom: 4,
      background: depth > 0 ? '#fafafa' : '#fff',
    }}>
      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button size="small" onClick={toggleLogic} type={group.logic === 'AND' ? 'primary' : 'default'}>
          {group.logic === 'AND' ? '并且 (AND)' : '或者 (OR)'}
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>全部条件</Typography.Text>
        <div style={{ flex: 1 }} />
        <Tooltip title="添加条件">
          <Button size="small" icon={<PlusOutlined />} onClick={addCondition}>条件</Button>
        </Tooltip>
        <Tooltip title="添加条件组">
          <Button size="small" icon={<BranchesOutlined />} onClick={addSubGroup}>分组</Button>
        </Tooltip>
      </div>

      {group.conditions.map((item, idx) => (
        'field' in item ? (
          <SingleConditionRow
            key={idx}
            index={idx}
            condition={item as Condition}
            fields={fields}
            onChange={(c) => updateCondition(idx, c)}
            onDelete={() => removeItem(idx)}
          />
        ) : (
          <div key={idx} style={{ position: 'relative', marginLeft: depth > 0 ? 0 : 12 }}>
            <Button
              type="text"
              size="small"
              danger
              icon={<MinusCircleOutlined />}
              onClick={() => removeItem(idx)}
              style={{ position: 'absolute', right: -4, top: 4, zIndex: 1 }}
            />
            <GroupView
              group={item as ConditionGroup}
              fields={fields}
              onChange={(g) => updateSubGroup(idx, g)}
              depth={depth + 1}
            />
          </div>
        )
      ))}
    </div>
  );
}

export default function QueryBuilder({ fields, value, onChange }: QueryBuilderProps) {
  let group: ConditionGroup;
  try {
    group = value ? JSON.parse(value) : emptyGroup();
  } catch {
    group = emptyGroup();
  }
  if (!group.logic) group = emptyGroup();

  // Filter out relation fields for simpler query building
  const queryFields = fields.filter((f) => f.type !== 'RELATION');

  return (
    <div style={{ maxHeight: 400, overflow: 'auto' }}>
      <GroupView group={group} fields={queryFields} onChange={(g) => onChange(JSON.stringify(g))} depth={0} />
    </div>
  );
}

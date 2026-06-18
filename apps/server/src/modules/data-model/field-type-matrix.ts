/**
 * Field type conversion compatibility matrix.
 * Defines which type conversions are allowed and how to transform existing data.
 */
export interface TypeConversion {
  allowed: boolean;
  description?: string;
  transform?: (value: unknown) => unknown;
}

const TYPE_MATRIX: Record<string, Record<string, TypeConversion>> = {
  STRING: {
    TEXT: { allowed: true, description: '单行文本 → 多行文本' },
    EMAIL: { allowed: true, description: '单行文本 → 邮箱（需验证格式）' },
    URL: { allowed: true, description: '单行文本 → 链接' },
    PHONE: { allowed: true, description: '单行文本 → 电话' },
    COLOR: { allowed: true, description: '单行文本 → 颜色' },
    NUMBER: { allowed: true, description: '文本 → 数字（非数字值将被清空）', transform: (v) => { const n = Number(v); return isNaN(n) ? null : n; } },
    BOOLEAN: { allowed: true, description: '文本 → 布尔（"true"/"1"→是, 其他→否）', transform: (v) => ['true', '1', 'yes'].includes(String(v).toLowerCase()) },
    DATE: { allowed: true, description: '文本 → 日期（需 YYYY-MM-DD 格式）' },
    DATETIME: { allowed: true, description: '文本 → 日期时间' },
    SELECT: { allowed: true, description: '文本 → 下拉选择' },
    MULTI_SELECT: { allowed: false, description: '不能直接转换为多选' },
    JSON: { allowed: false, description: '文本 → JSON 可能丢失结构' },
    CURRENCY: { allowed: true, description: '文本 → 金额（非数字将被清空）', transform: (v) => { const n = Number(v); return isNaN(n) ? null : n; } },
    LOCATION: { allowed: false, description: '文本 → 经纬度需要 "lat,lng" 格式' },
    RATING: { allowed: true, description: '文本 → 评分（非数字将被清空）', transform: (v) => { const n = Number(v); return isNaN(n) ? null : Math.max(0.5, Math.min(5, n)); } },
  },
  NUMBER: {
    STRING: { allowed: true, description: '数字 → 文本', transform: (v) => String(v) },
    TEXT: { allowed: true, description: '数字 → 多行文本', transform: (v) => String(v) },
    BOOLEAN: { allowed: true, description: '数字 → 布尔（0→否, 其他→是）', transform: (v) => Number(v) !== 0 },
    CURRENCY: { allowed: true, description: '数字 → 金额', transform: (v) => Number(v) },
    RATING: { allowed: true, description: '数字 → 评分', transform: (v) => Math.max(0.5, Math.min(5, Number(v))) },
    DATE: { allowed: false, description: '数字不能转换为日期' },
    EMAIL: { allowed: false },
    URL: { allowed: false },
    PHONE: { allowed: false },
  },
  TEXT: {
    STRING: { allowed: true, description: '多行文本 → 单行文本' },
    EMAIL: { allowed: true, description: '多行文本 → 邮箱' },
    URL: { allowed: true, description: '多行文本 → 链接' },
    JSON: { allowed: true, description: '多行文本 → JSON' },
  },
  BOOLEAN: {
    STRING: { allowed: true, description: '布尔 → 文本', transform: (v) => v ? '是' : '否' },
    NUMBER: { allowed: true, description: '布尔 → 数字', transform: (v) => v ? 1 : 0 },
  },
  DATE: {
    DATETIME: { allowed: true, description: '日期 → 日期时间（时间部分设为 00:00:00）' },
    STRING: { allowed: true, description: '日期 → 文本', transform: (v) => String(v) },
  },
  DATETIME: {
    DATE: { allowed: true, description: '日期时间 → 日期（截断时间部分）', transform: (v) => String(v).slice(0, 10) },
    STRING: { allowed: true, description: '日期时间 → 文本', transform: (v) => String(v) },
  },
  EMAIL: {
    STRING: { allowed: true, description: '邮箱 → 文本' },
    TEXT: { allowed: true, description: '邮箱 → 多行文本' },
  },
  URL: {
    STRING: { allowed: true, description: '链接 → 文本' },
  },
  PHONE: {
    STRING: { allowed: true, description: '电话 → 文本' },
  },
  CURRENCY: {
    NUMBER: { allowed: true, description: '金额 → 数字' },
    STRING: { allowed: true, description: '金额 → 文本', transform: (v) => String(v) },
    RATING: { allowed: true, description: '金额 → 评分', transform: (v) => Math.max(0.5, Math.min(5, Number(v))) },
  },
  RATING: {
    NUMBER: { allowed: true, description: '评分 → 数字' },
    STRING: { allowed: true, description: '评分 → 文本', transform: (v) => String(v) },
    CURRENCY: { allowed: true, description: '评分 → 金额', transform: (v) => Number(v) },
  },
  SELECT: {
    STRING: { allowed: true, description: '下拉选择 → 文本' },
    MULTI_SELECT: { allowed: true, description: '下拉选择 → 多选' },
  },
  MULTI_SELECT: {
    STRING: { allowed: true, description: '多选 → 文本' },
    SELECT: { allowed: false, description: '多选 → 下拉选择会丢失数据' },
  },
  JSON: {
    STRING: { allowed: true, description: 'JSON → 文本', transform: (v) => JSON.stringify(v) },
    TEXT: { allowed: true, description: 'JSON → 多行文本', transform: (v) => JSON.stringify(v, null, 2) },
  },
  FILE: {
    STRING: { allowed: true, description: '文件 → 文本（URL）' },
  },
  IMAGE: {
    STRING: { allowed: true, description: '图片 → 文本（URL）' },
    FILE: { allowed: true, description: '图片 → 文件' },
  },
  COLOR: {
    STRING: { allowed: true, description: '颜色 → 文本' },
  },
  LOCATION: {
    STRING: { allowed: true, description: '经纬度 → 文本', transform: (v) => typeof v === 'object' ? `${(v as any).lat},${(v as any).lng}` : String(v) },
  },
  RELATION: {
    STRING: { allowed: false, description: '关联字段不能直接转换为其他类型' },
  },
};

/** Check if a type conversion is allowed */
export function canConvertType(fromType: string, toType: string): TypeConversion {
  if (fromType === toType) return { allowed: true, description: '相同类型无需转换' };

  const fromConversions = TYPE_MATRIX[fromType];
  if (!fromConversions) return { allowed: false };

  return fromConversions[toType] || { allowed: false, description: `${fromType} 不能转换为 ${toType}` };
}

/** Transform a value when converting between types */
export function transformFieldValue(fromType: string, toType: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (fromType === toType) return value;

  const fromConversions = TYPE_MATRIX[fromType];
  if (!fromConversions) return value;

  const conversion = fromConversions[toType];
  if (!conversion || !conversion.transform) return value;

  return conversion.transform(value);
}

/** Get all compatible target types for a given source type */
export function getCompatibleTypes(fromType: string): Array<{ toType: string; description: string }> {
  const result: Array<{ toType: string; description: string }> = [];
  const fromConversions = TYPE_MATRIX[fromType];
  if (!fromConversions) return result;

  for (const [toType, conv] of Object.entries(fromConversions)) {
    if (conv.allowed) {
      result.push({ toType, description: conv.description || `${fromType} → ${toType}` });
    }
  }
  return result;
}

/** Available dynamic default value expressions */
export const AVAILABLE_EXPRESSIONS = [
  { expression: '{{NOW()}}', label: '当前日期时间', description: 'ISO 格式的当前时间戳' },
  { expression: '{{UUID()}}', label: '随机 UUID', description: '全局唯一的随机标识符' },
  { expression: '{{USER_ID()}}', label: '当前用户 ID', description: '创建记录的用户 ID' },
  { expression: '{{DATE_TODAY()}}', label: '当前日期', description: 'YYYY-MM-DD 格式的今天日期' },
  { expression: '{{TIME_NOW()}}', label: '当前时间', description: 'HH:mm:ss 格式的当前时间' },
  { expression: '{{SEQUENCE()}}', label: '自动序列号', description: '按实体+字段自增的编号 (0001)' },
];

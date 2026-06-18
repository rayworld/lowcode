import { v4 as uuidv4 } from 'uuid';

/**
 * Default value expression engine.
 * Resolves template expressions like {{NOW()}}, {{UUID()}} etc. at runtime.
 */
export class DefaultValueEngine {
  private sequenceCounters = new Map<string, number>();

  /**
   * Resolve a single default value expression.
   * If no expression pattern is found, returns the raw value.
   */
  resolve(value: string | null | undefined, context: { userId?: string; entityId?: string; fieldName?: string }): string | null | undefined {
    if (!value) return value;

    // Check for template pattern {{EXPR()}}
    const match = value.match(/\{\{(\w+)\(\)\}\}/);
    if (!match) return value;

    const expression = match[1].toUpperCase();

    switch (expression) {
      case 'NOW':
        return new Date().toISOString();
      case 'UUID':
        return uuidv4();
      case 'USER_ID':
        return context.userId || value;
      case 'SEQUENCE':
        return this.getNextSequence(context.entityId || 'global', context.fieldName || 'default');
      case 'DATE_TODAY':
        return new Date().toISOString().slice(0, 10);
      case 'TIME_NOW':
        return new Date().toTimeString().slice(0, 8);
      default:
        return value;
    }
  }

  /**
   * Resolve all default values in a record data payload.
   * Fills in defaults for fields that are not provided or are undefined.
   */
  resolveRecordDefaults(
    fields: Array<{ name: string; defaultValue: string | null }>,
    data: Record<string, unknown>,
    context: { userId?: string; entityId?: string },
  ): Record<string, unknown> {
    const result = { ...data };

    for (const field of fields) {
      // Only fill default if value is not already provided
      if (result[field.name] === undefined || result[field.name] === null) {
        const resolved = this.resolve(field.defaultValue, {
          ...context,
          fieldName: field.name,
        });
        if (resolved !== null && resolved !== undefined) {
          result[field.name] = resolved;
        }
      }
    }

    return result;
  }

  private getNextSequence(entityId: string, fieldName: string): string {
    const key = `${entityId}:${fieldName}`;
    const next = (this.sequenceCounters.get(key) || 0) + 1;
    this.sequenceCounters.set(key, next);
    return String(next).padStart(4, '0');
  }
}

/** Available expressions that can be used as default values */
export const AVAILABLE_EXPRESSIONS = [
  { expression: '{{NOW()}}', label: '当前日期时间', description: 'ISO 格式的当前时间戳' },
  { expression: '{{UUID()}}', label: '随机 UUID', description: '全局唯一的随机标识符' },
  { expression: '{{USER_ID()}}', label: '当前用户 ID', description: '创建记录的用户 ID' },
  { expression: '{{DATE_TODAY()}}', label: '当前日期', description: 'YYYY-MM-DD 格式的今天日期' },
  { expression: '{{TIME_NOW()}}', label: '当前时间', description: 'HH:mm:ss 格式的当前时间' },
  { expression: '{{SEQUENCE()}}', label: '自动序列号', description: '按实体+字段自增的编号 (0001)' },
];

import { BadRequestException } from '@nestjs/common';

/**
 * 验证规则定义（与客户端 FieldValidationRule 一致）
 */
export interface FieldValidationRule {
  type: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern';
  value?: string | number;
  message?: string;
}

/**
 * 字段定义（验证引擎的最小接口）
 */
export interface FieldDef {
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  unique: boolean;
  validationRules?: FieldValidationRule[] | null;
}

/**
 * 验证错误
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 字段值验证引擎
 *
 * 读取实体字段配置中的验证规则，对记录数据执行服务端验证。
 * 与前端验证规则保持同步，防止 API 直接调用绕过验证。
 */
export class ValidationEngine {
  /**
   * 执行完整的字段验证
   * @returns 验证错误列表，为空则表示验证通过
   */
  validate(fields: FieldDef[], data: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of fields) {
      const value = data[field.name];

      // 1. 必填验证
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `字段 "${field.displayName}" 是必填的`,
        });
        continue; // 跳过后续验证，值不存在
      }

      // 值为空时跳过后续验证
      if (value === undefined || value === null || value === '') continue;

      // 2. 类型验证（调用现有方法）
      const typeError = this.validateType(field.type, value);
      if (typeError) {
        errors.push({ field: field.name, message: typeError });
        continue;
      }

      // 3. 自定义验证规则
      if (field.validationRules && field.validationRules.length > 0) {
        for (const rule of field.validationRules) {
          const ruleError = this.validateRule(field, rule, value);
          if (ruleError) {
            errors.push({ field: field.name, message: ruleError });
          }
        }
      }
    }

    return errors;
  }

  /**
   * 类型验证
   */
  private validateType(type: string, value: unknown): string | null {
    const displayName = ''; // 错误消息会由上层拼接
    switch (type) {
      case 'NUMBER': {
        if (typeof value === 'string' && value.trim() === '') return null;
        return isNaN(Number(value)) ? `必须是数字` : null;
      }
      case 'EMAIL': {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? null : `不是有效的邮箱地址`;
      }
      case 'URL': {
        try { new URL(String(value)); return null; }
        catch { return `不是有效的URL地址`; }
      }
      case 'PHONE': {
        const str = String(value).replace(/[\s-]/g, '');
        return /^\+?[\d]{7,15}$/.test(str) ? null : `不是有效的电话号码`;
      }
      case 'BOOLEAN': {
        return (typeof value === 'boolean' || ['true', 'false', '0', '1'].includes(String(value)))
          ? null : `必须是布尔值`;
      }
      case 'DATE': {
        return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !isNaN(Date.parse(String(value)))
          ? null : `不是有效的日期格式 (YYYY-MM-DD)`;
      }
      case 'CURRENCY': {
        return (!isNaN(Number(value)) && Number(value) >= 0) ? null : `必须是正数金额`;
      }
      case 'RATING': {
        const r = Number(value);
        return (!isNaN(r) && r >= 0.5 && r <= 5) ? null : `必须是 0.5 到 5 之间的评分`;
      }
      case 'COLOR': {
        const s = String(value);
        return (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) || /^[a-z]+$/.test(s))
          ? null : `不是有效的颜色值`;
      }
      default:
        return null;
    }
  }

  /**
   * 单条验证规则执行
   */
  private validateRule(
    field: FieldDef,
    rule: FieldValidationRule,
    value: unknown,
  ): string | null {
    const strValue = String(value);
    const numValue = Number(value);
    const msg = rule.message;

    switch (rule.type) {
      case 'minLength': {
        const min = Number(rule.value);
        if (!isNaN(min) && strValue.length < min) {
          return msg || `至少需要 ${min} 个字符`;
        }
        return null;
      }
      case 'maxLength': {
        const max = Number(rule.value);
        if (!isNaN(max) && strValue.length > max) {
          return msg || `不能超过 ${max} 个字符`;
        }
        return null;
      }
      case 'min': {
        const min = Number(rule.value);
        if (!isNaN(min) && numValue < min) {
          return msg || `不能小于 ${min}`;
        }
        return null;
      }
      case 'max': {
        const max = Number(rule.value);
        if (!isNaN(max) && numValue > max) {
          return msg || `不能大于 ${max}`;
        }
        return null;
      }
      case 'pattern': {
        if (!rule.value) return null;
        try {
          const re = new RegExp(String(rule.value));
          if (!re.test(strValue)) {
            return msg || `格式不符合要求`;
          }
        } catch {
          return `正则表达式无效: ${rule.value}`;
        }
        return null;
      }
      default:
        return null;
    }
  }

  /**
   * 对验证错误列表进行聚合（抛出第一个错误，或返回全部）
   */
  throwOnError(errors: ValidationError[]): void {
    if (errors.length > 0) {
      throw new BadRequestException(errors.map(e => e.message).join('; '));
    }
  }
}

import { describe, it, expect } from 'vitest';
import { canConvertType, transformFieldValue, getCompatibleTypes } from './field-type-matrix';

describe('field-type-matrix', () => {
  describe('canConvertType', () => {
    it('相同类型总是允许转换', () => {
      const result = canConvertType('STRING', 'STRING');
      expect(result.allowed).toBe(true);
      expect(result.description).toContain('相同类型');
    });

    it('STRING → TEXT 允许', () => {
      expect(canConvertType('STRING', 'TEXT').allowed).toBe(true);
    });

    it('STRING → NUMBER 允许，带转换函数', () => {
      const result = canConvertType('STRING', 'NUMBER');
      expect(result.allowed).toBe(true);
      expect(result.transform).toBeDefined();
    });

    it('STRING → MULTI_SELECT 不允许', () => {
      expect(canConvertType('STRING', 'MULTI_SELECT').allowed).toBe(false);
    });

    it('NUMBER → DATE 不允许', () => {
      expect(canConvertType('NUMBER', 'DATE').allowed).toBe(false);
    });

    it('BOOLEAN → STRING 允许，带转换函数', () => {
      const result = canConvertType('BOOLEAN', 'STRING');
      expect(result.allowed).toBe(true);
      expect(result.transform).toBeDefined();
    });

    it('不存在的类型返回 false', () => {
      expect(canConvertType('INVALID_TYPE', 'STRING').allowed).toBe(false);
    });

    it('RELATION 不允许转换到任何类型', () => {
      expect(canConvertType('RELATION', 'STRING').allowed).toBe(false);
      expect(canConvertType('RELATION', 'NUMBER').allowed).toBe(false);
    });
  });

  describe('transformFieldValue', () => {
    it('null/undefined 直接返回', () => {
      expect(transformFieldValue('STRING', 'NUMBER', null)).toBeNull();
      expect(transformFieldValue('STRING', 'NUMBER', undefined)).toBeUndefined();
    });

    it('相同类型直接返回', () => {
      expect(transformFieldValue('STRING', 'STRING', 'hello')).toBe('hello');
    });

    it('STRING → NUMBER 转换', () => {
      expect(transformFieldValue('STRING', 'NUMBER', '42')).toBe(42);
      expect(transformFieldValue('STRING', 'NUMBER', 'abc')).toBeNull();
    });

    it('NUMBER → STRING 转换', () => {
      expect(transformFieldValue('NUMBER', 'STRING', 42)).toBe('42');
    });

    it('BOOLEAN → STRING 转换', () => {
      expect(transformFieldValue('BOOLEAN', 'STRING', true)).toBe('是');
      expect(transformFieldValue('BOOLEAN', 'STRING', false)).toBe('否');
    });

    it('BOOLEAN → NUMBER 转换', () => {
      expect(transformFieldValue('BOOLEAN', 'NUMBER', true)).toBe(1);
      expect(transformFieldValue('BOOLEAN', 'NUMBER', false)).toBe(0);
    });

    it('STRING → RATING 转换', () => {
      expect(transformFieldValue('STRING', 'RATING', '3.5')).toBe(3.5);
      expect(transformFieldValue('STRING', 'RATING', '10')).toBe(5);
    });
  });

  describe('getCompatibleTypes', () => {
    it('STRING 有 10+ 个兼容类型', () => {
      const types = getCompatibleTypes('STRING');
      expect(types.length).toBeGreaterThan(10);
      expect(types.some(t => t.toType === 'TEXT')).toBe(true);
      expect(types.some(t => t.toType === 'NUMBER')).toBe(true);
      expect(types.some(t => t.toType === 'EMAIL')).toBe(true);
    });

    it('NUMBER 有 5 个兼容类型', () => {
      const types = getCompatibleTypes('NUMBER');
      expect(types.length).toBeGreaterThanOrEqual(4);
      expect(types.some(t => t.toType === 'STRING')).toBe(true);
      expect(types.some(t => t.toType === 'BOOLEAN')).toBe(true);
    });

    it('RELATION 没有兼容类型', () => {
      expect(getCompatibleTypes('RELATION')).toHaveLength(0);
    });

    it('不存在的类型返回空数组', () => {
      expect(getCompatibleTypes('UNKNOWN')).toHaveLength(0);
    });
  });
});

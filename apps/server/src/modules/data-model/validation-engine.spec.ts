import { describe, it, expect } from 'vitest';
import { ValidationEngine, FieldDef } from './validation-engine';

describe('ValidationEngine', () => {
  const engine = new ValidationEngine();

  const stringField: FieldDef = {
    name: 'username',
    displayName: '用户名',
    type: 'STRING',
    required: true,
    unique: false,
    validationRules: [
      { type: 'minLength', value: 2, message: '至少 2 个字符' },
      { type: 'maxLength', value: 20, message: '最多 20 个字符' },
    ],
  };

  const emailField: FieldDef = {
    name: 'email',
    displayName: '邮箱',
    type: 'EMAIL',
    required: true,
    unique: true,
    validationRules: null,
  };

  const numberField: FieldDef = {
    name: 'age',
    displayName: '年龄',
    type: 'NUMBER',
    required: false,
    unique: false,
    validationRules: [
      { type: 'min', value: 0, message: '年龄不能为负' },
      { type: 'max', value: 150, message: '年龄不能超过 150' },
    ],
  };

  const ratingField: FieldDef = {
    name: 'score',
    displayName: '评分',
    type: 'RATING',
    required: false,
    unique: false,
  };

  const colorField: FieldDef = {
    name: 'theme',
    displayName: '主题色',
    type: 'COLOR',
    required: false,
    unique: false,
  };

  const patternField: FieldDef = {
    name: 'phone',
    displayName: '手机号',
    type: 'STRING',
    required: false,
    unique: false,
    validationRules: [
      { type: 'pattern', value: '^1[3-9]\\d{9}$', message: '不是有效的手机号' },
    ],
  };

  describe('必填验证', () => {
    it('required 字段缺失时报错', () => {
      const errors = engine.validate([stringField], {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('必填');
    });

    it('required 字段为 null 时报错', () => {
      const errors = engine.validate([stringField], { username: null });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('required 字段有值时通过', () => {
      const errors = engine.validate([stringField], { username: 'alice' });
      expect(errors).toHaveLength(0);
    });

    it('非 required 字段缺失时不报错', () => {
      const errors = engine.validate([numberField], {});
      expect(errors).toHaveLength(0);
    });
  });

  describe('类型验证', () => {
    it('EMAIL 验证通过', () => {
      const errors = engine.validate([emailField], { email: 'test@example.com' });
      expect(errors).toHaveLength(0);
    });

    it('EMAIL 验证失败', () => {
      const errors = engine.validate([emailField], { email: 'not-an-email' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('邮箱');
    });

    it('NUMBER 验证通过', () => {
      const errors = engine.validate([numberField], { age: 25 });
      expect(errors).toHaveLength(0);
    });

    it('NUMBER 验证失败', () => {
      const errors = engine.validate([numberField], { age: 'abc' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('数字');
    });

    it('RATING 验证通过', () => {
      expect(engine.validate([ratingField], { score: 4.5 })).toHaveLength(0);
      expect(engine.validate([ratingField], { score: 0.5 })).toHaveLength(0);
      expect(engine.validate([ratingField], { score: 5 })).toHaveLength(0);
    });

    it('RATING 验证失败（超出范围）', () => {
      const errors = engine.validate([ratingField], { score: 6 });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('COLOR 验证通过（十六进制）', () => {
      expect(engine.validate([colorField], { theme: '#FF0000' })).toHaveLength(0);
      expect(engine.validate([colorField], { theme: '#fff' })).toHaveLength(0);
    });

    it('COLOR 验证失败', () => {
      const errors = engine.validate([colorField], { theme: 'not-a-color' });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('自定义验证规则', () => {
    it('minLength 验证通过', () => {
      const errors = engine.validate([stringField], { username: 'alice' });
      expect(errors).toHaveLength(0);
    });

    it('minLength 验证失败', () => {
      const errors = engine.validate([stringField], { username: 'a' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('至少 2 个字符');
    });

    it('maxLength 验证失败', () => {
      const errors = engine.validate([stringField], { username: 'a'.repeat(21) });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('最多 20 个字符');
    });

    it('min 数值验证', () => {
      const errors = engine.validate([numberField], { age: -1 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('年龄不能为负');
    });

    it('max 数值验证', () => {
      const errors = engine.validate([numberField], { age: 200 });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('正则验证通过', () => {
      const errors = engine.validate([patternField], { phone: '13800138000' });
      expect(errors).toHaveLength(0);
    });

    it('正则验证失败', () => {
      const errors = engine.validate([patternField], { phone: '12345' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('手机号');
    });

    it('无效的正则表达式不报错（静默失败）', () => {
      const badRuleField: FieldDef = {
        name: 'test',
        displayName: '测试',
        type: 'STRING',
        required: false,
        unique: false,
        validationRules: [{ type: 'pattern', value: '[invalid' }],
      };
      const errors = engine.validate([badRuleField], { test: 'hello' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('正则');
    });
  });

  describe('多字段验证', () => {
    it('多个字段都通过', () => {
      const errors = engine.validate(
        [stringField, emailField, numberField],
        { username: 'alice', email: 'alice@example.com', age: 30 },
      );
      expect(errors).toHaveLength(0);
    });

    it('多个字段部分失败', () => {
      const errors = engine.validate(
        [stringField, emailField, numberField],
        { username: 'a', email: 'invalid' },
      );
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('throwOnError', () => {
    it('有错误时抛出 BadRequestException', () => {
      expect(() => engine.throwOnError([{ field: 'x', message: '错误' }])).toThrow();
    });

    it('无错误时不抛出', () => {
      expect(() => engine.throwOnError([])).not.toThrow();
    });
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CodegenResult {
  typescript: string;
  formComponent: string;
  tableComponent: string;
}

@Injectable()
export class CodegenService {
  constructor(private prisma: PrismaService) {}

  async generate(entityId: string): Promise<CodegenResult> {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    const typeName = this.toPascalCase(entity.name);
    const fields = entity.fields;

    const typescript = this.generateTypeScript(typeName, fields);
    const formComponent = this.generateFormComponent(typeName, fields);
    const tableComponent = this.generateTableComponent(typeName, fields);

    return { typescript, formComponent, tableComponent };
  }

  /** Generate all entities in an app at once */
  async generateAll(appId: string): Promise<string> {
    const entities = await this.prisma.dataEntity.findMany({
      where: { appId },
      include: { fields: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });

    const parts: string[] = ['// =========================================='];
    parts.push('// Auto-generated TypeScript types from data model');
    parts.push('// ==========================================\n');

    for (const entity of entities) {
      const typeName = this.toPascalCase(entity.name);
      parts.push(this.generateTypeScript(typeName, entity.fields));
    }

    return parts.join('\n');
  }

  // ========== TypeScript Interface Generator ==========

  private generateTypeScript(typeName: string, fields: any[]): string {
    const lines: string[] = [];
    lines.push(`/** ${typeName} - Auto-generated from data model */`);
    lines.push(`export interface ${typeName} {`);
    lines.push(`  id: string;`);
    lines.push(`  createdAt: string;`);
    lines.push(`  updatedAt: string;`);

    for (const field of fields) {
      const tsType = this.fieldTypeToTS(field);
      const nullable = !field.required ? ' | null' : '';
      lines.push(`  /** ${field.displayName || field.name}${field.required ? ' (必填)' : ''} */`);
      lines.push(`  ${field.name}${field.required ? '' : '?'}: ${tsType}${nullable};`);
    }

    lines.push('}\n');
    return lines.join('\n');
  }

  private fieldTypeToTS(field: any): string {
    switch (field.type) {
      case 'STRING':
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'COLOR':
      case 'SELECT':
        return 'string';
      case 'MULTI_SELECT':
        return 'string[]';
      case 'NUMBER':
      case 'CURRENCY':
      case 'RATING':
        return 'number';
      case 'BOOLEAN':
        return 'boolean';
      case 'DATE':
        return 'string'; // ISO date string
      case 'DATETIME':
        return 'string'; // ISO datetime string
      case 'JSON':
        return 'Record<string, unknown>';
      case 'FILE':
      case 'IMAGE':
        return 'string'; // URL
      case 'LOCATION':
        return '{ lat: number; lng: number }';
      case 'RELATION':
        return field.relationType === 'MANY_TO_MANY' ? 'string[]' : 'string';
      default:
        return 'unknown';
    }
  }

  // ========== Form Component Generator ==========

  private generateFormComponent(typeName: string, fields: any[]): string {
    const nonRelationFields = fields.filter((f) => f.type !== 'RELATION');
    const formItems = nonRelationFields
      .map((f) => {
        const label = f.displayName || f.name;
        const required = f.required ? ' { required: true, message: \`请输入${label}\` }' : '';

        let component: string;
        switch (f.type) {
          case 'TEXT':
            component = `<Input.TextArea rows={3} />`;
            break;
          case 'BOOLEAN':
            component = `<Switch />`;
            break;
          case 'NUMBER':
          case 'CURRENCY':
          case 'RATING':
            component = `<InputNumber style={{ width: '100%' }} />`;
            break;
          case 'DATE':
            component = `<DatePicker style={{ width: '100%' }} />`;
            break;
          case 'DATETIME':
            component = `<DatePicker showTime style={{ width: '100%' }} />`;
            break;
          case 'SELECT':
            component = `<Select placeholder="请选择${label}">
  ${(f.options || []).map((o: any) => `    <Select.Option value="${o.value}">${o.label}</Select.Option>`).join('\n')}
            </Select>`;
            break;
          case 'EMAIL':
            component = `<Input placeholder="email@example.com" />`;
            break;
          case 'URL':
            component = `<Input placeholder="https://..." />`;
            break;
          default:
            component = `<Input />`;
        }

        return `      <Form.Item name="${f.name}" label="${label}" rules={[${required}]}>
          ${component}
        </Form.Item>`;
      })
      .join('\n');

    return [
      `import { Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd';`,
      ``,
      `/** ${typeName} 表单组件 - Auto-generated */`,
      `export function ${typeName}Form() {`,
      `  return (`,
      `    <Form layout="vertical">`,
      formItems,
      `    </Form>`,
      `  );`,
      `}`,
      ``,
    ].join('\n');
  }

  // ========== Table Component Generator ==========

  private generateTableComponent(typeName: string, fields: any[]): string {
    const columns = fields.slice(0, 8).map((f) => {
      const label = f.displayName || f.name;
      let render = '';
      switch (f.type) {
        case 'BOOLEAN':
          render = `\n      render: (v: boolean) => v ? '是' : '否',`;
          break;
        case 'DATETIME':
          render = `\n      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),`;
          break;
        case 'DATE':
          render = `\n      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),`;
          break;
        case 'CURRENCY':
          render = `\n      render: (v: number) => v != null ? \`¥\${v.toFixed(2)}\` : '-',`;
          break;
        default:
          render = '';
      }
      return `  { title: '${label}', dataIndex: '${f.name}', key: '${f.name}'${render} }`;
    });

    const columnsStr = columns.join(',\n');

    return [
      `import { Table } from 'antd';`,
      `import dayjs from 'dayjs';`,
      `import type { ColumnsType } from 'antd/es/table';`,
      ``,
      `/** ${typeName} 表格列定义 - Auto-generated */`,
      `export const ${typeName}Columns: ColumnsType<any> = [`,
      columnsStr,
      `];`,
      ``,
    ].join('\n');
  }

  // ========== Helpers ==========

  private toPascalCase(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(/[\s_]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ComponentCategory } from '@lowcode/shared';

@Injectable()
export class ComponentService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where = category ? { category } : {};
    return this.prisma.componentDefinition.findMany({
      where,
      orderBy: { category: 'asc' },
    });
  }

  async findById(id: string) {
    const component = await this.prisma.componentDefinition.findUnique({
      where: { id },
    });
    if (!component) throw new NotFoundException('组件不存在');
    return component;
  }

  async seedBuiltInComponents() {
    const count = await this.prisma.componentDefinition.count({
      where: { isBuiltIn: true },
    });
    if (count > 0) return { seeded: false, count };

    const components = [
      // Layout
      { name: 'Page', title: '页面', category: ComponentCategory.LAYOUT, icon: 'Layout', props: [{ name: 'title', label: '页面标题', type: 'string' }], defaultProps: { title: '新页面' } },
      { name: 'Row', title: '行布局', category: ComponentCategory.LAYOUT, icon: 'RowHorizontal', props: [{ name: 'gap', label: '间距', type: 'number', defaultValue: 16 }] },
      { name: 'Column', title: '列布局', category: ComponentCategory.LAYOUT, icon: 'ColumnHorizontal', props: [{ name: 'span', label: '列宽', type: 'number', defaultValue: 12 }, { name: 'offset', label: '偏移', type: 'number', defaultValue: 0 }] },
      { name: 'Card', title: '卡片', category: ComponentCategory.LAYOUT, icon: 'Card', props: [{ name: 'title', label: '标题', type: 'string' }] },
      { name: 'Tabs', title: '选项卡', category: ComponentCategory.LAYOUT, icon: 'Tab', props: [{ name: 'defaultActiveKey', label: '默认选中', type: 'string' }] },
      // Form
      { name: 'Form', title: '表单', category: ComponentCategory.FORM, icon: 'Form', props: [{ name: 'submitText', label: '提交按钮文字', type: 'string', defaultValue: '提交' }] },
      { name: 'Input', title: '输入框', category: ComponentCategory.FORM, icon: 'Input', props: [{ name: 'placeholder', label: '占位文字', type: 'string' }, { name: 'label', label: '标签', type: 'string' }, { name: 'required', label: '必填', type: 'boolean', defaultValue: false }] },
      { name: 'Textarea', title: '文本域', category: ComponentCategory.FORM, icon: 'TextArea', props: [{ name: 'placeholder', label: '占位文字', type: 'string' }, { name: 'rows', label: '行数', type: 'number', defaultValue: 4 }] },
      { name: 'Select', title: '下拉选择', category: ComponentCategory.FORM, icon: 'Select', props: [{ name: 'placeholder', label: '占位文字', type: 'string' }, { name: 'options', label: '选项', type: 'json' }] },
      { name: 'DatePicker', title: '日期选择', category: ComponentCategory.FORM, icon: 'Date', props: [{ name: 'label', label: '标签', type: 'string' }] },
      { name: 'Switch', title: '开关', category: ComponentCategory.FORM, icon: 'Switch', props: [{ name: 'label', label: '标签', type: 'string' }] },
      { name: 'Button', title: '按钮', category: ComponentCategory.FORM, icon: 'Button', props: [{ name: 'text', label: '文字', type: 'string', defaultValue: '按钮' }, { name: 'type', label: '类型', type: 'select', defaultValue: 'default', options: [{ label: '默认', value: 'default' }, { label: '主要', value: 'primary' }, { label: '危险', value: 'danger' }] }] },
      // Display
      { name: 'Text', title: '文本', category: ComponentCategory.DISPLAY, icon: 'Text', props: [{ name: 'content', label: '内容', type: 'string' }, { name: 'type', label: '类型', type: 'select', defaultValue: 'body', options: [{ label: '标题1', value: 'h1' }, { label: '标题2', value: 'h2' }, { label: '正文', value: 'body' }] }] },
      { name: 'Image', title: '图片', category: ComponentCategory.DISPLAY, icon: 'Image', props: [{ name: 'src', label: '图片地址', type: 'string' }, { name: 'alt', label: '替代文字', type: 'string' }, { name: 'width', label: '宽度', type: 'string' }] },
      { name: 'Divider', title: '分割线', category: ComponentCategory.DISPLAY, icon: 'Divider', props: [{ name: 'text', label: '文字', type: 'string' }] },
      // Data
      { name: 'Table', title: '表格', category: ComponentCategory.DATA, icon: 'Table', props: [{ name: 'columns', label: '列配置', type: 'json' }, { name: 'pageSize', label: '每页条数', type: 'number', defaultValue: 20 }] },
      { name: 'List', title: '列表', category: ComponentCategory.DATA, icon: 'List', props: [{ name: 'dataSource', label: '数据源', type: 'string' }] },
    ];

    for (const comp of components) {
      await this.prisma.componentDefinition.create({
        data: {
          ...comp,
          props: comp.props as any,
          defaultProps: comp.defaultProps as any,
          isBuiltIn: true,
        },
      });
    }

    return { seeded: true, count: components.length };
  }
}

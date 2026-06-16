import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import pg from 'pg';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('开始初始化数据...');

  // 1. 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lowcode.com' },
    update: {},
    create: {
      email: 'admin@lowcode.com',
      username: '管理员',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ 管理员用户已创建: ${admin.email}`);

  // 2. 内置组件定义
  const builtInCount = await prisma.componentDefinition.count({
    where: { isBuiltIn: true },
  });

  if (builtInCount === 0) {
    const components = [
      // Layout
      { name: 'Page', title: '页面', category: 'LAYOUT', icon: 'Layout', props: [{ name: 'title', label: '页面标题', type: 'string' }], defaultProps: { title: '新页面' } },
      { name: 'Row', title: '行布局', category: 'LAYOUT', icon: 'RowHorizontal', props: [{ name: 'gap', label: '间距', type: 'number', defaultValue: 16 }] },
      { name: 'Column', title: '列布局', category: 'LAYOUT', icon: 'ColumnHorizontal', props: [{ name: 'span', label: '列宽', type: 'number', defaultValue: 12 }, { name: 'offset', label: '偏移', type: 'number', defaultValue: 0 }] },
      { name: 'Card', title: '卡片', category: 'LAYOUT', icon: 'Card', props: [{ name: 'title', label: '标题', type: 'string' }] },
      { name: 'Tabs', title: '选项卡', category: 'LAYOUT', icon: 'Tab', props: [{ name: 'defaultActiveKey', label: '默认选中', type: 'string' }] },
      // Form
      { name: 'Form', title: '表单', category: 'FORM', icon: 'Form', props: [{ name: 'submitText', label: '提交按钮文字', type: 'string', defaultValue: '提交' }] },
      { name: 'Input', title: '输入框', category: 'FORM', icon: 'Input', props: [{ name: 'placeholder', label: '占位文字', type: 'string' }, { name: 'label', label: '标签', type: 'string' }, { name: 'required', label: '必填', type: 'boolean', defaultValue: false }] },
      { name: 'Textarea', title: '文本域', category: 'FORM', icon: 'TextArea', props: [{ name: 'placeholder', label: '占位文字', type: 'string' }, { name: 'rows', label: '行数', type: 'number', defaultValue: 4 }] },
      { name: 'Select', title: '下拉选择', category: 'FORM', icon: 'Select', props: [{ name: 'placeholder', label: '占位文字', type: 'string' }, { name: 'options', label: '选项', type: 'json' }] },
      { name: 'DatePicker', title: '日期选择', category: 'FORM', icon: 'Date', props: [{ name: 'label', label: '标签', type: 'string' }] },
      { name: 'Switch', title: '开关', category: 'FORM', icon: 'Switch', props: [{ name: 'label', label: '标签', type: 'string' }] },
      { name: 'Button', title: '按钮', category: 'FORM', icon: 'Button', props: [{ name: 'text', label: '文字', type: 'string', defaultValue: '按钮' }, { name: 'type', label: '类型', type: 'select', defaultValue: 'default', options: [{ label: '默认', value: 'default' }, { label: '主要', value: 'primary' }, { label: '危险', value: 'danger' }] }] },
      // Display
      { name: 'Text', title: '文本', category: 'DISPLAY', icon: 'Text', props: [{ name: 'content', label: '内容', type: 'string' }, { name: 'type', label: '类型', type: 'select', defaultValue: 'body', options: [{ label: '标题1', value: 'h1' }, { label: '标题2', value: 'h2' }, { label: '正文', value: 'body' }] }] },
      { name: 'Image', title: '图片', category: 'DISPLAY', icon: 'Image', props: [{ name: 'src', label: '图片地址', type: 'string' }, { name: 'alt', label: '替代文字', type: 'string' }, { name: 'width', label: '宽度', type: 'string' }] },
      { name: 'Divider', title: '分割线', category: 'DISPLAY', icon: 'Divider', props: [{ name: 'text', label: '文字', type: 'string' }] },
      // Data
      { name: 'Table', title: '表格', category: 'DATA', icon: 'Table', props: [{ name: 'columns', label: '列配置', type: 'json' }, { name: 'pageSize', label: '每页条数', type: 'number', defaultValue: 20 }] },
      { name: 'List', title: '列表', category: 'DATA', icon: 'List', props: [{ name: 'dataSource', label: '数据源', type: 'string' }] },
    ];

    for (const comp of components) {
      await prisma.componentDefinition.create({
        data: {
          ...comp,
          props: comp.props as any,
          defaultProps: comp.defaultProps as any,
          isBuiltIn: true,
        },
      });
    }
    console.log(`✅ 内置组件已创建: ${components.length} 个`);
  } else {
    console.log(`⏭️  内置组件已存在，跳过`);
  }

  console.log('🎉 数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

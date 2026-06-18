/** Predefined data model templates for quick-start entity creation */
export interface FieldTemplate {
  name: string;
  displayName: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}

export interface EntityTemplate {
  name: string;
  displayName: string;
  description?: string;
  fields: FieldTemplate[];
}

export interface ModelTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  entities: EntityTemplate[];
}

export const MODEL_TEMPLATES: ModelTemplate[] = [
  {
    id: 'crm',
    name: '客户管理 (CRM)',
    description: '管理客户信息、联系人、商机和跟进记录',
    icon: 'TeamOutlined',
    color: '#1890ff',
    entities: [
      {
        name: 'Customer',
        displayName: '客户',
        description: '客户基本信息',
        fields: [
          { name: 'name', displayName: '客户名称', type: 'STRING', required: true },
          { name: 'industry', displayName: '行业', type: 'STRING' },
          { name: 'source', displayName: '来源', type: 'SELECT', options: [{ label: '线上', value: 'online' }, { label: '线下', value: 'offline' }, { label: '推荐', value: 'referral' }] },
          { name: 'phone', displayName: '联系电话', type: 'PHONE' },
          { name: 'email', displayName: '邮箱', type: 'EMAIL' },
          { name: 'address', displayName: '地址', type: 'LOCATION' },
          { name: 'website', displayName: '网站', type: 'URL' },
          { name: 'remark', displayName: '备注', type: 'TEXT' },
        ],
      },
      {
        name: 'Contact',
        displayName: '联系人',
        description: '客户联系人信息',
        fields: [
          { name: 'name', displayName: '联系人姓名', type: 'STRING', required: true },
          { name: 'position', displayName: '职位', type: 'STRING' },
          { name: 'phone', displayName: '手机', type: 'PHONE' },
          { name: 'email', displayName: '邮箱', type: 'EMAIL' },
          { name: 'isPrimary', displayName: '主要联系人', type: 'BOOLEAN' },
          { name: 'remark', displayName: '备注', type: 'TEXT' },
        ],
      },
      {
        name: 'Opportunity',
        displayName: '商机',
        description: '销售商机跟踪',
        fields: [
          { name: 'title', displayName: '商机标题', type: 'STRING', required: true },
          { name: 'amount', displayName: '预计金额', type: 'CURRENCY' },
          { name: 'stage', displayName: '阶段', type: 'SELECT', options: [{ label: '初步接触', value: 'contact' }, { label: '需求分析', value: 'analysis' }, { label: '方案报价', value: 'proposal' }, { label: '商务谈判', value: 'negotiation' }, { label: '赢单', value: 'won' }, { label: '输单', value: 'lost' }] },
          { name: 'probability', displayName: '赢单概率(%)', type: 'NUMBER' },
          { name: 'expectedCloseDate', displayName: '预计成交日期', type: 'DATE' },
          { name: 'remark', displayName: '备注', type: 'TEXT' },
        ],
      },
    ],
  },
  {
    id: 'project',
    name: '项目管理',
    description: '管理项目、任务、团队和进度',
    icon: 'ProjectOutlined',
    color: '#722ed1',
    entities: [
      {
        name: 'Project',
        displayName: '项目',
        description: '项目基本信息',
        fields: [
          { name: 'name', displayName: '项目名称', type: 'STRING', required: true },
          { name: 'description', displayName: '项目描述', type: 'TEXT' },
          { name: 'priority', displayName: '优先级', type: 'SELECT', options: [{ label: '高', value: 'high' }, { label: '中', value: 'medium' }, { label: '低', value: 'low' }] },
          { name: 'status', displayName: '状态', type: 'SELECT', options: [{ label: '未开始', value: 'todo' }, { label: '进行中', value: 'in_progress' }, { label: '已完成', value: 'done' }, { label: '已暂停', value: 'paused' }] },
          { name: 'startDate', displayName: '开始日期', type: 'DATE' },
          { name: 'endDate', displayName: '结束日期', type: 'DATE' },
          { name: 'budget', displayName: '预算', type: 'CURRENCY' },
        ],
      },
      {
        name: 'Task',
        displayName: '任务',
        description: '项目任务',
        fields: [
          { name: 'title', displayName: '任务标题', type: 'STRING', required: true },
          { name: 'description', displayName: '任务描述', type: 'TEXT' },
          { name: 'priority', displayName: '优先级', type: 'SELECT', options: [{ label: '高', value: 'high' }, { label: '中', value: 'medium' }, { label: '低', value: 'low' }] },
          { name: 'status', displayName: '状态', type: 'SELECT', options: [{ label: '待办', value: 'todo' }, { label: '进行中', value: 'in_progress' }, { label: '完成', value: 'done' }] },
          { name: 'estimatedHours', displayName: '预估工时', type: 'NUMBER' },
          { name: 'dueDate', displayName: '截止日期', type: 'DATE' },
          { name: 'sortOrder', displayName: '排序', type: 'NUMBER' },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    name: '进销存管理',
    description: '管理商品、库存、采购和销售',
    icon: 'ShoppingCartOutlined',
    color: '#fa8c16',
    entities: [
      {
        name: 'Product',
        displayName: '商品',
        description: '商品信息',
        fields: [
          { name: 'name', displayName: '商品名称', type: 'STRING', required: true },
          { name: 'sku', displayName: 'SKU编码', type: 'STRING', required: true, unique: true },
          { name: 'category', displayName: '分类', type: 'STRING' },
          { name: 'unitPrice', displayName: '单价', type: 'CURRENCY', required: true },
          { name: 'costPrice', displayName: '成本价', type: 'CURRENCY' },
          { name: 'unit', displayName: '单位', type: 'STRING' },
          { name: 'remark', displayName: '备注', type: 'TEXT' },
        ],
      },
      {
        name: 'Warehouse',
        displayName: '仓库',
        description: '仓库信息',
        fields: [
          { name: 'name', displayName: '仓库名称', type: 'STRING', required: true },
          { name: 'address', displayName: '地址', type: 'LOCATION' },
          { name: 'manager', displayName: '管理员', type: 'STRING' },
          { name: 'remark', displayName: '备注', type: 'TEXT' },
        ],
      },
      {
        name: 'Inventory',
        displayName: '库存',
        description: '商品库存记录',
        fields: [
          { name: 'quantity', displayName: '库存数量', type: 'NUMBER', required: true },
          { name: 'minStock', displayName: '最低库存', type: 'NUMBER' },
          { name: 'maxStock', displayName: '最高库存', type: 'NUMBER' },
          { name: 'location', displayName: '库位', type: 'STRING' },
        ],
      },
      {
        name: 'Order',
        displayName: '订单',
        description: '销售订单',
        fields: [
          { name: 'orderNo', displayName: '订单号', type: 'STRING', required: true, unique: true },
          { name: 'totalAmount', displayName: '总金额', type: 'CURRENCY', required: true },
          { name: 'status', displayName: '状态', type: 'SELECT', options: [{ label: '待付款', value: 'pending' }, { label: '已付款', value: 'paid' }, { label: '已发货', value: 'shipped' }, { label: '已完成', value: 'completed' }, { label: '已取消', value: 'cancelled' }] },
          { name: 'orderDate', displayName: '下单日期', type: 'DATETIME' },
          { name: 'remark', displayName: '备注', type: 'TEXT' },
        ],
      },
    ],
  },
  {
    id: 'content',
    name: '内容管理',
    description: '管理文章、分类、标签和评论',
    icon: 'FileTextOutlined',
    color: '#13c2c2',
    entities: [
      {
        name: 'Article',
        displayName: '文章',
        description: '文章内容',
        fields: [
          { name: 'title', displayName: '标题', type: 'STRING', required: true },
          { name: 'content', displayName: '正文', type: 'TEXT', required: true },
          { name: 'summary', displayName: '摘要', type: 'TEXT' },
          { name: 'coverImage', displayName: '封面图片', type: 'IMAGE' },
          { name: 'status', displayName: '状态', type: 'SELECT', options: [{ label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }, { label: '已归档', value: 'archived' }] },
          { name: 'publishedAt', displayName: '发布时间', type: 'DATETIME' },
          { name: 'viewCount', displayName: '阅读数', type: 'NUMBER' },
        ],
      },
      {
        name: 'Category',
        displayName: '分类',
        description: '文章分类',
        fields: [
          { name: 'name', displayName: '分类名称', type: 'STRING', required: true },
          { name: 'description', displayName: '描述', type: 'TEXT' },
          { name: 'sortOrder', displayName: '排序', type: 'NUMBER' },
        ],
      },
    ],
  },
  {
    id: 'feedback',
    name: '反馈管理',
    description: '收集用户反馈、工单和评价',
    icon: 'MessageOutlined',
    color: '#eb2f96',
    entities: [
      {
        name: 'Feedback',
        displayName: '反馈',
        description: '用户反馈',
        fields: [
          { name: 'title', displayName: '标题', type: 'STRING', required: true },
          { name: 'content', displayName: '反馈内容', type: 'TEXT', required: true },
          { name: 'category', displayName: '分类', type: 'SELECT', options: [{ label: '功能建议', value: 'feature' }, { label: 'Bug报告', value: 'bug' }, { label: '使用问题', value: 'issue' }, { label: '其他', value: 'other' }] },
          { name: 'status', displayName: '状态', type: 'SELECT', options: [{ label: '待处理', value: 'pending' }, { label: '处理中', value: 'processing' }, { label: '已解决', value: 'resolved' }, { label: '已关闭', value: 'closed' }] },
          { name: 'rating', displayName: '满意度评分', type: 'RATING' },
          { name: 'contactEmail', displayName: '联系邮箱', type: 'EMAIL' },
        ],
      },
    ],
  },
];

/** Get template by ID */
export function getTemplateById(id: string): ModelTemplate | undefined {
  return MODEL_TEMPLATES.find((t) => t.id === id);
}

import {
  FontSizeOutlined, FileTextOutlined, NumberOutlined,
  CheckSquareOutlined, CalendarOutlined, ClockCircleOutlined,
  MailOutlined, PhoneOutlined, LinkOutlined,
  DownSquareOutlined, OrderedListOutlined,
  FileOutlined, PictureOutlined, CodeOutlined,
  ShareAltOutlined, DollarOutlined, EnvironmentOutlined,
  StarOutlined, BgColorsOutlined,
} from '@ant-design/icons';

/** Field type configuration with icon, color, description, and recommendations */
export interface FieldTypeConfig {
  value: string;
  label: string;
  icon: React.ComponentType;
  color: string;
  description: string;
  example: string;
  defaultRequired: boolean;
  /** Field names that suggest this type (lowercase) */
  suggestNames: string[];
}

export const FIELD_TYPE_CONFIGS: FieldTypeConfig[] = [
  {
    value: 'STRING',
    label: '单行文本',
    icon: FontSizeOutlined,
    color: '#1890ff',
    description: '较短的文本内容，如姓名、标题、标签',
    example: '张三, 产品经理',
    defaultRequired: false,
    suggestNames: ['name', 'title', 'subject', 'tag', 'label', 'category', 'status', 'city', 'country', 'language', 'gender', 'nickname', 'username'],
  },
  {
    value: 'TEXT',
    label: '多行文本',
    icon: FileTextOutlined,
    color: '#722ed1',
    description: '较长的文本内容，如描述、备注、正文',
    example: '这是一段详细的描述...',
    defaultRequired: false,
    suggestNames: ['description', 'desc', 'content', 'remark', 'note', 'comment', 'bio', 'summary', 'detail', 'body', 'message'],
  },
  {
    value: 'NUMBER',
    label: '数字',
    icon: NumberOutlined,
    color: '#fa8c16',
    description: '整数或小数，如价格、年龄、数量',
    example: '100, 3.14',
    defaultRequired: false,
    suggestNames: ['price', 'count', 'quantity', 'amount', 'age', 'score', 'number', 'total', 'size', 'weight', 'height', 'length', 'width', 'volume', 'year', 'duration', 'rate', 'percent', 'discount'],
  },
  {
    value: 'BOOLEAN',
    label: '布尔值',
    icon: CheckSquareOutlined,
    color: '#52c41a',
    description: '是/否、真/假，如是否启用、是否完成',
    example: '是 / 否',
    defaultRequired: false,
    suggestNames: ['isactive', 'isenabled', 'isdeleted', 'isverified', 'iscompleted', 'isdone', 'ispublished', 'isenable', 'enabled', 'active', 'published', 'verified', 'completed', 'done', 'locked', 'hasfile', 'hasimage'],
  },
  {
    value: 'DATE',
    label: '日期',
    icon: CalendarOutlined,
    color: '#eb2f96',
    description: '日期值，如出生日期、创建日期',
    example: '2024-01-15',
    defaultRequired: false,
    suggestNames: ['date', 'birthdate', 'birthday', 'startdate', 'enddate', 'duedate', 'expirydate', 'createdate', 'deletedate'],
  },
  {
    value: 'DATETIME',
    label: '日期时间',
    icon: ClockCircleOutlined,
    color: '#13c2c2',
    description: '精确到秒的日期时间，如创建时间、更新时间',
    example: '2024-01-15 14:30:00',
    defaultRequired: false,
    suggestNames: ['createdat', 'updatedat', 'deletedat', 'datetime', 'timestamp', 'starttime', 'endtime', 'lastlogin', 'publishtime', 'scheduledat'],
  },
  {
    value: 'EMAIL',
    label: '邮箱',
    icon: MailOutlined,
    color: '#f5222d',
    description: '电子邮箱地址，自动校验格式',
    example: 'user@example.com',
    defaultRequired: false,
    suggestNames: ['email', 'mail', 'e_mail'],
  },
  {
    value: 'PHONE',
    label: '电话',
    icon: PhoneOutlined,
    color: '#fa541c',
    description: '电话号码，支持手机号和座机',
    example: '13800138000',
    defaultRequired: false,
    suggestNames: ['phone', 'mobile', 'telephone', 'tel', 'cellphone', 'cell', 'contact'],
  },
  {
    value: 'URL',
    label: '链接',
    icon: LinkOutlined,
    color: '#2f54eb',
    description: '网页链接或URL地址，自动校验格式',
    example: 'https://example.com',
    defaultRequired: false,
    suggestNames: ['url', 'link', 'website', 'site', 'homepage', 'avatarurl', 'imageurl', 'fileurl', 'weburl', 'redirecturl'],
  },
  {
    value: 'SELECT',
    label: '下拉选择',
    icon: DownSquareOutlined,
    color: '#faad14',
    description: '从预设选项中选择一个值',
    example: '选项A / 选项B',
    defaultRequired: false,
    suggestNames: ['status', 'type', 'priority', 'level', 'grade', 'role', 'mode', 'state'],
  },
  {
    value: 'MULTI_SELECT',
    label: '多选',
    icon: OrderedListOutlined,
    color: '#a0d911',
    description: '从预设选项中选择多个值',
    example: '选项A, 选项B',
    defaultRequired: false,
    suggestNames: ['tags', 'labels', 'categories', 'skills', 'hobbies', 'interests'],
  },
  {
    value: 'FILE',
    label: '文件',
    icon: FileOutlined,
    color: '#595959',
    description: '文件附件上传',
    example: 'document.pdf',
    defaultRequired: false,
    suggestNames: ['file', 'attachment', 'document', 'upload', 'resume'],
  },
  {
    value: 'IMAGE',
    label: '图片',
    icon: PictureOutlined,
    color: '#eb2f96',
    description: '图片上传',
    example: 'photo.jpg',
    defaultRequired: false,
    suggestNames: ['image', 'photo', 'picture', 'avatar', 'icon', 'logo', 'cover', 'thumbnail', 'img', 'banner'],
  },
  {
    value: 'JSON',
    label: 'JSON',
    icon: CodeOutlined,
    color: '#666666',
    description: 'JSON 结构化数据',
    example: '{"key": "value"}',
    defaultRequired: false,
    suggestNames: ['config', 'configuration', 'settings', 'metadata', 'properties', 'attributes', 'extras', 'data', 'payload', 'options'],
  },
  {
    value: 'CURRENCY',
    label: '金额',
    icon: DollarOutlined,
    color: '#52c41a',
    description: '货币金额，支持分位精度',
    example: '¥99.99',
    defaultRequired: false,
    suggestNames: ['price', 'cost', 'fee', 'salary', 'income', 'expense', 'budget', 'revenue', 'profit', 'payment', 'charge', 'fine', 'deposit', 'refund', 'commission', 'wage', 'money'],
  },
  {
    value: 'LOCATION',
    label: '地理位置',
    icon: EnvironmentOutlined,
    color: '#13c2c2',
    description: '经纬度坐标或地址',
    example: '39.9042, 116.4074',
    defaultRequired: false,
    suggestNames: ['address', 'location', 'latitude', 'longitude', 'lat', 'lng', 'coordinates', 'place', 'position', 'venue', 'site', 'region', 'district'],
  },
  {
    value: 'RATING',
    label: '评分',
    icon: StarOutlined,
    color: '#faad14',
    description: '星级评分，1-5星',
    example: '★★★★☆',
    defaultRequired: false,
    suggestNames: ['rating', 'star', 'stars', 'reviewscore', 'score', 'grade', 'rank', 'level', 'rate'],
  },
  {
    value: 'COLOR',
    label: '颜色',
    icon: BgColorsOutlined,
    color: '#eb2f96',
    description: '颜色值，支持十六进制和颜色名',
    example: '#FF0000, red',
    defaultRequired: false,
    suggestNames: ['color', 'colour', 'bgcolor', 'backgroundcolor', 'textcolor', 'themecolor', 'hex', 'rgb'],
  },
  {
    value: 'RELATION',
    label: '表关联',
    icon: ShareAltOutlined,
    color: '#1890ff',
    description: '关联其他数据实体的记录',
    example: '关联用户 / 关联订单',
    defaultRequired: false,
    suggestNames: ['id', '_id', 'ref', 'reference'],
  },
];

/** Get field type config by value */
export function getFieldTypeConfig(type: string): FieldTypeConfig | undefined {
  return FIELD_TYPE_CONFIGS.find((c) => c.value === type);
}

/** Recommend field type based on field name */
export function recommendFieldType(name: string): string {
  const lower = name.replace(/[\s_-]/g, '').toLowerCase();

  // Exact match on field name patterns
  for (const config of FIELD_TYPE_CONFIGS) {
    if (config.suggestNames.includes(lower)) {
      return config.value;
    }
  }

  // Partial match: check if name contains any suggested pattern
  for (const config of FIELD_TYPE_CONFIGS) {
    for (const pattern of config.suggestNames) {
      if (lower.includes(pattern) || pattern.includes(lower)) {
        return config.value;
      }
    }
  }

  // Default to STRING
  return 'STRING';
}

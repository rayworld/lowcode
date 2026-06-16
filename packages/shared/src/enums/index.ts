export enum FieldType {
  STRING = 'STRING',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  JSON = 'JSON',
  RELATION = 'RELATION',
}

export enum ComponentCategory {
  LAYOUT = 'LAYOUT',
  FORM = 'FORM',
  DISPLAY = 'DISPLAY',
  DATA = 'DATA',
  FEEDBACK = 'FEEDBACK',
  NAVIGATION = 'NAVIGATION',
}

export enum WorkflowTriggerType {
  FORM_SUBMIT = 'FORM_SUBMIT',
  DATA_CHANGE = 'DATA_CHANGE',
  SCHEDULE = 'SCHEDULE',
  WEBHOOK = 'WEBHOOK',
  MANUAL = 'MANUAL',
}

export enum WorkflowStepType {
  CONDITION = 'CONDITION',
  DATA_OPERATION = 'DATA_OPERATION',
  NOTIFICATION = 'NOTIFICATION',
  API_CALL = 'API_CALL',
  DELAY = 'DELAY',
  APPROVAL = 'APPROVAL',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum AppStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export enum RelationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_MANY = 'MANY_TO_MANY',
}

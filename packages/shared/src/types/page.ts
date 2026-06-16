import { PageStatus } from '../enums';

export interface Page {
  id: string;
  appId: string;
  title: string;
  route: string;
  schema: PageSchema;
  status: PageStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageSchema {
  root: ComponentNode;
  variables?: PageVariable[];
  events?: PageEvent[];
}

export interface ComponentNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: ComponentNode[];
  events?: ComponentEvent[];
  style?: Record<string, unknown>;
}

export interface PageVariable {
  name: string;
  type: string;
  defaultValue?: unknown;
}

export interface PageEvent {
  name: string;
  handler: string;
}

export interface ComponentEvent {
  trigger: string;
  action: string;
  config?: Record<string, unknown>;
}

export interface CreatePageDto {
  appId: string;
  title: string;
  route: string;
  schema?: PageSchema;
}

export interface UpdatePageDto {
  title?: string;
  route?: string;
  schema?: PageSchema;
  status?: PageStatus;
}

import { ComponentCategory } from '../enums';

export interface ComponentDefinition {
  id: string;
  name: string;
  title: string;
  category: ComponentCategory;
  icon: string;
  props: ComponentPropDef[];
  defaultProps?: Record<string, unknown>;
  events?: string[];
  version: string;
}

export interface ComponentPropDef {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'color' | 'expression';
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  description?: string;
}

export interface ComponentRegistry {
  components: ComponentDefinition[];
}

export interface CreateEntityDto {
  name: string;
  displayName?: string;
  description?: string;
  fields?: CreateFieldDto[];
}

export interface UpdateEntityDto {
  displayName?: string;
  description?: string;
}

export interface CreateFieldDto {
  name: string;
  displayName?: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  unique?: boolean;
  isList?: boolean;
  options?: { label: string; value: string }[];
  relationTo?: string;
  relationType?: string;
}

export interface UpdateFieldDto {
  displayName?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  ArrayMaxSize,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType, RelationType } from '@lowcode/shared';

// ─── 字段选项 ───────────────────────────────────────────────
export class FieldOptionDto {
  @IsString()
  label: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  color?: string;
}

// ─── 创建字段 ───────────────────────────────────────────────
export class CreateFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, { message: '字段标识只能包含字母、数字和下划线，以字母开头' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsString()
  @IsEnum(FieldType, { message: '无效的字段类型: $value' })
  type: string;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @IsOptional()
  @IsBoolean()
  isList?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldOptionDto)
  @ArrayMaxSize(100)
  options?: FieldOptionDto[];

  @IsOptional()
  @IsString()
  relationTo?: string;

  @IsOptional()
  @IsString()
  @IsEnum(RelationType, { message: '无效的关联类型: $value' })
  relationType?: string;
}

// ─── 更新字段 ──────────────────────────────────────────────
export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @IsEnum(FieldType, { message: '无效的字段类型: $value' })
  type?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

// ─── 创建实体 ───────────────────────────────────────────────
export class CreateEntityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, { message: '实体标识只能包含字母、数字和下划线，以字母开头' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  @ArrayMaxSize(200)
  fields?: CreateFieldDto[];
}

// ─── 更新实体 ───────────────────────────────────────────────
export class UpdateEntityDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// ─── 创建记录 ───────────────────────────────────────────────
export class CreateRecordDto {
  @IsObject()
  data: Record<string, unknown>;
}

// ─── 更新记录 ───────────────────────────────────────────────
export class UpdateRecordDto {
  @IsObject()
  data: Record<string, unknown>;
}

// ─── 字段排序 ───────────────────────────────────────────────
export class ReorderFieldsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  fieldIds: string[];
}

// ─── 版本快照 ───────────────────────────────────────────────
export class CreateSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string;
}

// ─── 版本对比 ───────────────────────────────────────────────
export class CompareVersionsDto {
  fromVersion: number;
  toVersion: number;
}

// ─── 模型导入 ───────────────────────────────────────────────
export class ImportModelDto {
  entities: any[];

  @IsOptional()
  @IsString()
  conflictStrategy?: 'skip' | 'overwrite' | 'rename';
}

// ─── 克隆实体 ───────────────────────────────────────────────
export class CloneEntityDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, { message: '实体标识只能包含字母、数字和下划线，以字母开头' })
  name?: string;
}

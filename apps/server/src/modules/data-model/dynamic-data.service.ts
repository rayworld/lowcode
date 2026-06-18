import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { DataPermissionService } from './data-permission.service';
import { DefaultValueEngine } from './default-value.engine';

@Injectable()
export class DynamicDataService {
  private defaultValues = new DefaultValueEngine();

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private dataPermission: DataPermissionService,
  ) {}

  async findRecords(
    entityId: string,
    page = 1,
    pageSize = 20,
    options?: {
      sort?: string;       // "fieldName:asc" or "fieldName:desc"
      filter?: string;     // JSON string of { fieldName: value, ... }
      q?: string;          // full-text search
      query?: string;      // JSON structured query with AND/OR groups
      cursor?: string;     // cursor-based pagination: record ID to start after
      limit?: number;      // limit for cursor-based pagination
      userId?: string;     // for row-level permission filtering
    },
  ) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Build Prisma where condition
    const where: any = { entityId };
    const andConditions: any[] = [];

    // Apply row-level permissions
    if (options?.userId) {
      const rowFilters = await this.dataPermission.buildRowFilter(options.userId, entity.appId, 'DataRecord');
      if (rowFilters && rowFilters.length > 0) {
        for (const rf of rowFilters) {
          andConditions.push(rf);
        }
      }
    }

    // Apply field-level filters
    if (options?.filter) {
      try {
        const filterObj = JSON.parse(options.filter);
        for (const [key, val] of Object.entries(filterObj)) {
          if (val !== undefined && val !== null && val !== '') {
            andConditions.push({
              data: { path: [key], equals: val },
            });
          }
        }
      } catch { /* ignore invalid filter JSON */ }
    }

    // Apply full-text search across all JSONB data
    if (options?.q && options.q.trim()) {
      andConditions.push({
        data: { string_contains: options.q.trim() },
      });
    }

    // Apply structured query with AND/OR groups
    if (options?.query) {
      try {
        const queryObj = JSON.parse(options.query);
        const parsed = this.parseStructuredQuery(queryObj);
        if (parsed) {
          andConditions.push(parsed);
        }
      } catch { /* ignore invalid query JSON */ }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Build Prisma orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (options?.sort) {
      const [fieldName, direction] = options.sort.split(':');
      if (fieldName && direction) {
        const fieldDef = entity.fields.find((f) => f.name === fieldName);
        if (fieldDef) {
          orderBy = {
            data: {
              path: [fieldName],
              order: direction === 'asc' ? 'asc' : 'desc',
            },
          };
        }
      }
    }

    // Cursor-based pagination (for deep pages)
    const useCursor = options?.cursor !== undefined;
    const effectiveLimit = options?.limit || pageSize;

    let records: any[];
    let total: number;

    if (useCursor) {
      // Validate cursor record exists
      const cursorRecord = await this.prisma.dataRecord.findFirst({
        where: { id: options.cursor, entityId },
        select: { id: true },
      });
      if (!cursorRecord) throw new NotFoundException('游标记录不存在');

      [records, total] = await Promise.all([
        this.prisma.dataRecord.findMany({
          where,
          take: effectiveLimit,
          skip: 1, // skip the cursor itself
          cursor: { id: options.cursor },
          orderBy,
        }),
        this.prisma.dataRecord.count({ where }),
      ]);
    } else {
      // Offset-based pagination (for early pages)
      const skip = (page - 1) * pageSize;
      [records, total] = await Promise.all([
        this.prisma.dataRecord.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
        }),
        this.prisma.dataRecord.count({ where }),
      ]);
    }

    const relationFields = entity.fields.filter((f) => f.type === 'RELATION' && f.relationTo);
    const resolvedRecords = await this.resolveRelationFields(records, relationFields, entity.appId);

    const items = resolvedRecords.map((r) => {
      const rawData = (r.data as Record<string, unknown>) ?? {};
      const filledData = this.fillMissingFields(rawData, entity.fields);
      return {
        id: r.id,
        ...filledData,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    const result: any = { items, total, page, pageSize };

    // For cursor-based pagination, return next cursor
    if (useCursor && records.length > 0) {
      result.nextCursor = records[records.length - 1].id;
      result.hasMore = records.length === effectiveLimit;
    }

    return result;
  }

  async findRecordById(entityId: string, recordId: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    const record = await this.prisma.dataRecord.findFirst({
      where: { id: recordId, entityId },
    });
    if (!record) throw new NotFoundException('数据记录不存在');

    const relationFields = entity.fields.filter((f) => f.type === 'RELATION' && f.relationTo);
    const resolvedRecords = await this.resolveRelationFields([record], relationFields, entity.appId);
    const resolved = resolvedRecords[0];

    const rawData = (resolved.data as Record<string, unknown>) ?? {};
    const filledData = this.fillMissingFields(rawData, entity.fields);

    return {
      id: resolved.id,
      ...filledData,
      createdAt: resolved.createdAt,
      updatedAt: resolved.updatedAt,
    };
  }

  async createRecord(entityId: string, data: Record<string, unknown>, userId?: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Resolve dynamic default values before validation
    const resolvedData = this.defaultValues.resolveRecordDefaults(entity.fields, data, {
      userId,
      entityId,
    });

    // Validate required fields
    for (const field of entity.fields) {
      const value = resolvedData[field.name];
      if (field.required && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`字段 "${field.displayName}" 是必填的`);
      }
    }

    // Type validation
    for (const field of entity.fields) {
      const value = resolvedData[field.name];
      if (value !== undefined && value !== null && value !== '') {
        this.validateFieldValue(field, value);
      }
    }

    // Unique constraint check
    for (const field of entity.fields) {
      if (field.unique && resolvedData[field.name] !== undefined && resolvedData[field.name] !== null) {
        await this.checkUniqueConstraint(entityId, field, resolvedData[field.name]);
      }
    }

    const record = await this.prisma.dataRecord.create({
      data: {
        entityId,
        data: resolvedData as any,
      },
    });

    return {
      id: record.id,
      ...(record.data as Record<string, unknown>),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateRecord(entityId: string, recordId: string, data: Record<string, unknown>) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    await this.findRecordById(entityId, recordId);

    // Type validation on updated fields
    for (const field of entity.fields) {
      if (data[field.name] !== undefined && data[field.name] !== null) {
        this.validateFieldValue(field, data[field.name]);
      }
    }

    // Unique constraint check on updated fields
    for (const field of entity.fields) {
      if (field.unique && data[field.name] !== undefined && data[field.name] !== null) {
        await this.checkUniqueConstraint(entityId, field, data[field.name], recordId);
      }
    }

    const record = await this.prisma.dataRecord.update({
      where: { id: recordId },
      data: { data: data as any },
    });

    return {
      id: record.id,
      ...(record.data as Record<string, unknown>),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async deleteRecord(entityId: string, recordId: string) {
    await this.findRecordById(entityId, recordId);
    await this.prisma.dataRecord.delete({ where: { id: recordId } });
    return { deleted: true };
  }

  async exportRecords(entityId: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    const records = await this.prisma.dataRecord.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });

    const relationFields = entity.fields.filter((f) => f.type === 'RELATION' && f.relationTo);
    const resolvedRecords = await this.resolveRelationFields(records, relationFields, entity.appId);

    const items = resolvedRecords.map((r) => {
      const rawData = (r.data as Record<string, unknown>) ?? {};
      const filledData = this.fillMissingFields(rawData, entity.fields);
      return {
        id: r.id,
        ...filledData,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return { items, entity };
  }

  // ==================== Relation Resolution ====================

  private async resolveRelationFields(
    records: { id: string; entityId: string; data: any; createdAt: Date; updatedAt: Date }[],
    relationFields: { name: string; relationTo: string | null }[],
    appId: string,
  ): Promise<typeof records> {
    if (relationFields.length === 0 || records.length === 0) return records;

    // Build a map: targetEntityName -> set of referenced IDs
    const refMap = new Map<string, Set<string>>();
    for (const field of relationFields) {
      if (!field.relationTo) continue;
      if (!refMap.has(field.relationTo)) refMap.set(field.relationTo, new Set());
      const ids = refMap.get(field.relationTo)!;
      for (const record of records) {
        const val = (record.data as any)?.[field.name];
        if (val !== undefined && val !== null) {
          ids.add(String(val));
        }
      }
    }

    if (refMap.size === 0) return records;

    // Batch resolve: for each target entity, fetch matching records
    const resolvedData = new Map<string, Map<string, { id: string; displayName: string }>>();
    for (const [entityName, idSet] of refMap.entries()) {
      if (idSet.size === 0) continue;
      const targetEntity = await this.prisma.dataEntity.findFirst({
        where: { appId, name: entityName },
        include: { fields: { where: { type: 'STRING' }, take: 1, orderBy: { order: 'asc' } } },
      });
      if (!targetEntity) continue;

      const idArr = Array.from(idSet);
      // We can only look up by DataRecord.id directly
      const refRecords = await this.prisma.dataRecord.findMany({
        where: { entityId: targetEntity.id, id: { in: idArr } },
        select: { id: true, data: true },
      });

      // Use the first STRING field's value as display name, or fallback to id
      const displayField = targetEntity.fields[0]?.name || null;
      const map = new Map<string, { id: string; displayName: string }>();
      for (const ref of refRecords) {
        const refData = ref.data as Record<string, unknown> ?? {};
        const displayName = displayField ? String(refData[displayField] ?? ref.id) : ref.id;
        map.set(ref.id, { id: ref.id, displayName });
      }
      resolvedData.set(entityName, map);
    }

    // Replace raw IDs with resolved objects
    return records.map((record) => {
      const rawData = (record.data as Record<string, unknown>) ?? {};
      const newData = { ...rawData };
      for (const field of relationFields) {
        if (!field.relationTo) continue;
        const map = resolvedData.get(field.relationTo);
        if (!map) continue;
        const rawId = String(newData[field.name] ?? '');
        if (rawId && map.has(rawId)) {
          newData[field.name] = map.get(rawId)!;
        }
      }
      return { ...record, data: newData };
    });
  }

  // ==================== Schema Completion ====================

  private fillMissingFields(
    data: Record<string, unknown>,
    fields: { name: string; defaultValue: string | null }[],
  ): Record<string, unknown> {
    const result = { ...data };
    for (const field of fields) {
      if (result[field.name] === undefined || result[field.name] === null) {
        if (field.defaultValue !== null && field.defaultValue !== undefined) {
          result[field.name] = field.defaultValue;
        }
      }
    }
    return result;
  }

  // ==================== Type Validation ====================

  private validateFieldValue(field: { name: string; displayName: string; type: string }, value: unknown): void {
    const displayName = field.displayName || field.name;
    switch (field.type) {
      case 'NUMBER': {
        if (typeof value === 'string' && value.trim() === '') break;
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(`字段 "${displayName}" 必须是数字`);
        }
        break;
      }
      case 'EMAIL': {
        const str = String(value);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
          throw new BadRequestException(`字段 "${displayName}" 不是有效的邮箱地址`);
        }
        break;
      }
      case 'URL': {
        const str = String(value);
        try {
          new URL(str);
        } catch {
          throw new BadRequestException(`字段 "${displayName}" 不是有效的URL地址`);
        }
        break;
      }
      case 'PHONE': {
        const str = String(value).replace(/[\s-]/g, '');
        if (!/^\+?[\d]{7,15}$/.test(str)) {
          throw new BadRequestException(`字段 "${displayName}" 不是有效的电话号码`);
        }
        break;
      }
      case 'BOOLEAN': {
        if (typeof value !== 'boolean' && !['true', 'false', '0', '1'].includes(String(value))) {
          throw new BadRequestException(`字段 "${displayName}" 必须是布尔值`);
        }
        break;
      }
      case 'DATE': {
        const str = String(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || isNaN(Date.parse(str))) {
          throw new BadRequestException(`字段 "${displayName}" 不是有效的日期格式 (YYYY-MM-DD)`);
        }
        break;
      }
      case 'DATETIME': {
        const str = String(value);
        if (isNaN(Date.parse(str))) {
          throw new BadRequestException(`字段 "${displayName}" 不是有效的日期时间格式`);
        }
        break;
      }
      case 'CURRENCY': {
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          throw new BadRequestException(`字段 "${displayName}" 必须是正数金额`);
        }
        break;
      }
      case 'LOCATION': {
        const str = String(value);
        if (typeof value !== 'string' || !str.includes(',')) {
          throw new BadRequestException(`字段 "${displayName}" 必须是 "纬度,经度" 格式`);
        }
        const [lat, lng] = str.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new BadRequestException(`字段 "${displayName}" 的经纬度值超出有效范围`);
        }
        break;
      }
      case 'RATING': {
        const rating = Number(value);
        if (isNaN(rating) || rating < 0.5 || rating > 5) {
          throw new BadRequestException(`字段 "${displayName}" 必须是 0.5 到 5 之间的评分值`);
        }
        break;
      }
      case 'COLOR': {
        const str = String(value);
        if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str) && !/^[a-z]+$/.test(str)) {
          throw new BadRequestException(`字段 "${displayName}" 不是有效的颜色值 (如 #FF0000 或 red)`);
        }
        break;
      }
    }
  }

  // ==================== Structured Query Parser ====================

  private parseStructuredQuery(query: any): any {
    if (!query || typeof query !== 'object') return null;

    // If it's a simple condition (has field + operator)
    if (query.field && query.operator) {
      return this.buildFieldCondition(query.field, query.operator, query.value);
    }

    // If it's a group (has logic + conditions)
    if (query.logic && Array.isArray(query.conditions)) {
      const children = query.conditions
        .map((c: any) => this.parseStructuredQuery(c))
        .filter(Boolean);

      if (children.length === 0) return null;
      if (children.length === 1) return children[0];

      return query.logic === 'OR' ? { OR: children } : { AND: children };
    }

    return null;
  }

  private buildFieldCondition(field: string, operator: string, value: unknown): any {
    // Skip empty values
    if (value === undefined || value === null || value === '') return null;

    const dataPath = { path: [field] };

    switch (operator) {
      case 'eq':
        return { data: { ...dataPath, equals: value } };
      case 'neq':
        return { NOT: { data: { ...dataPath, equals: value } } };
      case 'contains':
        return { data: { ...dataPath, string_contains: String(value) } };
      case 'startsWith':
        return { data: { ...dataPath, string_starts_with: String(value) } };
      case 'endsWith':
        return { data: { ...dataPath, string_ends_with: String(value) } };
      case 'gt':
        return { data: { ...dataPath, gt: Number(value) } };
      case 'gte':
        return { data: { ...dataPath, gte: Number(value) } };
      case 'lt':
        return { data: { ...dataPath, lt: Number(value) } };
      case 'lte':
        return { data: { ...dataPath, lte: Number(value) } };
      case 'in':
        if (Array.isArray(value)) {
          return { data: { ...dataPath, in: value } };
        }
        return null;
      case 'isNull':
        return { data: { ...dataPath, equals: null } };
      case 'isNotNull':
        return { NOT: { data: { ...dataPath, equals: null } } };
      default:
        return { data: { ...dataPath, equals: value } };
    }
  }

  // ==================== Unique Constraint ====================

  private async checkUniqueConstraint(
    entityId: string,
    field: { name: string; displayName: string },
    value: unknown,
    excludeRecordId?: string,
  ): Promise<void> {
    const where: any = {
      entityId,
      data: {
        path: [field.name],
        equals: value,
      },
    };

    const existing = await this.prisma.dataRecord.findFirst({
      where,
      select: { id: true },
    });

    if (existing && existing.id !== excludeRecordId) {
      throw new BadRequestException(
        `字段 "${field.displayName}" 的值 "${value}" 已被占用，请使用其他值`,
      );
    }
  }
}

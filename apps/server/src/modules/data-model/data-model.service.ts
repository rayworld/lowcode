import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { ModelVersionService } from './model-version.service';
import { DataPermissionService } from './data-permission.service';
import { canConvertType, transformFieldValue } from './field-type-matrix';
import { CreateEntityDto, UpdateEntityDto, CreateFieldDto, UpdateFieldDto } from './dto';
import { EntityRelationGraph, EntityNodeData, EntityRelationEdge } from '@lowcode/shared';

@Injectable()
export class DataModelService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private versionService: ModelVersionService,
    private dataPermission: DataPermissionService,
  ) {}

  // ========== Entities ==========
  async findEntities(appId: string) {
    const cacheKey = this.cache.appKey(appId, 'entities');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const entities = await this.prisma.dataEntity.findMany({
      where: { appId },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { records: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    await this.cache.set(cacheKey, entities, 300);
    return entities;
  }

  async findEntityById(id: string, userId?: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { records: true } },
      },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Apply field-level permission filtering
    if (userId) {
      const accessibleFields = await this.dataPermission.getReadableFields(userId, entity.appId, id);
      if (accessibleFields) {
        entity.fields = entity.fields.filter((f) => accessibleFields.includes(f.name));
      }
    }

    return entity;
  }

  async createEntity(appId: string, dto: CreateEntityDto) {
    const tableName = this.toTableName(dto.name);

    const entity = await this.prisma.dataEntity.create({
      data: {
        appId,
        name: dto.name,
        displayName: dto.displayName || dto.name,
        tableName,
        description: dto.description,
        fields: dto.fields
          ? {
              create: dto.fields.map((f, i) => ({
                name: f.name,
                displayName: f.displayName || f.name,
                type: f.type,
                defaultValue: f.defaultValue,
                required: f.required || false,
                unique: f.unique || false,
                isList: f.isList || false,
                options: f.options || undefined,
                relationTo: f.relationTo,
                relationType: f.relationType,
                order: i,
              })),
            }
          : undefined,
      },
      include: { fields: true },
    });

    // Take initial snapshot
    await this.versionService.takeSnapshot(entity.id, '初始版本').catch(() => {});

    await this.cache.del(this.cache.appKey(appId, 'entities'));
    return entity;
  }

  async updateEntity(id: string, dto: UpdateEntityDto) {
    const entity = await this.findEntityById(id);
    // Take snapshot before update
    await this.versionService.takeSnapshot(id, `更新前: ${JSON.stringify(dto)}`).catch(() => {});
    const updated = await this.prisma.dataEntity.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        description: dto.description,
      },
    });
    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return updated;
  }

  async removeEntity(id: string) {
    const entity = await this.findEntityById(id);

    // Check if any other entity references this one via relationTo
    const referencingFields = await this.prisma.field.findMany({
      where: { relationTo: entity.name },
      include: {
        entity: { select: { id: true, displayName: true, appId: true } },
      },
    });

    // Filter to only include fields in the same app (cross-app references are not allowed)
    const sameAppRefs = referencingFields.filter((f) => f.entity.appId === entity.appId);

    if (sameAppRefs.length > 0) {
      const refs = sameAppRefs.map(
        (f) => `"${f.entity.displayName}" 的 "${f.displayName}" 字段`,
      );
      throw new BadRequestException(
        `无法删除数据实体 "${entity.displayName}"，以下字段引用了此实体：${refs.join('、')}。请先删除这些关联字段后再试。`,
      );
    }

    await this.prisma.dataEntity.delete({ where: { id } });
    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return { deleted: true, message: `数据实体 "${entity.displayName}" 已删除` };
  }

  // ========== Fields ==========
  async findFieldById(id: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('字段不存在');
    return field;
  }

  async addField(entityId: string, dto: CreateFieldDto) {
    const entity = await this.findEntityById(entityId);
    const maxOrder = entity.fields.reduce((max, f) => Math.max(max, f.order), -1);

    // Validate relation config
    if (dto.relationTo && !dto.relationType) {
      throw new BadRequestException('关联类型不能为空');
    }

    // For relation fields, verify target entity exists
    let targetEntity: any = null;
    if (dto.relationTo) {
      targetEntity = await this.prisma.dataEntity.findFirst({
        where: { appId: entity.appId, name: dto.relationTo },
      });
      if (!targetEntity) {
        throw new BadRequestException(`目标实体 "${dto.relationTo}" 不存在`);
      }
    }

    const field = await this.prisma.field.create({
      data: {
        entityId,
        name: dto.name,
        displayName: dto.displayName || dto.name,
        type: dto.type,
        defaultValue: dto.defaultValue,
        required: dto.required || false,
        unique: dto.unique || false,
        isList: dto.isList || false,
        options: dto.options || undefined,
        relationTo: dto.relationTo,
        relationType: dto.relationType,
        order: maxOrder + 1,
      },
    });

    // Auto-generate junction table for MANY_TO_MANY
    if (dto.relationType === 'MANY_TO_MANY' && targetEntity) {
      await this.createJunctionEntity(entity, targetEntity, field);
    }

    // Take snapshot after field addition
    await this.versionService.takeSnapshot(entityId, `添加字段 "${field.displayName}"`).catch(() => {});

    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return field;
  }

  private async createJunctionEntity(
    sourceEntity: any,
    targetEntity: any,
    relationField: any,
  ) {
    const appId = sourceEntity.appId;
    const junctionName = `${sourceEntity.name}_${targetEntity.name}`;
    const tableName = this.toTableName(junctionName);

    // Check if junction already exists
    const existing = await this.prisma.dataEntity.findFirst({
      where: { appId, name: junctionName },
    });
    if (existing) return; // already created

    const junction = await this.prisma.dataEntity.create({
      data: {
        appId,
        name: junctionName,
        displayName: `${sourceEntity.displayName}${targetEntity.displayName}关联`,
        tableName,
        description: `"${sourceEntity.displayName}" 与 "${targetEntity.displayName}" 的多对多关联表`,
        fields: {
          create: [
            {
              name: `${sourceEntity.name}Id`,
              displayName: sourceEntity.displayName,
              type: 'RELATION',
              relationTo: sourceEntity.name,
              relationType: 'ONE_TO_MANY',
              required: true,
              order: 0,
            },
            {
              name: `${targetEntity.name}Id`,
              displayName: targetEntity.displayName,
              type: 'RELATION',
              relationTo: targetEntity.name,
              relationType: 'ONE_TO_MANY',
              required: true,
              order: 1,
            },
          ],
        },
      },
    });

    return junction;
  }

  async updateField(id: string, dto: UpdateFieldDto) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('字段不存在');

    // Take snapshot before update
    await this.versionService.takeSnapshot(field.entityId, `更新字段 "${field.displayName}"`).catch(() => {});

    // Handle type change with data migration
    let dataTransform: ((val: unknown) => unknown) | null = null;
    if (dto.type && dto.type !== field.type) {
      const conversion = canConvertType(field.type, dto.type);
      if (!conversion.allowed) {
        throw new BadRequestException(
          `字段类型不能从 ${field.type} 转换为 ${dto.type}：${conversion.description || '不兼容的类型转换'}`,
        );
      }
      dataTransform = (val: unknown) => transformFieldValue(field.type, dto.type!, val);
    }

    const updateData: any = {
      displayName: dto.displayName,
      required: dto.required,
      defaultValue: dto.defaultValue,
      options: dto.options !== undefined ? (dto.options || undefined) : undefined,
    };

    if (dto.type) {
      updateData.type = dto.type;
    }

    const updated = await this.prisma.field.update({
      where: { id },
      data: updateData,
    });

    // Transform existing data if type changed
    if (dataTransform) {
      const records = await this.prisma.dataRecord.findMany({
        where: { entityId: field.entityId },
        select: { id: true, data: true },
      });
      for (const record of records) {
        const data = (record.data as Record<string, unknown>) ?? {};
        if (data[field.name] !== undefined && data[field.name] !== null) {
          data[field.name] = dataTransform(data[field.name]);
          await this.prisma.dataRecord.update({
            where: { id: record.id },
            data: { data: data as any },
          });
        }
      }
    }

    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: field.entityId },
    });
    if (entity) await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return updated;
  }

  async removeField(id: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('字段不存在');

    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: field.entityId },
    });
    if (!entity) throw new NotFoundException('所属实体不存在');

    // Take snapshot before removal
    await this.versionService.takeSnapshot(field.entityId, `删除字段 "${field.displayName}"`).catch(() => {});

    await this.prisma.field.delete({ where: { id } });

    // Re-index remaining fields to maintain sequential order
    const remainingFields = await this.prisma.field.findMany({
      where: { entityId: field.entityId },
      orderBy: { order: 'asc' },
    });
    for (let i = 0; i < remainingFields.length; i++) {
      if (remainingFields[i].order !== i) {
        await this.prisma.field.update({
          where: { id: remainingFields[i].id },
          data: { order: i },
        });
      }
    }

    if (entity) await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return { deleted: true, fieldName: field.name };
  }

  /** Clone an entity with all its fields */
  async cloneEntity(id: string, newName?: string) {
    const entity = await this.findEntityById(id);
    const baseName = newName || `${entity.name}_copy`;
    let cloneName = baseName;
    let counter = 1;

    // Find a unique name
    while (await this.prisma.dataEntity.findUnique({
      where: { appId_name: { appId: entity.appId, name: cloneName } },
    })) {
      cloneName = `${baseName}_${counter}`;
      counter++;
    }

    const clone = await this.prisma.dataEntity.create({
      data: {
        appId: entity.appId,
        name: cloneName,
        displayName: `${entity.displayName}(副本)`,
        tableName: this.toTableName(cloneName),
        description: entity.description ? `(从 ${entity.name} 克隆) ${entity.description}` : `从 ${entity.name} 克隆`,
        fields: {
          create: entity.fields.map((f, i) => ({
            name: f.name,
            displayName: f.displayName,
            type: f.type,
            defaultValue: f.defaultValue,
            required: f.required,
            unique: f.unique,
            isList: f.isList,
            options: f.options as any,
            relationTo: f.relationTo,
            relationType: f.relationType,
            order: f.order ?? i,
          })),
        },
      },
      include: { fields: true },
    });

    // Take initial snapshot
    await this.versionService.takeSnapshot(clone.id, `从 ${entity.name} 克隆`).catch(() => {});

    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return clone;
  }

  /** Reorder fields by providing field IDs in the desired order */
  async reorderFields(entityId: string, fieldIds: string[]) {
    const field = await this.prisma.field.findFirst({ where: { entityId } });
    if (!field) throw new NotFoundException('实体不存在或没有字段');

    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      select: { appId: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Update order sequentially
    for (let i = 0; i < fieldIds.length; i++) {
      await this.prisma.field.updateMany({
        where: { id: fieldIds[i], entityId },
        data: { order: i },
      });
    }

    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return { reordered: fieldIds.length };
  }

  // ========== Relationship Graph ==========
  async getRelationGraph(appId: string): Promise<EntityRelationGraph> {
    const entities = await this.prisma.dataEntity.findMany({
      where: { appId },
      include: {
        fields: {
          select: {
            id: true,
            name: true,
            displayName: true,
            type: true,
            required: true,
            unique: true,
            isList: true,
            relationTo: true,
            relationType: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    const nodes: EntityNodeData[] = entities.map((e) => ({
      id: e.id,
      name: e.name,
      displayName: e.displayName,
      tableName: e.tableName,
      fields: e.fields.map((f) => ({
        id: f.id,
        name: f.name,
        displayName: f.displayName,
        type: f.type,
        required: f.required,
        unique: f.unique,
        isList: f.isList,
        relationTo: f.relationTo ?? undefined,
        relationType: f.relationType ?? undefined,
      })),
    }));

    const entityNameToId = new Map(entities.map((e) => [e.name, e.id]));
    const edges: EntityRelationEdge[] = [];

    for (const entity of entities) {
      for (const field of entity.fields) {
        if (field.relationTo) {
          const targetId = entityNameToId.get(field.relationTo);
          if (targetId) {
            edges.push({
              id: `${field.id}-rel`,
              sourceEntityId: entity.id,
              targetEntityId: targetId,
              sourceFieldName: field.name,
              relationType: field.relationType ?? 'ONE_TO_MANY',
            });
          }
        }
      }
    }

    // Filter layout to only include existing entity IDs
    const app = await this.prisma.application.findUnique({
      where: { id: appId },
      select: { layout: true },
    });

    const entityIds = new Set(nodes.map((n) => n.id));
    const rawLayout = (app?.layout as Record<string, { x: number; y: number }>) ?? {};
    const layout: Record<string, { x: number; y: number }> = {};
    for (const [id, pos] of Object.entries(rawLayout)) {
      if (entityIds.has(id)) {
        layout[id] = pos;
      }
    }

    return {
      nodes,
      edges,
      layout: Object.keys(layout).length > 0 ? layout : undefined,
    };
  }

  // ========== Model Export / Import ==========

  /** Export all entities as a portable JSON model definition */
  async exportModel(appId: string) {
    const entities = await this.prisma.dataEntity.findMany({
      where: { appId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            displayName: true,
            type: true,
            defaultValue: true,
            required: true,
            unique: true,
            isList: true,
            options: true,
            relationTo: true,
            relationType: true,
            order: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      exportedAt: new Date().toISOString(),
      appId,
      entityCount: entities.length,
      entities: entities.map((e) => ({
        name: e.name,
        displayName: e.displayName,
        tableName: e.tableName,
        description: e.description,
        fields: e.fields,
      })),
    };
  }

  /** Import entities from a portable JSON model definition */
  async importModel(appId: string, modelData: any, options?: { conflictStrategy?: 'skip' | 'overwrite' | 'rename' }) {
    const strategy = options?.conflictStrategy || 'skip';
    const entities = modelData.entities || [];
    let created = 0;
    let skipped = 0;
    let overwritten = 0;
    const results: Array<{ name: string; status: string; message: string }> = [];

    for (const entityDef of entities) {
      try {
        // Check for conflicts
        const existing = await this.prisma.dataEntity.findUnique({
          where: { appId_name: { appId, name: entityDef.name } },
        });

        if (existing) {
          if (strategy === 'skip') {
            skipped++;
            results.push({ name: entityDef.name, status: 'skipped', message: '实体已存在，已跳过' });
            continue;
          }
          if (strategy === 'overwrite') {
            // Delete existing fields and recreate
            await this.prisma.field.deleteMany({ where: { entityId: existing.id } });
            await this.prisma.dataEntity.update({
              where: { id: existing.id },
              data: {
                displayName: entityDef.displayName,
                description: entityDef.description,
              },
            });
            // Add fields
            for (let i = 0; i < (entityDef.fields || []).length; i++) {
              const f = entityDef.fields[i];
              await this.prisma.field.create({
                data: {
                  entityId: existing.id,
                  name: f.name,
                  displayName: f.displayName || f.name,
                  type: f.type,
                  defaultValue: f.defaultValue,
                  required: f.required || false,
                  unique: f.unique || false,
                  isList: f.isList || false,
                  options: f.options || undefined,
                  relationTo: f.relationTo,
                  relationType: f.relationType,
                  order: f.order !== undefined ? f.order : i,
                },
              });
            }
            overwritten++;
            results.push({ name: entityDef.name, status: 'overwritten', message: '已覆盖更新' });
            continue;
          }
          if (strategy === 'rename') {
            // Find a unique name
            let newName = entityDef.name;
            let counter = 1;
            while (await this.prisma.dataEntity.findUnique({ where: { appId_name: { appId, name: newName } } })) {
              newName = `${entityDef.name}_${counter}`;
              counter++;
            }
            await this.createEntityWithFields(appId, { ...entityDef, name: newName });
            created++;
            results.push({ name: entityDef.name, status: 'created', message: `已重命名为 ${newName} 并创建` });
            continue;
          }
        }

        // Create new entity
        await this.createEntityWithFields(appId, entityDef);
        created++;
        results.push({ name: entityDef.name, status: 'created', message: '已创建' });
      } catch (err: any) {
        results.push({ name: entityDef.name, status: 'error', message: err.message });
      }
    }

    await this.cache.del(this.cache.appKey(appId, 'entities'));
    return { created, skipped, overwritten, results };
  }

  private async createEntityWithFields(appId: string, entityDef: any) {
    const tableName = this.toTableName(entityDef.name);
    await this.prisma.dataEntity.create({
      data: {
        appId,
        name: entityDef.name,
        displayName: entityDef.displayName || entityDef.name,
        tableName,
        description: entityDef.description,
        fields: {
          create: (entityDef.fields || []).map((f: any, i: number) => ({
            name: f.name,
            displayName: f.displayName || f.name,
            type: f.type,
            defaultValue: f.defaultValue,
            required: f.required || false,
            unique: f.unique || false,
            isList: f.isList || false,
            options: f.options || undefined,
            relationTo: f.relationTo,
            relationType: f.relationType,
            order: f.order !== undefined ? f.order : i,
          })),
        },
      },
    });
  }

  // ========== Helpers ==========
  private toTableName(name: string): string {
    return `entity_${name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')}`;
  }
}

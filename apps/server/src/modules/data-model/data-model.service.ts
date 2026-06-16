import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { CreateEntityDto, UpdateEntityDto, CreateFieldDto, UpdateFieldDto } from './dto';
import { EntityRelationGraph, EntityNodeData, EntityRelationEdge } from '@lowcode/shared';

@Injectable()
export class DataModelService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
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

  async findEntityById(id: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { records: true } },
      },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');
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

    await this.cache.del(this.cache.appKey(appId, 'entities'));
    return entity;
  }

  async updateEntity(id: string, dto: UpdateEntityDto) {
    await this.findEntityById(id);
    const entity = await this.prisma.dataEntity.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        description: dto.description,
      },
    });
    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return entity;
  }

  async removeEntity(id: string) {
    const entity = await this.findEntityById(id);
    await this.prisma.dataEntity.delete({ where: { id } });
    await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return { deleted: true };
  }

  // ========== Fields ==========
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

    const updated = await this.prisma.field.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        required: dto.required,
        defaultValue: dto.defaultValue,
        options: dto.options || undefined,
      },
    });

    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: field.entityId },
    });
    if (entity) await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return updated;
  }

  async removeField(id: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('字段不存在');

    await this.prisma.field.delete({ where: { id } });

    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: field.entityId },
    });
    if (entity) await this.cache.del(this.cache.appKey(entity.appId, 'entities'));
    return { deleted: true };
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

  // ========== Helpers ==========
  private toTableName(name: string): string {
    return `entity_${name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')}`;
  }
}

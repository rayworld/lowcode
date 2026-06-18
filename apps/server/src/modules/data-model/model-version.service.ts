import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface SnapshotData {
  entity: {
    id: string;
    name: string;
    displayName: string;
    tableName: string;
    description: string | null;
  };
  fields: Array<{
    id: string;
    name: string;
    displayName: string;
    type: string;
    required: boolean;
    unique: boolean;
    isList: boolean;
    defaultValue: string | null;
    options: any;
    relationTo: string | null;
    relationType: string | null;
    order: number;
  }>;
}

@Injectable()
export class ModelVersionService {
  constructor(private prisma: PrismaService) {}

  /** Take a snapshot of the current entity state */
  async takeSnapshot(entityId: string, comment?: string, userId?: string): Promise<void> {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Get the latest version number
    const latest = await this.prisma.modelSnapshot.findFirst({
      where: { entityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    const snapshotData: SnapshotData = {
      entity: {
        id: entity.id,
        name: entity.name,
        displayName: entity.displayName,
        tableName: entity.tableName,
        description: entity.description,
      },
      fields: entity.fields.map((f) => ({
        id: f.id,
        name: f.name,
        displayName: f.displayName,
        type: f.type,
        required: f.required,
        unique: f.unique,
        isList: f.isList,
        defaultValue: f.defaultValue,
        options: f.options,
        relationTo: f.relationTo,
        relationType: f.relationType,
        order: f.order,
      })),
    };

    await this.prisma.modelSnapshot.create({
      data: {
        entityId,
        version: nextVersion,
        snapshot: snapshotData as any,
        comment: comment || `版本 ${nextVersion}`,
        createdById: userId,
      },
    });
  }

  /** List all versions for an entity */
  async listVersions(entityId: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      select: { id: true, displayName: true, name: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    const versions = await this.prisma.modelSnapshot.findMany({
      where: { entityId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        comment: true,
        createdById: true,
        createdAt: true,
      },
    });

    return {
      entity,
      versions,
      total: versions.length,
    };
  }

  /** Get a specific version's full snapshot */
  async getVersion(entityId: string, version: number): Promise<SnapshotData> {
    const snapshot = await this.prisma.modelSnapshot.findUnique({
      where: { entityId_version: { entityId, version } },
    });
    if (!snapshot) throw new NotFoundException(`版本 ${version} 不存在`);

    return snapshot.snapshot as unknown as SnapshotData;
  }

  /** Compare two versions and return the diff */
  async compareVersions(entityId: string, fromVersion: number, toVersion: number) {
    const from = await this.getVersion(entityId, fromVersion);
    const to = await this.getVersion(entityId, toVersion);

    const changes: Array<{ type: 'added' | 'removed' | 'modified'; field?: string; from?: any; to?: any }> = [];

    // Compare entity metadata
    if (from.entity.displayName !== to.entity.displayName) {
      changes.push({ type: 'modified', field: 'displayName', from: from.entity.displayName, to: to.entity.displayName });
    }
    if (from.entity.description !== to.entity.description) {
      changes.push({ type: 'modified', field: 'description', from: from.entity.description, to: to.entity.description });
    }

    // Compare fields
    const fromFieldMap = new Map(from.fields.map((f) => [f.name, f]));
    const toFieldMap = new Map(to.fields.map((f) => [f.name, f]));

    // Fields added
    for (const field of to.fields) {
      if (!fromFieldMap.has(field.name)) {
        changes.push({ type: 'added', field: field.name, to: field });
      }
    }

    // Fields removed
    for (const field of from.fields) {
      if (!toFieldMap.has(field.name)) {
        changes.push({ type: 'removed', field: field.name, from: field });
      }
    }

    // Fields modified
    for (const field of to.fields) {
      const oldField = fromFieldMap.get(field.name);
      if (oldField) {
        const fieldChanges: string[] = [];
        if (oldField.displayName !== field.displayName) fieldChanges.push('displayName');
        if (oldField.type !== field.type) fieldChanges.push('type');
        if (oldField.required !== field.required) fieldChanges.push('required');
        if (oldField.unique !== field.unique) fieldChanges.push('unique');
        if (JSON.stringify(oldField.options) !== JSON.stringify(field.options)) fieldChanges.push('options');

        if (fieldChanges.length > 0) {
          changes.push({
            type: 'modified',
            field: field.name,
            from: fieldChanges.reduce((acc, key) => ({ ...acc, [key]: (oldField as any)[key] }), {}),
            to: fieldChanges.reduce((acc, key) => ({ ...acc, [key]: (field as any)[key] }), {}),
          });
        }
      }
    }

    return {
      fromVersion,
      toVersion,
      changes,
      changeCount: changes.length,
    };
  }

  /** Restore an entity to a previous version */
  async restoreVersion(entityId: string, version: number, userId?: string): Promise<void> {
    const snapshot = await this.getVersion(entityId, version);
    const entity = await this.prisma.dataEntity.findUnique({ where: { id: entityId } });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Take a snapshot before restoring, so the restore is reversible
    await this.takeSnapshot(entityId, `回滚到版本 ${version} 前的备份`, userId);

    // Update entity metadata
    await this.prisma.dataEntity.update({
      where: { id: entityId },
      data: {
        displayName: snapshot.entity.displayName,
        description: snapshot.entity.description,
      },
    });

    // Get current field names to determine what to add/remove
    const currentFields = await this.prisma.field.findMany({
      where: { entityId },
      select: { id: true, name: true },
    });
    const currentFieldNames = new Set(currentFields.map((f) => f.name));
    const snapshotFieldNames = new Set(snapshot.fields.map((f) => f.name));

    // Delete fields that don't exist in the snapshot
    const fieldsToDelete = currentFields.filter((f) => !snapshotFieldNames.has(f.name));
    for (const field of fieldsToDelete) {
      await this.prisma.field.delete({ where: { id: field.id } });
    }

    // Add/update fields from snapshot
    for (const field of snapshot.fields) {
      if (currentFieldNames.has(field.name)) {
        // Update existing field
        await this.prisma.field.updateMany({
          where: { entityId, name: field.name },
          data: {
            displayName: field.displayName,
            type: field.type,
            required: field.required,
            unique: field.unique,
            isList: field.isList,
            defaultValue: field.defaultValue,
            options: field.options as any,
            relationTo: field.relationTo,
            relationType: field.relationType,
            order: field.order,
          },
        });
      } else {
        // Create new field
        await this.prisma.field.create({
          data: {
            entityId,
            name: field.name,
            displayName: field.displayName,
            type: field.type,
            required: field.required,
            unique: field.unique,
            isList: field.isList,
            defaultValue: field.defaultValue,
            options: field.options as any,
            relationTo: field.relationTo,
            relationType: field.relationType,
            order: field.order,
          },
        });
      }
    }
  }
}

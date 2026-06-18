import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string;
  appId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          appId: entry.appId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          detail: (entry.detail ?? undefined) as any,
          ip: entry.ip,
        },
      });
    } catch (error) {
      // Audit logging should never break the main operation
      console.error('Audit log failed:', error);
    }
  }

  // ========== Convenience methods for Data Model operations ==========

  async logEntityCreated(userId: string, appId: string, entityId: string, detail: Record<string, unknown>) {
    await this.log({ userId, appId, action: 'ENTITY_CREATED', resource: 'DataEntity', resourceId: entityId, detail });
  }

  async logEntityUpdated(userId: string, appId: string, entityId: string, detail: Record<string, unknown>) {
    await this.log({ userId, appId, action: 'ENTITY_UPDATED', resource: 'DataEntity', resourceId: entityId, detail });
  }

  async logEntityDeleted(userId: string, appId: string, entityId: string, entityName: string) {
    await this.log({ userId, appId, action: 'ENTITY_DELETED', resource: 'DataEntity', resourceId: entityId, detail: { name: entityName } });
  }

  async logFieldAdded(userId: string, appId: string, entityId: string, fieldName: string, fieldType: string) {
    await this.log({ userId, appId, action: 'FIELD_ADDED', resource: 'Field', resourceId: entityId, detail: { fieldName, fieldType } });
  }

  async logFieldUpdated(userId: string, appId: string, fieldId: string, detail: Record<string, unknown>) {
    await this.log({ userId, appId, action: 'FIELD_UPDATED', resource: 'Field', resourceId: fieldId, detail });
  }

  async logFieldDeleted(userId: string, appId: string, entityId: string, fieldName: string) {
    await this.log({ userId, appId, action: 'FIELD_DELETED', resource: 'Field', resourceId: entityId, detail: { fieldName } });
  }

  async logRecordCreated(userId: string, entityId: string, recordId: string) {
    await this.log({ userId, action: 'RECORD_CREATED', resource: 'DataRecord', resourceId: recordId, detail: { entityId } });
  }

  async logRecordUpdated(userId: string, entityId: string, recordId: string) {
    await this.log({ userId, action: 'RECORD_UPDATED', resource: 'DataRecord', resourceId: recordId, detail: { entityId } });
  }

  async logRecordDeleted(userId: string, entityId: string, recordId: string) {
    await this.log({ userId, action: 'RECORD_DELETED', resource: 'DataRecord', resourceId: recordId, detail: { entityId } });
  }
}

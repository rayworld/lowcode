import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class DynamicDataService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findRecords(entityId: string, page = 1, pageSize = 20) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    const skip = (page - 1) * pageSize;
    const [records, total] = await Promise.all([
      this.prisma.dataRecord.findMany({
        where: { entityId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dataRecord.count({ where: { entityId } }),
    ]);

    return {
      items: records.map((r) => ({
        id: r.id,
        ...(r.data as Record<string, unknown>),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findRecordById(entityId: string, recordId: string) {
    const record = await this.prisma.dataRecord.findFirst({
      where: { id: recordId, entityId },
    });
    if (!record) throw new NotFoundException('数据记录不存在');

    return {
      id: record.id,
      ...(record.data as Record<string, unknown>),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async createRecord(entityId: string, data: Record<string, unknown>) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id: entityId },
      include: { fields: true },
    });
    if (!entity) throw new NotFoundException('数据实体不存在');

    // Validate required fields
    for (const field of entity.fields) {
      if (field.required && (data[field.name] === undefined || data[field.name] === null)) {
        throw new BadRequestException(`字段 "${field.displayName}" 是必填的`);
      }
    }

    const record = await this.prisma.dataRecord.create({
      data: {
        entityId,
        data: data as any,
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
    await this.findRecordById(entityId, recordId);

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
}

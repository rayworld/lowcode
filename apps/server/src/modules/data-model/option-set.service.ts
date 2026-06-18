import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OptionSetService {
  constructor(private prisma: PrismaService) {}

  async findAll(appId: string) {
    return this.prisma.optionSet.findMany({
      where: { appId },
      include: { _count: { select: { fields: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const set = await this.prisma.optionSet.findUnique({
      where: { id },
      include: { _count: { select: { fields: true } } },
    });
    if (!set) throw new NotFoundException('选项集不存在');
    return set;
  }

  async create(appId: string, data: { name: string; displayName?: string; options: any[]; description?: string }) {
    return this.prisma.optionSet.create({
      data: {
        appId,
        name: data.name,
        displayName: data.displayName || data.name,
        options: data.options || [],
        description: data.description,
      },
    });
  }

  async update(id: string, data: { displayName?: string; options?: any[]; description?: string }) {
    await this.findById(id);
    return this.prisma.optionSet.update({
      where: { id },
      data: {
        displayName: data.displayName,
        options: data.options as any,
        description: data.description,
      },
    });
  }

  async remove(id: string) {
    // Check if being used by any field
    const usageCount = await this.prisma.field.count({ where: { optionSetId: id } });
    await this.prisma.optionSet.delete({ where: { id } });
    return { deleted: true, usageCount };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { CreateAppDto, UpdateAppDto } from '@lowcode/shared';

@Injectable()
export class AppManagerService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(userId: string) {
    const cacheKey = this.cache.appKey('all', 'list');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const apps = await this.prisma.application.findMany({
      where: { createdById: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { pages: true, dataModels: true, workflows: true },
        },
      },
    });

    await this.cache.set(cacheKey, apps, 60);
    return apps;
  }

  async findById(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pages: true, dataModels: true, workflows: true },
        },
      },
    });
    if (!app) throw new NotFoundException('应用不存在');
    return app;
  }

  async create(dto: CreateAppDto, userId: string) {
    const app = await this.prisma.application.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        createdById: userId,
      },
    });
    await this.cache.del(this.cache.appKey('all', 'list'));
    return app;
  }

  async update(id: string, dto: UpdateAppDto) {
    await this.findById(id);
    const app = await this.prisma.application.update({
      where: { id },
      data: dto,
    });
    await this.cache.del(this.cache.appKey('all', 'list'));
    return app;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.application.delete({ where: { id } });
    await this.cache.del(this.cache.appKey('all', 'list'));
    return { deleted: true };
  }
}

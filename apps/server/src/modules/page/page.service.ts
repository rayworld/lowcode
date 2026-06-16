import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { CreatePageDto, UpdatePageDto } from '@lowcode/shared';

@Injectable()
export class PageService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findByAppId(appId: string) {
    const cacheKey = this.cache.appKey(appId, 'pages');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const pages = await this.prisma.page.findMany({
      where: { appId },
      orderBy: { updatedAt: 'desc' },
    });
    await this.cache.set(cacheKey, pages, 300);
    return pages;
  }

  async findById(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('页面不存在');
    return page;
  }

  async create(dto: CreatePageDto, userId: string) {
    const existing = await this.prisma.page.findUnique({
      where: { appId_route: { appId: dto.appId, route: dto.route } },
    });
    if (existing) {
      throw new BadRequestException('路由已被占用');
    }

    const page = await this.prisma.page.create({
      data: {
        appId: dto.appId,
        title: dto.title,
        route: dto.route,
        schema: (dto.schema || { root: { id: 'root', type: 'Page', props: {}, children: [] } }) as any,
        createdById: userId,
      },
    });

    await this.cache.del(this.cache.appKey(dto.appId, 'pages'));
    return page;
  }

  async update(id: string, dto: UpdatePageDto) {
    const page = await this.findById(id);
    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        title: dto.title,
        route: dto.route,
        schema: dto.schema as any,
        status: dto.status,
        version: page.version + 1,
      },
    });
    await this.cache.del(this.cache.appKey(page.appId, 'pages'));
    return updated;
  }

  async publish(id: string) {
    const page = await this.findById(id);
    const updated = await this.prisma.page.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
    await this.cache.del(this.cache.appKey(page.appId, 'pages'));
    return updated;
  }

  async remove(id: string) {
    const page = await this.findById(id);
    await this.prisma.page.delete({ where: { id } });
    await this.cache.del(this.cache.appKey(page.appId, 'pages'));
    return { deleted: true };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from '@lowcode/shared';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('workflow') private workflowQueue: Queue,
  ) {}

  async findByAppId(appId: string) {
    return this.prisma.workflow.findMany({
      where: { appId },
      include: { steps: { orderBy: { order: 'asc' } }, _count: { select: { logs: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('工作流不存在');
    return workflow;
  }

  async create(dto: CreateWorkflowDto, userId: string) {
    const workflow = await this.prisma.workflow.create({
      data: {
        appId: dto.appId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerConfig: (dto.triggerConfig || {}) as any,
        createdById: userId,
        steps: dto.steps
          ? { create: dto.steps.map((s, i) => ({ ...s, order: i, config: s.config as any })) }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    return workflow;
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    await this.findById(id);
    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerConfig: dto.triggerConfig as any,
        enabled: dto.enabled,
      },
    });
    return workflow;
  }

  async toggleEnabled(id: string) {
    const workflow = await this.findById(id);
    return this.prisma.workflow.update({
      where: { id },
      data: { enabled: !workflow.enabled },
    });
  }

  async execute(id: string, input?: Record<string, unknown>) {
    const workflow = await this.findById(id);
    if (!workflow.enabled) {
      throw new BadRequestException('工作流未启用');
    }

    const job = await this.workflowQueue.add('execute', {
      workflowId: id,
      input: input || {},
    });
    return { jobId: job.id, status: 'queued' };
  }

  async getLogs(workflowId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [logs, total] = await Promise.all([
      this.prisma.workflowLog.findMany({
        where: { workflowId },
        skip,
        take: pageSize,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.workflowLog.count({ where: { workflowId } }),
    ]);
    return { items: logs, total, page, pageSize };
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.workflow.delete({ where: { id } });
    return { deleted: true };
  }
}

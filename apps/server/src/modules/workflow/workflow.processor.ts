import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Processor('workflow')
export class WorkflowProcessor {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('execute')
  async handleExecute(job: Job<{ workflowId: string; input: Record<string, unknown> }>) {
    const { workflowId, input } = job.data;
    this.logger.log(`Executing workflow ${workflowId}`);

    // Create log entry
    const log = await this.prisma.workflowLog.create({
      data: {
        workflowId,
        status: 'RUNNING',
        input: input as any,
      },
    });

    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      if (!workflow) throw new Error('Workflow not found');

      let context = { ...input };

      // Execute steps sequentially
      for (const step of workflow.steps) {
        this.logger.log(`Executing step ${step.id} (${step.type})`);
        switch (step.type) {
          case 'DATA_OPERATION':
            context = await this.executeDataOperation(step.config as any, context);
            break;
          case 'DELAY':
            await this.delay((step.config as any).ms || 1000);
            break;
          case 'CONDITION':
            // Evaluate condition, skip branch if needed
            break;
          default:
            this.logger.warn(`Unknown step type: ${step.type}`);
        }
      }

      // Update log as success
      await this.prisma.workflowLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS', output: context as any, finishedAt: new Date() },
      });

      this.logger.log(`Workflow ${workflowId} completed successfully`);
      return { success: true, output: context };
    } catch (error: any) {
      // Update log as failed
      await this.prisma.workflowLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: error.message, finishedAt: new Date() },
      });
      this.logger.error(`Workflow ${workflowId} failed: ${error.message}`);
      throw error;
    }
  }

  private async executeDataOperation(
    config: { operation: string; entityId?: string; data?: Record<string, unknown> },
    context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (config.operation === 'setVariable') {
      return { ...context, ...config.data };
    }
    return context;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

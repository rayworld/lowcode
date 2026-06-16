import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowProcessor } from './workflow.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'workflow',
    }),
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowProcessor],
  exports: [WorkflowService],
})
export class WorkflowModule {}

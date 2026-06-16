import { WorkflowTriggerType, WorkflowStepType } from '../enums';

export interface Workflow {
  id: string;
  appId: string;
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  type: WorkflowStepType;
  config: Record<string, unknown>;
  order: number;
  label?: string;
  nextOnSuccess?: string;
  nextOnFailure?: string;
}

export interface CreateWorkflowDto {
  appId: string;
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown>;
  steps?: Omit<WorkflowStep, 'id' | 'workflowId'>[];
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  triggerType?: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown>;
  steps?: Omit<WorkflowStep, 'id' | 'workflowId'>[];
  enabled?: boolean;
}

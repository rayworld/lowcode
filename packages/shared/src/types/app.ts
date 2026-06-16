import { AppStatus } from '../enums';

export interface Application {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  status: AppStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateAppDto {
  name?: string;
  description?: string;
  icon?: string;
  status?: AppStatus;
  layout?: Record<string, { x: number; y: number }>;
}

import { UserRole } from '../enums';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

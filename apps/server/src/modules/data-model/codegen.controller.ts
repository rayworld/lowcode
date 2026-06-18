import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CodegenService, CodegenResult } from './codegen.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('代码生成')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId/codegen')
export class CodegenController {
  constructor(private codegenService: CodegenService) {}

  @Get('entities/:entityId')
  @ApiOperation({ summary: '生成单个实体的 TypeScript 类型和组件代码' })
  async generateEntity(@Param('entityId') entityId: string): Promise<CodegenResult> {
    return this.codegenService.generate(entityId);
  }

  @Get('all')
  @ApiOperation({ summary: '生成应用所有实体的 TypeScript 类型' })
  async generateAll(@Param('appId') appId: string): Promise<string> {
    return this.codegenService.generateAll(appId);
  }
}

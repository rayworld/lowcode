import { useState, useCallback } from 'react';
import { message } from 'antd';
import { entityService } from '../services/entity.service';
import type { CodeGenResult } from '../types';

/**
 * 代码生成 Hook
 */
export function useCodeGen(appId?: string, entityId?: string) {
  const [codegenModalOpen, setCodegenModalOpen] = useState(false);
  const [codegenLoading, setCodegenLoading] = useState(false);
  const [codegenResult, setCodegenResult] = useState<CodeGenResult | null>(null);

  const generateCode = useCallback(async () => {
    if (!appId || !entityId) return;
    setCodegenLoading(true);
    setCodegenModalOpen(true);
    try {
      const res = await entityService.generateCode(appId, entityId);
      setCodegenResult(res.data as CodeGenResult);
    } catch (err: any) {
      message.error('代码生成失败: ' + (err?.response?.data?.message || err.message));
      setCodegenModalOpen(false);
    } finally {
      setCodegenLoading(false);
    }
  }, [appId, entityId]);

  const closeCodeGen = useCallback(() => {
    setCodegenModalOpen(false);
    setCodegenResult(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('代码已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  }, []);

  return {
    codegenModalOpen,
    codegenLoading,
    codegenResult,
    generateCode,
    closeCodeGen,
    copyToClipboard,
  };
}

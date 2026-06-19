/**
 * 从样本数据推断字段类型
 * 从 DataModelPage.tsx 提取，集中管理
 */

/**
 * 从一组样本值推断最可能的字段类型
 */
export function inferFieldType(samples: string[]): string {
  if (samples.length === 0) return 'STRING';

  const allNumber = samples.every((s) => !isNaN(Number(s)) && s !== '');
  if (allNumber && samples.some((s) => s.includes('.'))) return 'NUMBER';

  const allEmail = samples.every((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  if (allEmail) return 'EMAIL';

  const allDate = samples.every((s) => /^\d{4}-\d{2}-\d{2}/.test(s));
  if (allDate) return 'DATE';

  const allBoolean = samples.every((s) => ['true', 'false', '是', '否', '0', '1'].includes(s.toLowerCase()));
  if (allBoolean) return 'BOOLEAN';

  const allUrl = samples.every((s) => s.startsWith('http://') || s.startsWith('https://'));
  if (allUrl) return 'URL';

  const allPhone = samples.every((s) => /^[\d\s\-+]{7,15}$/.test(s));
  if (allPhone) return 'PHONE';

  return 'STRING';
}

/**
 * 从文件名推断实体名称
 */
export function inferEntityName(fileName: string): string {
  return fileName.replace(/\.(csv|xlsx?)$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
}

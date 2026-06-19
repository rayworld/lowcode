import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  /** 是否在输入框中忽略此快捷键 */
  ignoreWhenEditing?: boolean;
}

/**
 * 键盘快捷键 Hook
 *
 * useKeyboard([
 *   { key: 'n', ctrl: true, handler: () => openCreate() },
 *   { key: 'Escape', handler: () => closeModal() },
 * ]);
 */
export function useKeyboard(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : true;
        const keyMatch = e.key === s.key || e.code === s.key;

        if (ctrlMatch && shiftMatch && keyMatch) {
          // 在输入框中忽略快捷键
          if (s.ignoreWhenEditing !== false) {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') continue;
          }
          e.preventDefault();
          s.handler();
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

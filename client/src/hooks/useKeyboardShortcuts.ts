import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onToggleAnswer?: () => void;
  onSelectOption?: (index: number) => void;
}

export function useKeyboardShortcuts({
  onPrev,
  onNext,
  onSubmit,
  onToggleAnswer,
  onSelectOption,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框内的按键事件
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          onPrev?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'Enter':
          e.preventDefault(); // 防止触发默认的表单提交等
          onSubmit?.();
          break;
        case ' ': // Space
          e.preventDefault(); // 防止发生页面滚动
          onToggleAnswer?.();
          break;
        // 1-6 对应的键盘选项
        case '1':
          onSelectOption?.(0);
          break;
        case '2':
          onSelectOption?.(1);
          break;
        case '3':
          onSelectOption?.(2);
          break;
        case '4':
          onSelectOption?.(3);
          break;
        case '5':
          onSelectOption?.(4);
          break;
        case '6':
          onSelectOption?.(5);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPrev, onNext, onSubmit, onToggleAnswer, onSelectOption]);
}

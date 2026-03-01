import { useState, useEffect, useCallback } from 'react';

/**
 * 模块级共享状态：确保多个 useDarkMode() 实例同步。
 * App.tsx（控制 ConfigProvider）和 Layout.tsx（控制 Switch）都调用此 hook，
 * 任一实例切换时，通过 listeners 通知所有其他实例同步更新。
 */
const listeners = new Set<(v: boolean) => void>();

function getInitialValue(): boolean {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) return saved === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

let currentValue: boolean = getInitialValue();

function applyDarkClass(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// 初始化时立即生效
applyDarkClass(currentValue);

export function useDarkMode(): [boolean, (value: boolean) => void] {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(currentValue);

  // 注册/注销监听器
  useEffect(() => {
    listeners.add(setIsDarkMode);
    return () => {
      listeners.delete(setIsDarkMode);
    };
  }, []);

  // 同步 DOM class + localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
    currentValue = isDarkMode;
    applyDarkClass(isDarkMode);
  }, [isDarkMode]);

  // 广播给所有实例
  const broadcast = useCallback((value: boolean) => {
    currentValue = value;
    listeners.forEach((fn) => fn(value));
  }, []);

  // 监听系统偏好变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('darkMode') === null) {
        broadcast(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [broadcast]);

  return [isDarkMode, broadcast];
}

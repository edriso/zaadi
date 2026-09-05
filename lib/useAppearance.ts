'use client';
import { useEffect } from 'react';
import type { Preferences } from './content';

export function useAppearance(
  ready: boolean,
  theme: Preferences['theme'],
  background: Preferences['background'],
) {
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [ready, theme]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.background = background;
  }, [ready, background]);

  useEffect(() => {
    if (!ready) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() =>
        window.dispatchEvent(new Event('zaadi:ready')),
      );
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [ready]);
}

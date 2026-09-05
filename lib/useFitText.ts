'use client';
import { useLayoutEffect, useState, type RefObject } from 'react';
function measureText(area: HTMLElement, content: HTMLElement) {
  const original = content.style.fontSize;
  let low = 18,
    high = 42;
  while (high - low > 0.5) {
    const middle = (low + high) / 2;
    content.style.fontSize = `${middle}px`;
    if (
      content.scrollHeight <= area.clientHeight - 32 &&
      content.scrollWidth <= area.clientWidth
    )
      low = middle;
    else high = middle;
  }
  content.style.fontSize = original;
  return Math.floor(low);
}
export function useFitText(
  viewport: RefObject<HTMLElement | null>,
  text: RefObject<HTMLElement | null>,
  identity: string,
) {
  const [base, setBase] = useState(24);
  useLayoutEffect(() => {
    const area = viewport.current,
      content = text.current;
    if (!area || !content) return;
    let active = true;
    const measure = () => {
      if (active && area.clientHeight > 0) setBase(measureText(area, content));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    void document.fonts.ready.then(measure);
    const frame = requestAnimationFrame(measure);
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [identity, viewport, text]);
  return base;
}

'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Panel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open, title]);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const backdrop = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        onClose();
    };
    dialog.addEventListener('click', backdrop);
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => dialog.removeEventListener('click', backdrop);
  }, [open, onClose]);
  return (
    <dialog
      ref={ref}
      className="panel"
      aria-labelledby="panel-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="panel-heading">
        <h2 id="panel-title">{title}</h2>
        <button
          ref={closeButton}
          className="icon-button"
          aria-label="إغلاق"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="panel-content">{children}</div>
    </dialog>
  );
}

import React, { useEffect, useId, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Modal accesible:
 *  - Se cierra con Escape o al hacer clic en el fondo
 *  - Bloquea el scroll del body mientras está abierto
 *  - Mueve el foco al diálogo al abrir y lo devuelve al elemento previo al cerrar
 *  - Si el contenido es alto, hace scroll interno (útil en móvil)
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, description, size = 'md', children }) => {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        // Solo cierra si el clic empezó en el fondo, no al arrastrar desde dentro del panel
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`bg-slate-900 border border-slate-800 rounded-2xl w-full ${
          size === 'lg' ? 'max-w-lg' : 'max-w-md'
        } p-6 shadow-2xl max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        <h3 id={titleId} className="text-lg font-bold text-white mb-1">
          {title}
        </h3>
        {description && (
          <p id={descId} className="text-xs text-slate-400 mb-5">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

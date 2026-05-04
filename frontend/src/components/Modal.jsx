const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open, title, onClose, children, footer,
  size = 'md', panelClassName = '', bodyClassName = '',
}) {
  if (!open) return null;

  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className={`w-full ${sizeClass} card p-6 ${panelClassName}`.trim()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className={`max-h-[70vh] overflow-y-auto ${bodyClassName}`.trim()}>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

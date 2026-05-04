import { createContext, useCallback, useContext, useRef, useState } from 'react';

const Ctx = createContext(null);

export function ConfirmProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (message, title = 'Confirmar') =>
      new Promise(resolve => {
        resolveRef.current = resolve;
        setDlg({ message, title });
      }),
    [],
  );

  const answer = val => {
    resolveRef.current?.(val);
    setDlg(null);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {dlg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h4 className="font-semibold text-slate-900">{dlg.title}</h4>
            <p className="mt-1.5 text-sm text-slate-500">{dlg.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => answer(false)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={() => answer(true)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);

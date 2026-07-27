import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg border border-emerald-500/30 flex items-center gap-4">
        <div>
          <h3 className="font-bold text-sm">Nova atualização disponível!</h3>
          <p className="text-xs text-emerald-100 mt-1">
            Uma nova versão do sistema foi lançada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex items-center gap-1 bg-white text-emerald-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="p-1.5 hover:bg-emerald-700 rounded-lg transition-colors text-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

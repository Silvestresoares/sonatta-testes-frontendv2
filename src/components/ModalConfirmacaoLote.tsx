import React from 'react';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';

interface ModalConfirmacaoLoteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  mes: string | number;
  ano: string | number;
}

export default function ModalConfirmacaoLote({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  mes,
  ano
}: ModalConfirmacaoLoteProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-center mb-5">
          <div className="bg-amber-500/20 text-amber-500 p-3 rounded-full">
            <AlertTriangle size={32} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-white mb-2">
          Gerar Lote de Mensalidades
        </h2>
        
        <p className="text-zinc-400 text-center mb-6 leading-relaxed text-sm">
          Você está prestes a processar e agrupar as mensalidades para{' '}
          <strong className="text-white bg-zinc-800 px-2 py-0.5 rounded">
            {mes}/{ano}
          </strong>.
          <br /><br />
          Responsáveis com mais de um aluno matriculado receberão uma **Fatura Unificada**. Faturas pendentes antigas deste mês serão re-processadas automaticamente.
        </p>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Check size={18} />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'sucesso' | 'erro';

interface ToastFeedbackProps {
  isVisible: boolean;
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function ToastFeedback({
  isVisible,
  message,
  type,
  onClose,
  duration = 5000
}: ToastFeedbackProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const isSuccess = type === 'sucesso';

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
          isSuccess 
            ? 'bg-emerald-950/80 border-emerald-900/50 text-emerald-400' 
            : 'bg-red-950/80 border-red-900/50 text-red-400'
        } backdrop-blur-md`}
      >
        {isSuccess ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
        
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {isSuccess ? 'Sucesso' : 'Falha'}
          </span>
          <span className="text-zinc-300 text-sm">{message}</span>
        </div>

        <button 
          onClick={onClose} 
          className="ml-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

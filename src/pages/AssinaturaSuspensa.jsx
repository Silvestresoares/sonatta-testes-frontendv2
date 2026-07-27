import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function AssinaturaSuspensa() {
  const handleLogout = () => {
    localStorage.removeItem('@sonatta:token');
    localStorage.removeItem('@sonatta:tipo_usuario');
    localStorage.removeItem('@sonatta:professor_id');
    localStorage.removeItem('@sonatta:usuario_nome');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={32} className="text-rose-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Suspenso</h1>
        
        <p className="text-zinc-400 mb-6 text-sm">
          A assinatura da sua escola encontra-se pendente ou expirada. Para continuar utilizando o sistema, por favor, regularize o pagamento.
        </p>

        <div className="bg-zinc-950 w-full p-4 rounded-xl border border-zinc-800 mb-6">
          <h3 className="text-emerald-400 font-semibold mb-2">Renove sua Assinatura</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Entre em contato com o suporte da Sonatta para realizar o pagamento e liberar seu acesso imediatamente.
          </p>
          <a 
            href="https://wa.me/5511999999999" // TODO: Substituir pelo número real de suporte
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg transition-colors"
          >
            Falar com Suporte <ExternalLink size={16} />
          </a>
        </div>

        <button 
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Sair do sistema
        </button>
      </div>
    </div>
  );
}

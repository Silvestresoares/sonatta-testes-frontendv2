/**
 * ModalConfirmacao - Componente reutilizável para confirmação de ações destrutivas
 * 
 * Uso:
 * <ModalConfirmacao
 *   aberto={abrirModal}
 *   titulo="Deletar Aluno"
 *   mensagem={`Tem certeza que deseja deletar "${aluno.nome}"? Esta ação é irreversível.`}
 *   textoBotaoConfirmar="Deletar"
 *   textoBotaoCancelar="Cancelar"
 *   carregando={deletando}
 *   onConfirmar={handleDeletar}
 *   onCancelar={() => setAbrirModal(false)}
 *   tipo="danger" // 'danger' | 'warning' | 'info'
 * />
 */

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

export const ModalConfirmacao = ({
  aberto = false,
  titulo = 'Confirmar',
  mensagem = 'Tem certeza?',
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  carregando = false,
  onConfirmar = () => {},
  onCancelar = () => {},
  tipo = 'warning', // 'danger' | 'warning' | 'info'
  children = null,
}) => {
  if (!aberto) return null;

  const estilos = {
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/50',
      icone: 'text-red-600 dark:text-red-400',
      botao: 'bg-red-600 hover:bg-red-700 text-white',
      iconeCor: 'text-red-500',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-900/50',
      icone: 'text-yellow-600 dark:text-yellow-400',
      botao: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      iconeCor: 'text-yellow-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900/50',
      icone: 'text-blue-600 dark:text-blue-400',
      botao: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconeCor: 'text-blue-500',
    },
  };

  const estilo = estilos[tipo] || estilos.warning;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border ${estilo.border}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${estilo.iconeCor}`} />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{titulo}</h2>
          </div>
          <button
            onClick={onCancelar}
            disabled={carregando}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${estilo.bg}`}>
          <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">{mensagem}</p>
          {children}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onCancelar}
            disabled={carregando}
            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            className={`flex-1 px-4 py-2.5 rounded-lg ${estilo.botao} font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {carregando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processando...
              </>
            ) : (
              textoBotaoConfirmar
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;

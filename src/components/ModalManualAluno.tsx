import React, { useState } from 'react';
import { X, BookOpen, Smartphone, Calendar, FileText, DollarSign, Users, MessageCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface ModalManualAlunoProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente Modal: Manual do Aluno e Responsável
 * Explicação do bloco: Fornece um guia interativo e direto ao ponto dentro do Portal do Aluno,
 * orientando sobre instalação no celular (PWA), visualização de lições de casa,
 * pagamentos de mensalidades via Pix e alternância de filhos.
 */
export default function ModalManualAluno({ isOpen, onClose }: ModalManualAlunoProps) {
  const [secaoAberta, setSecaoAberta] = useState<string | null>('pwa');

  if (!isOpen) return null;

  const toggleSecao = (id: string) => {
    setSecaoAberta(secaoAberta === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100] animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Manual do Aluno e Responsável</h2>
              <p className="text-xs text-zinc-400">Guia de uso rápido para aproveitar ao máximo o seu Portal</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Fechar manual"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          
          {/* Seção 1: Como Instalar no Celular */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button 
              onClick={() => toggleSecao('pwa')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="text-emerald-400 shrink-0" size={18} />
                <span className="font-semibold text-white text-sm sm:text-base">Como Instalar o Portal no Celular (App)</span>
              </div>
              {secaoAberta === 'pwa' ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
            </button>
            {secaoAberta === 'pwa' && (
              <div className="p-4 pt-0 text-sm text-zinc-300 border-t border-zinc-800/60 bg-zinc-900/30 space-y-3">
                <p className="text-zinc-400 text-xs">Você pode salvar o portal como um aplicativo direto na sua tela inicial:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
                    <strong className="text-emerald-400 block text-xs uppercase mb-1">Android (Google Chrome)</strong>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-300">
                      <li>Abra o portal no Chrome;</li>
                      <li>Toque nos <strong>três pontinhos (⋮)</strong> no topo;</li>
                      <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
                    <strong className="text-blue-400 block text-xs uppercase mb-1">iPhone / iPad (Safari)</strong>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-300">
                      <li>Abra o portal no Safari;</li>
                      <li>Toque no botão de <strong>Compartilhar (⎋)</strong>;</li>
                      <li>Role e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Cronograma e Aulas */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button 
              onClick={() => toggleSecao('aulas')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-400 shrink-0" size={18} />
                <span className="font-semibold text-white text-sm sm:text-base">Horários e "Hoje é Dia de Aula!"</span>
              </div>
              {secaoAberta === 'aulas' ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
            </button>
            {secaoAberta === 'aulas' && (
              <div className="p-4 pt-0 text-sm text-zinc-300 border-t border-zinc-800/60 bg-zinc-900/30 space-y-2">
                <p>No topo do seu portal você encontra:</p>
                <ul className="space-y-1.5 text-xs text-zinc-300 list-disc list-inside">
                  <li><strong>Card da Próxima Aula</strong>: Mostra o dia, horário, instrumento e o nome do seu professor.</li>
                  <li><strong>Alerta "Hoje é Dia de Aula!"</strong>: Em dias em que você tem aula agendada, um aviso destacado pulsa na tela para lembrar de separar o seu instrumento e partituras.</li>
                  <li><strong>Turmas Coletivas</strong>: Se você faz aulas de teoria, prática em grupo ou coral, os horários da turma aparecem integrados na mesma visualização.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Seção 3: Lições de Casa e Histórico */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button 
              onClick={() => toggleSecao('pedagogico')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-purple-400 shrink-0" size={18} />
                <span className="font-semibold text-white text-sm sm:text-base">Histórico Pedagógico e Lições de Casa</span>
              </div>
              {secaoAberta === 'pedagogico' ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
            </button>
            {secaoAberta === 'pedagogico' && (
              <div className="p-4 pt-0 text-sm text-zinc-300 border-t border-zinc-800/60 bg-zinc-900/30 space-y-2">
                <p>Na seção <strong>Linha do Tempo de Aulas</strong>, você confere tudo o que o professor registrou:</p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <strong className="text-purple-300 block mb-0.5">📚 Conteúdo Trabalhado:</strong>
                    <span>Técnicas, exercícios, escalas e trechos de músicas estudados na aula.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <strong className="text-amber-300 block mb-0.5">🎯 Tarefa de Casa (Estudo da Semana):</strong>
                    <span>Orientações exatas do professor para você praticar em casa até o próximo encontro musical.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 4: Pagamento de Mensalidades */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button 
              onClick={() => toggleSecao('financeiro')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="text-amber-400 shrink-0" size={18} />
                <span className="font-semibold text-white text-sm sm:text-base">Como Pagar Mensalidades (Pix e Boleto)</span>
              </div>
              {secaoAberta === 'financeiro' ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
            </button>
            {secaoAberta === 'financeiro' && (
              <div className="p-4 pt-0 text-sm text-zinc-300 border-t border-zinc-800/60 bg-zinc-900/30 space-y-2.5">
                <p className="text-xs text-zinc-400">Na aba de faturas, você escolhe como prefere pagar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <strong className="text-emerald-400 block mb-1">⚡ Pagamento via Pix:</strong>
                    <span>Clique em <strong>"Pagar via Pix"</strong>, copie o código <em>Pix Copia e Cola</em> ou aponte a câmera para o QR Code. A confirmação é instantânea!</span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <strong className="text-blue-400 block mb-1">📄 Pagamento via Boleto:</strong>
                    <span>Clique em <strong>"Pagar com Boleto"</strong> para copiar a linha digitável do código de barras ou visualizar o boleto bancário.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 5: Responsáveis com Múltiplos Filhos */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button 
              onClick={() => toggleSecao('filhos')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="text-teal-400 shrink-0" size={18} />
                <span className="font-semibold text-white text-sm sm:text-base">Múltiplos Filhos na Mesma Conta</span>
              </div>
              {secaoAberta === 'filhos' ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
            </button>
            {secaoAberta === 'filhos' && (
              <div className="p-4 pt-0 text-sm text-zinc-300 border-t border-zinc-800/60 bg-zinc-900/30 space-y-2">
                <p className="text-xs text-zinc-300">
                  Pais ou responsáveis que possuem mais de um filho matriculado na escola podem alternar entre eles facilmente:
                </p>
                <p className="text-xs text-zinc-400 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                  👉 No topo da tela, clique no seletor com o nome do aluno. Ao escolher outro filho, as lições de casa, cronograma e faturas são atualizadas na hora sem precisar sair do sistema!
                </p>
              </div>
            )}
          </div>

          {/* Dúvidas e Secretaria */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
            <MessageCircle className="shrink-0 text-emerald-400" size={20} />
            <span>Precisa de ajuda ou deseja reagendar uma aula? Fale com a secretaria pelo botão do <strong>WhatsApp</strong> no rodapé do portal!</span>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-md shadow-emerald-900/20"
          >
            <CheckCircle2 size={16} /> Entendido
          </button>
        </div>

      </div>
    </div>
  );
}

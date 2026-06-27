import React, { useState } from 'react';
import { X, Clipboard, MessageSquare, Mail } from 'lucide-react';
import HistoricoAulas from './HistoricoAulas';
import EstatisticasAulas from './EstatisticasAulas';

export default function ModalDetalheAluno({ aluno, isOpen, onClose, onRegistrarAula }) {
  const [abaAtiva, setAbaAtiva] = useState('info');

  if (!isOpen || !aluno) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800">
        
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {aluno.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{aluno.nome}</h2>
              <p className="text-zinc-400">{aluno.instrumento}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Abas */}
        <div className="bg-zinc-800/50 border-b border-zinc-700 px-6 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('info')}
            className={`px-4 py-3 font-medium transition whitespace-nowrap ${
              abaAtiva === 'info'
                ? 'text-orange-400 border-b-2 border-orange-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📋 Informações
          </button>
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`px-4 py-3 font-medium transition whitespace-nowrap ${
              abaAtiva === 'historico'
                ? 'text-orange-400 border-b-2 border-orange-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📅 Histórico de Aulas
          </button>
          <button
            onClick={() => setAbaAtiva('estatisticas')}
            className={`px-4 py-3 font-medium transition whitespace-nowrap ${
              abaAtiva === 'estatisticas'
                ? 'text-orange-400 border-b-2 border-orange-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📊 Estatísticas
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6">
          {/* ABA: INFORMAÇÕES */}
          {abaAtiva === 'info' && (
            <div className="space-y-6">
              {/* Cards de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    aluno.status === 'Ativo'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {aluno.status === 'Ativo' ? '🟢' : '🔴'} {aluno.status}
                  </span>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Instrumento</p>
                  <p className="text-white font-medium">{aluno.instrumento || 'N/A'}</p>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Aula</p>
                  <p className="text-white font-medium">{aluno.dia_aula} {aluno.horario ? `às ${aluno.horario}` : ''}</p>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Data de Matrícula</p>
                  <p className="text-white font-medium">
                    {aluno.data_matricula ? new Date(aluno.data_matricula).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  Contato
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300">
                    <span className="text-zinc-400">Email:</span> {aluno.email || 'N/A'}
                  </p>
                  <p className="text-sm text-zinc-300">
                    <span className="text-zinc-400">Telefone:</span> {aluno.telefone || 'N/A'}
                  </p>
                  <p className="text-sm text-zinc-300">
                    <span className="text-zinc-400">CPF:</span> {aluno.cpf || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Valores */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-400 mb-4">💰 Valores</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Mensalidade:</span>
                    <span className="font-medium text-white">R$ {parseFloat(aluno.mensalidade || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Quantidade de Aulas:</span>
                    <span className="font-medium text-white">{aluno.quantidade_aulas || 4}</span>
                  </div>
                  {aluno.valor_calculado && (
                    <div className="flex justify-between pt-2 border-t border-emerald-500/20">
                      <span className="text-zinc-300 font-medium">Valor Total:</span>
                      <span className="font-bold text-emerald-300">R$ {parseFloat(aluno.valor_calculado).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Ação */}
              <button
                onClick={() => { onRegistrarAula(aluno); onClose(); }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Clipboard className="w-5 h-5" />
                Registrar Aula
              </button>
            </div>
          )}

          {/* ABA: HISTÓRICO DE AULAS */}
          {abaAtiva === 'historico' && (
            <HistoricoAulas aluno_id={aluno.id} />
          )}

          {/* ABA: ESTATÍSTICAS */}
          {abaAtiva === 'estatisticas' && (
            <div className="space-y-6">
              <EstatisticasAulas aluno_id={aluno.id} />
              
              {/* Card informativo */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  As estatísticas são calculadas automaticamente com base nos registros de aula do aluno nos últimos 30 dias.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

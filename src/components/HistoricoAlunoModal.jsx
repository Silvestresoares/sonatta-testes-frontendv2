import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, XCircle, FileText, ListTodo } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3001';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function HistoricoAlunoModal({ isOpen, onClose, aluno }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (isOpen && aluno) {
      carregarHistorico();
    }
  }, [isOpen, aluno]);

  const carregarHistorico = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      setCarregando(true);
      const resposta = await fetch(`${API_URL}/api/registros-aula/aluno/${aluno.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setRegistros(dados.dados || []);
      }
    } catch (erro) {
      console.error("Erro ao buscar histórico:", erro);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    const [ano, mes, dia] = dataIso.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📜 Histórico de Aulas
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Aluno: <span className="font-semibold text-emerald-400">{aluno?.nome}</span> • {aluno?.instrumento}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
              <p>Buscando registros pedagógicos...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-zinc-400">Nenhum registro de aula encontrado para este aluno.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {registros.map((registro, idx) => (
                <div key={registro.id || idx} className="relative pl-6 border-l-2 border-zinc-800 pb-2 last:pb-0">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-zinc-950 ${
                    registro.status_presenca === 'presente' ? 'bg-emerald-500' :
                    registro.status_presenca === 'cancelada' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2 text-zinc-300 font-medium">
                        <Calendar size={16} className="text-zinc-500" />
                        {formatarData(registro.data_aula)}
                      </div>
                      
                      <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        registro.status_presenca === 'presente' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' :
                        registro.status_presenca === 'cancelada' ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50' :
                        'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                      }`}>
                        {registro.status_presenca === 'presente' && <CheckCircle2 size={12} />}
                        {registro.status_presenca === 'falta' && <XCircle size={12} />}
                        {registro.status_presenca === 'cancelada' && <X size={12} />}
                        <span className="capitalize">{registro.status_presenca}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-2">
                          <FileText size={14} /> Conteúdo Trabalhado
                        </h4>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                          {registro.conteudo_trabalhado || <span className="text-zinc-600 italic">Não preenchido</span>}
                        </p>
                      </div>
                      
                      <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-2">
                          <ListTodo size={14} /> Tarefas para Casa
                        </h4>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                          {registro.tarefas_casa || <span className="text-zinc-600 italic">Não preenchido</span>}
                        </p>
                      </div>
                    </div>

                    {registro.observacoes && (
                      <div className="mt-4 pt-4 border-t border-zinc-800/50">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase mb-1">Observações</h4>
                        <p className="text-sm text-zinc-400">{registro.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Clock, Check, XCircle, Calendar, User } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function SolicitacoesPontoModal({ isOpen, onClose, token }) {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(null);

  const carregar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`${API_URL}/api/professores/ponto/ajustes/pendentes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar solicitações');
      const data = await res.json();
      setSolicitacoes(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregar();
    }
  }, [isOpen, token]);

  const processarSolicitacao = async (id, status) => {
    setProcessando(id);
    try {
      const res = await fetch(`${API_URL}/api/professores/ponto/ajustes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.erro || 'Erro ao processar.');
      }
      // Remove a solicitacao processada da lista
      setSolicitacoes(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessando(null);
    }
  };

  if (!isOpen) return null;

  const formatarDataLocal = (dataIso) => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-500" /> Ajustes de Ponto Pendentes
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Avalie as justificativas dos professores para corrigir horários.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {carregando ? (
            <p className="text-zinc-500 text-center py-10">Carregando...</p>
          ) : erro ? (
            <p className="text-rose-500 text-center py-10">{erro}</p>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <span className="text-4xl mb-4">👍</span>
              <p className="text-zinc-500">Nenhuma solicitação pendente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoes.map(sol => (
                <div key={sol.id} className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium mb-2">
                      <User size={16} className="text-zinc-400" />
                      {sol.professor_nome}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Calendar size={14} /> {formatarDataLocal(sol.data_referencia)}
                      </div>
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Clock size={14} /> Entrada: {sol.hora_entrada}
                      </div>
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Clock size={14} /> Saída: {sol.hora_saida}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Justificativa:</span>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1 italic">"{sol.justificativa}"</p>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full md:w-auto">
                    <button 
                      disabled={processando === sol.id}
                      onClick={() => processarSolicitacao(sol.id, 'Aprovado')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Check size={16} /> Aprovar
                    </button>
                    <button 
                      disabled={processando === sol.id}
                      onClick={() => processarSolicitacao(sol.id, 'Rejeitado')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-600/10 text-rose-600 hover:bg-rose-600/20 dark:text-rose-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle size={16} /> Rejeitar
                    </button>
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

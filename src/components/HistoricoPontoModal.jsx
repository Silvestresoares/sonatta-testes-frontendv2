import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { API_URL } from '../utils/api';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function HistoricoPontoModal({ isOpen, onClose, professorId }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [dados, setDados] = useState(null);
  
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  const token = localStorage.getItem('@sonatta:token');

  const carregarHistorico = async () => {
    if (!professorId) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`${API_URL}/api/professores/${professorId}/ponto/historico?mes=${mesAtual}&ano=${anoAtual}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Erro ao buscar histórico de ponto');
      }
      const json = await res.json();
      setDados(json);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarHistorico();
    }
  }, [isOpen, mesAtual, anoAtual, professorId]);

  if (!isOpen) return null;

  const formatarHora = (dataStr) => {
    if (!dataStr) return '--:--';
    const data = new Date(dataStr);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  };

  const formatarDataLocal = (dataIso) => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="text-emerald-500" /> Histórico de Ponto
            </h2>
            <p className="text-sm text-zinc-500 mt-1">Acompanhe suas presenças e faltas do mês</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        {/* Filters & Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={mesAtual}
                onChange={(e) => setMesAtual(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white"
              >
                {MESES.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>{mes}</option>
                ))}
              </select>
              <select
                value={anoAtual}
                onChange={(e) => setAnoAtual(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white"
              >
                {[anoAtual - 1, anoAtual, anoAtual + 1].map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={carregarHistorico} 
              className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={carregando ? 'animate-spin' : ''} />
            </button>
          </div>

          {carregando ? (
             <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : erro ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 rounded-xl text-sm text-center">
              {erro}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium">Presenças</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{dados?.resumo?.presencas || 0}</p>
                  </div>
                </div>
                
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-rose-600/80 dark:text-rose-400/80 font-medium">Faltas</p>
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{dados?.resumo?.faltas || 0}</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Entrada(s)</th>
                      <th className="px-4 py-3 text-center">Saída(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {dados?.historico?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-zinc-500">
                          Nenhum registro encontrado para este mês (até o dia de hoje).
                        </td>
                      </tr>
                    ) : (
                      dados?.historico?.map((dia, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                            <Calendar size={14} className="text-zinc-400" />
                            {formatarDataLocal(dia.data)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {dia.status === 'Presença' && <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs rounded-md font-medium">Presença</span>}
                            {dia.status === 'Falta' && <span className="inline-block px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-xs rounded-md font-medium">Falta</span>}
                            {dia.status === 'Folga' && <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs rounded-md font-medium">Extra / Folga</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300">
                            {dia.registros.entradas.length > 0 
                              ? dia.registros.entradas.map((t, i) => <div key={i}>{formatarHora(t)}</div>) 
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300">
                            {dia.registros.saidas.length > 0 
                              ? dia.registros.saidas.map((t, i) => <div key={i}>{formatarHora(t)}</div>) 
                              : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

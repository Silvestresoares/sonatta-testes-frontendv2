import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Music, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function MinhaAgenda({ professorId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  const token = localStorage.getItem('@sonatta:token');

  // Garante que professorId é um número válido
  const profId = professorId && professorId !== '' ? Number(professorId) : null;

  const carregarAgenda = async () => {
    if (!profId) {
      setErro('ID do professor não encontrado. Tente fazer login novamente.');
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch(`${API_URL}/api/professores/${profId}/agenda?mes=${mesAtual}&ano=${anoAtual}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resposta.ok) {
        const json = await resposta.json().catch(() => ({}));
        throw new Error(json.erro || 'Erro ao carregar agenda');
      }
      const json = await resposta.json();
      setDados(json);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgenda();
  }, [profId, mesAtual, anoAtual]);

  const hoje = new Date().toISOString().split('T')[0];
  const ehMesAtual = mesAtual === new Date().getMonth() + 1 && anoAtual === new Date().getFullYear();

  const mesAnterior = () => {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual(a => a - 1); }
    else setMesAtual(m => m - 1);
  };

  const mesSeguinte = () => {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual(a => a + 1); }
    else setMesAtual(m => m + 1);
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.substring(0, 10).split('-');
    return `${dia}/${mes}`;
  };

  const periodosAulas = dados?.aulas_mes ? dados.aulas_mes : [];

  const formatarDiaSemana = (dataStr) => {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const tipoLabel = (tipo) => {
    if (tipo === 'aula_extra') return { label: 'Extra', css: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (tipo === 'reposicao') return { label: 'Reposição', css: 'bg-red-500/10 text-red-400 border-red-500/20' };
    if (tipo === 'reagendada') return { label: 'Reagendada', css: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    return { label: 'Regular', css: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400 text-sm">Carregando sua agenda...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ {erro}</p>
          <button onClick={carregarAgenda} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm text-white transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📅 Minha Agenda</h1>
          <p className="text-zinc-400 text-sm mt-1">Suas aulas agendadas</p>
        </div>
        <button onClick={carregarAgenda} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Atualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Navegador de mês */}
      <div className="flex items-center justify-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <button onClick={mesAnterior} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-bold text-lg min-w-[200px] text-center">
          {MESES[mesAtual - 1]} {anoAtual}
          {ehMesAtual && <span className="ml-2 text-xs text-emerald-400 font-normal">(este mês)</span>}
        </span>
        <button onClick={mesSeguinte} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Aulas Hoje</p>
          <p className="text-3xl font-bold text-emerald-400">{ehMesAtual ? (dados?.aulas_hoje?.length || 0) : '-'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Próximos 7 dias</p>
          <p className="text-3xl font-bold text-blue-400">{ehMesAtual ? (dados?.aulas_semana?.length || 0) : '-'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Total no Mês</p>
          <p className="text-3xl font-bold text-zinc-300">{dados?.total_mes || 0}</p>
        </div>
      </div>

      {/* Aulas de Hoje — só aparece no mês atual */}
      {ehMesAtual && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-400" />
            Aulas de Hoje
          </h2>
          {dados?.aulas_hoje?.length > 0 ? (
            <div className="space-y-3">
              {dados.aulas_hoje.map((aula, i) => {
                const { label, css } = tipoLabel(aula.tipo_aula);
                return (
                  <div key={aula.id || i} className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-1">
                        <Clock size={14} />
                        {aula.horario || '--:--'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate flex items-center gap-2">
                        <User size={14} className="text-zinc-500 flex-shrink-0" />
                        {aula.nome_aluno}
                      </p>
                      <p className="text-zinc-500 text-sm flex items-center gap-2">
                        <Music size={14} />
                        {aula.instrumento || 'Não informado'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${css}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma aula agendada para hoje.</p>
            </div>
          )}
        </div>
      )}

      {/* Todas as aulas do mês */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-400" />
          {ehMesAtual ? 'Todas as aulas do mês' : `Aulas de ${MESES[mesAtual - 1]}`}
        </h2>

        {dados?.aulas_mes?.length > 0 && (
          <div className="space-y-2">
            {dados.aulas_mes.map((aula, i) => {
              const dataAula = aula.data_aula ? aula.data_aula.toString().substring(0, 10) : '';
              const ehHoje = dataAula === hoje;
              const { label, css } = tipoLabel(aula.tipo_aula);
              return (
                <div key={aula.id || i} className={`flex items-center gap-4 rounded-lg p-3 border transition-colors ${ehHoje ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex-shrink-0 w-24 text-center">
                    <div className="text-xs text-zinc-500 capitalize">{formatarDiaSemana(dataAula)}</div>
                    <div className={`font-bold text-sm ${ehHoje ? 'text-emerald-400' : 'text-zinc-300'}`}>{formatarData(dataAula)}</div>
                  </div>
                  <div className="text-zinc-400 font-mono text-sm w-14">{aula.horario || '--:--'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{aula.nome_aluno}</p>
                    <p className="text-zinc-500 text-xs">{aula.instrumento || ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ehHoje && <span className="text-xs text-emerald-400 font-bold">HOJE</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border hidden sm:inline ${css}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(!dados?.aulas_mes || dados.aulas_mes.length === 0) && (
          <div className="text-center py-8 text-zinc-500">
            <Clock size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma aula agendada {ehMesAtual ? 'neste mês' : `em ${MESES[mesAtual - 1]}`}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

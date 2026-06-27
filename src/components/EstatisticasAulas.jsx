import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Users, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function EstatisticasAulas({ aluno_id }) {
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregarEstatisticas = async () => {
      if (!aluno_id) return;

      const token = localStorage.getItem('@sonatta:token');
      
      try {
        setCarregando(true);
        const response = await fetch(`${API_URL}/api/registros-aula/estatisticas/aluno/${aluno_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao carregar estatísticas');

        const data = await response.json();
        setStats(data);
      } catch (erro) {
        console.error('Erro:', erro);
        setErro('Erro ao carregar estatísticas');
      } finally {
        setCarregando(false);
      }
    };

    carregarEstatisticas();
  }, [aluno_id]);

  if (carregando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-800 border border-zinc-700 p-4 rounded-lg animate-pulse">
            <div className="h-8 w-8 bg-zinc-700 rounded mb-2" />
            <div className="h-4 w-20 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (erro || !stats) {
    return null;
  }

  const getFrequenciaColor = (percentual) => {
    if (percentual >= 90) return 'text-emerald-400';
    if (percentual >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getFrequenciaBgColor = (percentual) => {
    if (percentual >= 90) return 'bg-emerald-500/10';
    if (percentual >= 75) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Aulas Registradas */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Total de Aulas</p>
            <p className="text-3xl font-bold text-white">{stats.totalAulasRegistradas}</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-zinc-500">Registros desde o início</p>
      </div>

      {/* Presenças do Mês */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Presenças (Mês)</p>
            <p className="text-3xl font-bold text-emerald-400">{stats.presencasDoMes}</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <p className="text-xs text-zinc-500">Aulas do mês atual</p>
      </div>

      {/* Faltas do Mês */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Faltas (Mês)</p>
            <p className="text-3xl font-bold text-red-400">{stats.faltasDoMes}</p>
          </div>
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Users className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <p className="text-xs text-zinc-500">Aulas do mês atual</p>
      </div>

      {/* Percentual de Frequência */}
      <div className={`${getFrequenciaBgColor(stats.percentualFrequencia)} border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">Frequência (30 dias)</p>
            <p className={`text-3xl font-bold ${getFrequenciaColor(stats.percentualFrequencia)}`}>
              {stats.percentualFrequencia}%
            </p>
          </div>
          <div className={`p-2 rounded-lg ${getFrequenciaBgColor(stats.percentualFrequencia)}`}>
            <BarChart3 className={`w-6 h-6 ${getFrequenciaColor(stats.percentualFrequencia)}`} />
          </div>
        </div>
        <p className="text-xs text-zinc-500">Últimos 30 dias ({stats.totalUltimos30Dias} aulas)</p>
      </div>
    </div>
  );
}

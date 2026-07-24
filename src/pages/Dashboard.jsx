import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Cell
} from 'recharts';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);
const canalComunicacao = new BroadcastChannel('sonatta_updates');
const canalSincronizacao = new BroadcastChannel('sonatta_sync');

const CORES = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    alunosAtivos: 0,
    receitasMes: 0,
    despesasMes: 0,
    saldoCaixa: 0,
    dadosGraficoPizza: []
  });

  const [metricasProfessores, setMetricasProfessores] = useState({ total_professores: 0, professores_ativos: 0 });
  const [alertasFrequencia, setAlertasFrequencia] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [executandoRotina, setExecutandoRotina] = useState(false);

  const forcarViradaMes = async () => {
    const mesAtualStr = `${new Date().getFullYear()}-${new Date().getMonth()}`;
    const ultimaVirada = localStorage.getItem('@sonatta:ultima_virada');
    
    if (ultimaVirada === mesAtualStr) {
      alert('ação já realizada');
      return;
    }

    if (!window.confirm('Tem certeza que deseja executar a virada do mês?\n\nIsso redefinirá a quantidade de aulas dos alunos, marcará as mensalidades ativas como pendentes e mudará os recebimentos "Pagos" para "Concluídos".\n\nATENÇÃO: Recomendado apenas caso a automação do sistema tenha falhado.')) return;
    
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    setExecutandoRotina(true);
    try {
      const resposta = await fetch(`${API_URL}/api/dashboard/forcar-virada-mes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const dados = await resposta.json();
      if (resposta.ok) {
        localStorage.setItem('@sonatta:ultima_virada', mesAtualStr);
        alert('Rotina mensal executada com sucesso!');
        carregarDadosDashboard();
      } else {
        alert(`Erro: ${dados.erro}`);
      }
    } catch (erro) {
      console.error("Erro ao forçar virada de mês:", erro);
      alert('Erro de conexão ao forçar virada de mês.');
    } finally {
      setExecutandoRotina(false);
    }
  };

  const carregarDadosDashboard = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      setCarregando(true);
      
      // Carregar métricas gerais
      const resposta = await fetch(`${API_URL}/api/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!resposta.ok) throw new Error("Falha ao buscar métricas");
      
      const dados = await resposta.json();
      setMetricas(dados);

      // Carrega indicadores de professores em paralelo
      try {
        const resProf = await fetch(`${API_URL}/api/dashboard/professores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resProf.ok) setMetricasProfessores(await resProf.json());
      } catch {}

      // Carrega alertas de frequência em paralelo
      try {
        const resFreq = await fetch(`${API_URL}/api/frequencia-turma`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resFreq.ok) {
          const dadosFreq = await resFreq.json();
          if (dadosFreq.turma) {
            const alunosEmAlerta = dadosFreq.turma.filter(a => a.status_alerta === 'BAIXA_FREQUENCIA' || a.status_alerta === 'ATENCAO');
            // Ordenar por menor frequência primeiro
            alunosEmAlerta.sort((a, b) => a.percentual_frequencia - b.percentual_frequencia);
            setAlertasFrequencia(alunosEmAlerta);
          }
        }
      } catch {}

    } catch (erro) {
      console.error("Erro ao carregar dashboard:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosDashboard();

    // Escuta atualizações de outras páginas
    const escutarCanal = (evento) => {
      if (evento.data === 'atualizar_dados') {
        carregarDadosDashboard();
      }
    };

    // Escuta quando dashboard fica ativo
    const escutarSincronizacao = (evento) => {
      if (evento.data.tipo === 'muda_aba' && evento.data.aba === 'dashboard') {
        carregarDadosDashboard();
      }
    };

    canalComunicacao.addEventListener('message', escutarCanal);
    canalSincronizacao.addEventListener('message', escutarSincronizacao);
    
    return () => {
      canalComunicacao.removeEventListener('message', escutarCanal);
      canalSincronizacao.removeEventListener('message', escutarSincronizacao);
    };
  }, []);

  const dadosCaixa = useMemo(() => {
    return [
      { name: 'Receitas', value: Number(metricas.receitasMes) || 0, fill: '#10b981' },
      { name: 'Despesas', value: Number(metricas.despesasMes) || 0, fill: '#f43f5e' }
    ];
  }, [metricas.receitasMes, metricas.despesasMes]);

  const hasCaixaData = useMemo(() => {
    return (Number(metricas.receitasMes) || 0) > 0 || (Number(metricas.despesasMes) || 0) > 0;
  }, [metricas.receitasMes, metricas.despesasMes]);

  const dadosGrafico = useMemo(() => {
    return metricas.dadosGraficoPizza || [];
  }, [metricas.dadosGraficoPizza]);

  if (carregando) {
    return <div className="flex-1 p-4 md:p-8 text-zinc-500">Carregando painel...</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-zinc-950 text-white overflow-y-auto min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-zinc-400 mt-1">Visão geral do desempenho e saúde financeira.</p>
        </div>
        {new Date().getDate() <= 5 && (
          <button
            onClick={forcarViradaMes}
            disabled={executandoRotina}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2 shadow-sm"
          >
            {executandoRotina ? 'Executando...' : 'Executar Virada do Mês'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <span className="text-xs font-semibold uppercase text-zinc-500 block mb-1">Alunos Ativos</span>
          <span className="text-3xl font-bold text-zinc-100">{metricas.alunosAtivos}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <span className="text-xs font-semibold uppercase text-zinc-500 block mb-1">Entradas (Mês)</span>
          <span className="text-3xl font-bold text-emerald-400">R$ {Number(metricas.receitasMes).toFixed(2)}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <span className="text-xs font-semibold uppercase text-zinc-500 block mb-1">Saídas (Mês)</span>
          <span className="text-3xl font-bold text-rose-400">R$ {Number(metricas.despesasMes).toFixed(2)}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <span className="text-xs font-semibold uppercase text-zinc-500 block mb-1">Saldo Acumulado</span>
          <span className={`text-3xl font-bold ${metricas.saldoCaixa >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {Number(metricas.saldoCaixa).toFixed(2)}
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <span className="text-xs font-semibold uppercase text-zinc-500 block mb-1">Professores</span>
          <span className="text-3xl font-bold text-blue-400">{metricasProfessores.total_professores}</span>
          <span className="text-xs text-zinc-600 block mt-1">{metricasProfessores.professores_ativos} ativo(s)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Financeira (Últimos 6 meses) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl lg:col-span-2">
          <h2 className="text-base font-semibold text-zinc-200 mb-6">Evolução Financeira (Últimos 6 meses)</h2>
          {!metricas.dadosGraficoBarras || metricas.dadosGraficoBarras.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-zinc-500 text-sm">
              Sem movimentações financeiras este mês
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas.dadosGraficoBarras} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alertas de Frequência */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <span className="text-amber-500">⚠️</span> Alertas de Frequência
            </h2>
            <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">
              {alertasFrequencia.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
            {alertasFrequencia.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-zinc-500 text-sm text-center">
                Todos os alunos com frequência regular!
              </div>
            ) : (
              alertasFrequencia.map(aluno => (
                <div key={aluno.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200">{aluno.nome}</h3>
                      <p className="text-xs text-zinc-500">{aluno.instrumento || 'Instrumento não definido'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      aluno.status_alerta === 'BAIXA_FREQUENCIA' 
                        ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50' 
                        : 'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                    }`}>
                      {aluno.percentual_frequencia}% freq.
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50">
                    <div className="text-[10px] text-zinc-400">
                      {aluno.ausentes} faltas em {aluno.total_aulas} aulas
                    </div>
                    <button 
                      onClick={() => window.location.href = '/alunos'}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      Ver Perfil &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribuição por Instrumento */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-base font-semibold text-zinc-200 mb-6">Alunos por Instrumento</h2>
          {dadosGrafico.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-zinc-500 text-sm">
              Sem dados de alunos ativos
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dadosGrafico}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`${value} aluno(s)`, 'Quantidade']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Movimentação de Alunos (Entradas x Saídas) */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <h2 className="text-base font-semibold text-zinc-200 mb-6">Movimentação de Alunos (Últimos 12 meses)</h2>
        {!metricas.dadosGraficoMovimentacao || metricas.dadosGraficoMovimentacao.length === 0 ? (
          <div className="flex items-center justify-center h-72 text-zinc-500 text-sm">
            Sem dados de movimentação
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricas.dadosGraficoMovimentacao} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Saidas" name="Saídas" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

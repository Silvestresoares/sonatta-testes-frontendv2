import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { TrendingUp, Activity, PieChart as PieChartIcon, X, Users, TrendingDown, Wallet, GraduationCap } from 'lucide-react';

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
  const [modalAberto, setModalAberto] = useState(null);

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
    <div 
      className="flex-1 text-white overflow-y-auto min-h-screen relative"
      style={{ 
        backgroundImage: `url('/dashboard_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay escuro para garantir legibilidade dos cards */}
      <div className="absolute inset-0 bg-black/50 z-0 pointer-events-none"></div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-zinc-400 mt-1">Visão geral do desempenho e saúde financeira.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setModalAberto('financeiro')}
            className="bg-transparent hover:bg-white/5 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2 shadow-sm"
          >
            <TrendingUp size={16} className="text-emerald-500" />
            Gráfico Financeiro
          </button>
          <button 
            onClick={() => setModalAberto('movimentacao')}
            className="bg-transparent hover:bg-white/5 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2 shadow-sm"
          >
            <Activity size={16} className="text-blue-500" />
            Movimentação Alunos
          </button>
          <button 
            onClick={() => setModalAberto('instrumentos')}
            className="bg-transparent hover:bg-white/5 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2 shadow-sm"
          >
            <PieChartIcon size={16} className="text-amber-500" />
            Alunos por Instrumento
          </button>
          {new Date().getDate() <= 5 && (
            <button
              onClick={forcarViradaMes}
              disabled={executandoRotina}
              className="bg-transparent hover:bg-amber-500/10 disabled:opacity-50 text-amber-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-500/30 flex items-center gap-2 shadow-sm"
            >
              {executandoRotina ? 'Executando...' : 'Executar Virada do Mês'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-transparent p-5 rounded-xl flex items-center gap-4 transition-all hover:bg-white/5">
          <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-1">Alunos Ativos</span>
            <span className="text-2xl font-bold text-white">{metricas.alunosAtivos}</span>
          </div>
        </div>
        <div className="bg-transparent p-5 rounded-xl flex items-center gap-4 transition-all hover:bg-white/5">
          <div className="bg-emerald-500/20 p-3 rounded-lg text-emerald-400 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-1">Entradas (Mês)</span>
            <span className="text-2xl font-bold text-emerald-400">R$ {Number(metricas.receitasMes).toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-transparent p-5 rounded-xl flex items-center gap-4 transition-all hover:bg-white/5">
          <div className="bg-rose-500/20 p-3 rounded-lg text-rose-400 shrink-0">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-1">Saídas (Mês)</span>
            <span className="text-2xl font-bold text-rose-400">R$ {Number(metricas.despesasMes).toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-transparent p-5 rounded-xl flex items-center gap-4 transition-all hover:bg-white/5">
          <div className="bg-amber-500/20 p-3 rounded-lg text-amber-400 shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-1">Saldo</span>
            <span className={`text-2xl font-bold ${metricas.saldoCaixa >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {Number(metricas.saldoCaixa).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="bg-transparent p-5 rounded-xl flex items-center gap-4 transition-all hover:bg-white/5">
          <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400 shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-zinc-400 block mb-1">Professores</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metricasProfessores.total_professores}</span>
              <span className="text-xs text-zinc-400">{metricasProfessores.professores_ativos} ativos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Alertas de Frequência */}
        <div className="relative bg-transparent p-6 rounded-xl overflow-hidden">
          
          <div className="flex items-center gap-3 mb-6 mt-2">
            <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <span className="text-amber-500 text-lg">⚠️</span> Alertas de Frequência
            </h2>
            <span className="text-xs font-semibold bg-white/5 text-zinc-300 px-3 py-1 rounded-full border border-white/10">
              {alertasFrequencia.length} Alerta(s)
            </span>
          </div>
          
          <div className="w-full">
            {alertasFrequencia.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-zinc-500 text-sm text-center">
                Todos os alunos com frequência regular!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {alertasFrequencia.map(aluno => (
                  <div key={aluno.id} className="bg-transparent border border-white/10 p-4 rounded-xl flex flex-col gap-3 transition-colors hover:bg-white/5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-zinc-200 truncate">{aluno.nome}</h3>
                        <p className="text-xs text-zinc-500 truncate">{aluno.instrumento || 'Instrumento não definido'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        aluno.status_alerta === 'BAIXA_FREQUENCIA' 
                          ? 'bg-rose-950/50 text-rose-400 border border-rose-900/50' 
                          : 'bg-amber-950/50 text-amber-400 border border-amber-900/50'
                      }`}>
                        {aluno.percentual_frequencia}% freq.
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/50">
                      <div className="text-xs font-medium text-zinc-400">
                        {aluno.ausentes} <span className="text-zinc-600 font-normal">faltas em</span> {aluno.total_aulas} <span className="text-zinc-600 font-normal">aulas</span>
                      </div>
                      <button 
                        onClick={() => window.location.href = '/alunos'}
                        className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
                      >
                        Ver Perfil &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Modais Flutuantes de Gráficos */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300">
          <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-5xl p-8 relative flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setModalAberto(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-md p-2 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6 pr-10">
              {modalAberto === 'financeiro' 
                ? 'Evolução Financeira (Últimos 6 meses)' 
                : modalAberto === 'movimentacao' 
                  ? 'Movimentação de Alunos (Últimos 12 meses)' 
                  : 'Alunos por Instrumento'}
            </h2>
            
            <div className="h-[60vh] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {modalAberto === 'financeiro' && (
                  <AreaChart data={metricas.dadosGraficoBarras} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => [`R$ ${Number(value).toFixed(2)}`]}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceitas)" />
                    <Area type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesas)" />
                  </AreaChart>
                )}

                {modalAberto === 'movimentacao' && (
                  <AreaChart data={metricas.dadosGraficoMovimentacao} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntradas)" />
                    <Area type="monotone" dataKey="Saidas" name="Saídas" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSaidas)" />
                  </AreaChart>
                )}

                {modalAberto === 'instrumentos' && (
                  <BarChart
                    layout="vertical"
                    data={dadosGrafico}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" stroke="#71717a" tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#71717a" tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => [`${value} aluno(s)`, 'Quantidade']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {dadosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

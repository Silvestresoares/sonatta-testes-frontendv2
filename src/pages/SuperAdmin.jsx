import React, { useState, useEffect } from 'react';
import { Crown, Search, Edit2, X, Save, AlertCircle } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function SuperAdmin({ onLogout }) {
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'em_dia', 'a_vencer', 'vencidas'
  
  // Modal State
  const [escolaEditando, setEscolaEditando] = useState(null);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const token = localStorage.getItem('@sonatta:token');

  const buscarEscolas = async () => {
    try {
      setLoading(true);
      const resposta = await fetch(`${API_URL}/api/super-admin/escolas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resposta.ok) throw new Error('Falha ao carregar as escolas.');
      const dados = await resposta.json();
      setEscolas(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarEscolas();
  }, []);

  const escolasFiltradas = escolas.filter(e => {
    // 1. Filtro por termo de busca
    const matchBusca = e.nome_escola?.toLowerCase().includes(termoBusca.toLowerCase()) || 
                       e.email?.toLowerCase().includes(termoBusca.toLowerCase());
    
    if (!matchBusca) return false;

    // 2. Filtro por Status
    if (filtroStatus === 'todas') return true;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = e.data_vencimento_assinatura ? new Date(e.data_vencimento_assinatura) : null;
    if (vencimento) vencimento.setUTCHours(0,0,0,0);

    const isVitalicio = e.plano === 'Vitalicio';
    const isVencida = !isVitalicio && vencimento && vencimento < hoje;
    
    const diasDiferenca = (!isVitalicio && vencimento) ? Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24)) : null;
    const isAVencer = diasDiferenca !== null && diasDiferenca >= 0 && diasDiferenca <= 3;
    const isEmDia = isVitalicio || (diasDiferenca !== null && diasDiferenca > 3);

    if (filtroStatus === 'vencidas') return isVencida;
    if (filtroStatus === 'a_vencer') return isAVencer;
    if (filtroStatus === 'em_dia') return isEmDia;

    return true;
  });

  const abrirModalEdicao = (escola) => {
    setEscolaEditando(escola);
    setPlanoSelecionado(escola.plano || 'Mensal');
    setDataVencimento(escola.data_vencimento_assinatura ? escola.data_vencimento_assinatura.split('T')[0] : '');
  };

  const salvarAssinatura = async () => {
    try {
      const resposta = await fetch(`${API_URL}/api/super-admin/escolas/${escolaEditando.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          plano: planoSelecionado,
          data_vencimento_assinatura: dataVencimento
        })
      });

      if (!resposta.ok) {
        const errData = await resposta.json();
        throw new Error(errData.erro || 'Falha ao salvar assinatura.');
      }

      setEscolaEditando(null);
      buscarEscolas(); // Atualiza a lista
    } catch (err) {
      alert(err.message);
    }
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const escolasVencidas = escolas.filter(e => {
    if (e.plano === 'Vitalicio' || !e.data_vencimento_assinatura) return false;
    const vencimento = new Date(e.data_vencimento_assinatura);
    vencimento.setUTCHours(0,0,0,0);
    return vencimento < hoje;
  }).length;

  const escolasAVencer = escolas.filter(e => {
    if (e.plano === 'Vitalicio' || !e.data_vencimento_assinatura) return false;
    const vencimento = new Date(e.data_vencimento_assinatura);
    vencimento.setUTCHours(0,0,0,0);
    const diasDiferenca = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    return diasDiferenca >= 0 && diasDiferenca <= 3;
  }).length;

  const obterClasseStatusLinha = (escola) => {
    if (escola.plano === 'Vitalicio' || !escola.data_vencimento_assinatura) return 'hover:bg-zinc-800/30 border-l-4 border-transparent';
    const vencimento = new Date(escola.data_vencimento_assinatura);
    vencimento.setUTCHours(0,0,0,0);
    
    if (vencimento < hoje) {
      return 'bg-rose-500/10 hover:bg-rose-500/20 border-l-4 border-rose-500';
    }
    
    const diasDiferenca = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    if (diasDiferenca >= 0 && diasDiferenca <= 3) {
      return 'bg-amber-500/10 hover:bg-amber-500/20 border-l-4 border-amber-500';
    }
    
    return 'hover:bg-zinc-800/30 border-l-4 border-transparent';
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950">
      <header className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
            <Crown size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin</h1>
            <p className="text-zinc-400 text-sm">Gerenciamento global de assinaturas</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Sair do Painel
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Cards de Alerta de Assinatura */}
          {(escolasVencidas > 0 || escolasAVencer > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {escolasVencidas > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-rose-400 uppercase tracking-wide">Assinaturas Vencidas</p>
                    <p className="text-2xl font-bold text-white mt-1">{escolasVencidas}</p>
                  </div>
                  <div className="h-12 w-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
                    <AlertCircle size={24} />
                  </div>
                </div>
              )}
              
              {escolasAVencer > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-400 uppercase tracking-wide">A Vencer (em até 3 dias)</p>
                    <p className="text-2xl font-bold text-white mt-1">{escolasAVencer}</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
                    <AlertCircle size={24} />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Escolas Cadastradas</h2>
            <div className="flex items-center gap-3">
              <select 
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              >
                <option value="todas">Todos os Status</option>
                <option value="em_dia">Em Dia</option>
                <option value="a_vencer">A Vencer (até 3 dias)</option>
                <option value="vencidas">Vencidas</option>
              </select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar escola ou email..." 
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {erro && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              {erro}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-zinc-500">Carregando escolas...</div>
          ) : (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50">
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Escola</th>
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Contato</th>
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Plano</th>
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Vencimento</th>
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {escolasFiltradas.map(escola => (
                    <tr key={escola.id} className={`transition-colors ${obterClasseStatusLinha(escola)}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{escola.nome_escola}</div>
                        <div className="text-xs text-zinc-500">ID: {escola.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-300">{escola.email}</div>
                        <div className="text-xs text-zinc-500">Tel: {escola.telefone_comercial || 'Não informado'}</div>
                        {escola.documento && (
                          <div className="text-xs text-zinc-500 mt-0.5">Doc: {escola.documento}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          escola.plano === 'Vitalicio' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {escola.plano}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {escola.plano === 'Vitalicio' ? (
                          <span className="text-zinc-500 text-sm">--/--/----</span>
                        ) : (
                          <span className={`text-sm ${
                            new Date(escola.data_vencimento_assinatura) < new Date() 
                              ? 'text-rose-400 font-bold' 
                              : Math.ceil((new Date(escola.data_vencimento_assinatura) - new Date()) / (1000 * 60 * 60 * 24)) <= 3
                                ? 'text-amber-400 font-bold'
                                : 'text-zinc-300'
                          }`}>
                            {escola.data_vencimento_assinatura ? new Date(escola.data_vencimento_assinatura).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não definido'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => abrirModalEdicao(escola)}
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {escolasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">Nenhuma escola encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição de Assinatura */}
      {escolaEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Editar Assinatura</h2>
              <button onClick={() => setEscolaEditando(null)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Escola</p>
                <p className="font-medium text-white">{escolaEditando.nome_escola}</p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Plano</label>
                <select 
                  value={planoSelecionado}
                  onChange={(e) => setPlanoSelecionado(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Mensal">Mensal</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                  <option value="Vitalicio">Vitalício</option>
                </select>
              </div>

              {planoSelecionado !== 'Vitalicio' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Data de Vencimento</label>
                  <input 
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    No dia seguinte a esta data, a escola será bloqueada e perderá o acesso.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-zinc-800 bg-zinc-900/50">
              <button 
                onClick={() => setEscolaEditando(null)}
                className="px-4 py-2 text-zinc-300 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarAssinatura}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-lg transition-colors"
              >
                <Save size={18} />
                Salvar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

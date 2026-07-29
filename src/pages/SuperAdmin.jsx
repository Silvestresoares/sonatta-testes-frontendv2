import React, { useState, useEffect } from 'react';
import { Crown, Search, Edit2, X, Save, AlertCircle, Lock, Unlock, Trash2, CheckCircle } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function SuperAdmin({ onLogout }) {
  const [escolas, setEscolas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'em_dia', 'a_vencer', 'vencidas'
  const [abaAtual, setAbaAtual] = useState('escolas'); // 'escolas' ou 'avisos'

  // Avisos State
  const [avisos, setAvisos] = useState([]);
  const [novoAvisoTexto, setNovoAvisoTexto] = useState('');
  const [novoAvisoTipo, setNovoAvisoTipo] = useState('info'); // info, alert, success
  
  // Modal State
  const [escolaEditando, setEscolaEditando] = useState(null);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [valorPorAluno, setValorPorAluno] = useState(0);
  const [faturasEscola, setFaturasEscola] = useState([]);
  const [gerandoCobranca, setGerandoCobranca] = useState(false);

  const token = localStorage.getItem('@sonatta:token');

  const buscarEscolas = async () => {
    try {
      setLoading(true);
      await fetch(`${API_URL}/api/super-admin/escolas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setEscolas(data);
          } else {
            throw new Error(data.erro || 'Erro ao carregar escolas.');
          }
        })
        .catch(err => {
          console.error(err);
          setErro(err.message || 'Erro ao carregar escolas.');
        })
        .finally(() => setLoading(false));
    } catch (err) {
      setErro(err.message);
    }
  };

  const buscarAvisos = () => {
    const token = localStorage.getItem('@sonatta:token');
    fetch(`${API_URL}/api/super-admin/avisos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAvisos(data))
      .catch(err => console.error('Erro ao carregar avisos', err));
  };

  useEffect(() => {
    buscarEscolas();
    buscarAvisos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adicionarAviso = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/super-admin/avisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mensagem: novoAvisoTexto, tipo: novoAvisoTipo })
      });
      if (res.ok) {
        setNovoAvisoTexto('');
        buscarAvisos();
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      alert('Erro ao criar aviso');
    }
  };

  const alternarStatusAviso = async (id) => {
    try {
      await fetch(`${API_URL}/api/super-admin/avisos/${id}/alternar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      buscarAvisos();
    } catch (err) { // eslint-disable-line no-unused-vars
      alert('Erro ao alterar status');
    }
  };

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
    setValorPorAluno(escola.valor_por_aluno || 0);
    setFaturasEscola([]);
    buscarFaturas(escola.id);
  };

  const buscarFaturas = async (escolaId) => {
    try {
      const res = await fetch(`${API_URL}/api/super-admin/escolas/${escolaId}/assinaturas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFaturasEscola(data);
      }
    } catch (err) {
      console.error('Erro ao buscar faturas', err);
    }
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
          data_vencimento_assinatura: dataVencimento,
          valor_por_aluno: valorPorAluno
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

  const gerarNovaCobranca = async () => {
    if (!dataVencimento) {
      alert('Informe uma data de vencimento para gerar a cobrança.');
      return;
    }
    
    try {
      setGerandoCobranca(true);
      const res = await fetch(`${API_URL}/api/super-admin/escolas/${escolaEditando.id}/gerar-cobranca`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ data_vencimento: dataVencimento })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Falha ao gerar cobrança.');
      
      alert('Cobrança gerada com sucesso no Asaas!');
      buscarFaturas(escolaEditando.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setGerandoCobranca(false);
    }
  };

  const gerarCobrancaManual = async () => {
    if (!dataVencimento) {
      alert('Informe uma data de vencimento para gerar a cobrança.');
      return;
    }
    
    try {
      setGerandoCobranca(true);
      const res = await fetch(`${API_URL}/api/super-admin/escolas/${escolaEditando.id}/gerar-cobranca-manual`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ data_vencimento: dataVencimento })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Falha ao gerar cobrança manual.');
      
      alert('Cobrança gerada com sucesso! \n\nO código PIX Copia e Cola é:\n\n' + data.pixPayload);
      
      // Opcional: copiar automaticamente para a área de transferência
      try {
        await navigator.clipboard.writeText(data.pixPayload);
        alert('O código PIX foi copiado para sua área de transferência!');
      } catch (err) {
        console.error('Não foi possível copiar automaticamente', err);
      }

      buscarFaturas(escolaEditando.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setGerandoCobranca(false);
    }
  };

  const marcarFaturaPaga = async (faturaId) => {
    if (!window.confirm('Tem certeza que deseja marcar esta fatura como paga? A escola será desbloqueada por mais 1 mês.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/super-admin/escolas/faturas/${faturaId}/marcar-pago`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Falha ao marcar como paga.');
      
      alert('Fatura marcada como paga com sucesso!');
      buscarFaturas(escolaEditando.id);
      buscarEscolas(); // Atualiza a data de vencimento principal
    } catch (err) {
      alert(err.message);
    }
  };

  const excluirFatura = async (faturaId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta cobrança? Ela será excluída do Asaas.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/super-admin/escolas/faturas/${faturaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Falha ao excluir fatura.');
      
      alert('Fatura excluída com sucesso!');
      buscarFaturas(escolaEditando.id);
      buscarEscolas();
    } catch (err) {
      alert(err.message);
    }
  };

  const alternarStatusEscola = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/super-admin/escolas/${id}/alternar-status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        buscarEscolas();
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao alternar status da escola');
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      alert('Erro de conexão ao alternar status da escola');
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
      <header className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
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

      <main className="flex-1 p-6 md:p-8 overflow-auto relative">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Abas */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 border-b border-zinc-800 pb-2">
            <button
              onClick={() => setAbaAtual('escolas')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaAtual === 'escolas' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
            >
              Escolas
            </button>
            <button
              onClick={() => setAbaAtual('avisos')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaAtual === 'avisos' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
            >
              Avisos Globais
            </button>
          </div>

          {/* Cards de Alerta de Assinatura */}
          {abaAtual === 'escolas' && (escolasVencidas > 0 || escolasAVencer > 0) && (
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
          
          {/* Conteúdo Aba Escolas */}
          {abaAtual === 'escolas' && (
            <>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <h2 className="text-lg font-semibold text-white">Escolas Cadastradas</h2>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <select 
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full sm:w-auto bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  >
                    <option value="todas">Todos os Status</option>
                    <option value="em_dia">Em Dia</option>
                    <option value="a_vencer">A Vencer (até 3 dias)</option>
                    <option value="vencidas">Vencidas</option>
                  </select>
                  <div className="relative w-full sm:w-64">
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-800/50">
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Escola</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Contato</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Plano</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Vencimento</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Fatura Atual</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {escolasFiltradas.map(escola => (
                        <tr key={escola.id} className={`transition-colors ${obterClasseStatusLinha(escola)}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{escola.nome_escola}</span>
                              {escola.ativa === false && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-500 text-[10px] font-bold rounded uppercase">Bloqueada</span>}
                            </div>
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
                          <td className="px-6 py-4">
                            {escola.ultimo_status_fatura ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  escola.ultimo_status_fatura === 'Pago' ? 'bg-emerald-500/20 text-emerald-400' :
                                  escola.ultimo_status_fatura === 'Atrasado' ? 'bg-rose-500/20 text-rose-400' :
                                  'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {escola.ultimo_status_fatura}
                                </span>
                                {escola.ultima_fatura_url && (
                                  <a href={escola.ultima_fatura_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">
                                    Ver boleto
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-500">Nenhuma gerada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => alternarStatusEscola(escola.id)}
                                title={escola.ativa ? "Bloquear Acesso" : "Liberar Acesso"}
                                className={`p-2 rounded-lg transition-colors ${
                                  escola.ativa 
                                  ? 'text-rose-400 hover:text-white hover:bg-rose-500/80' 
                                  : 'text-emerald-400 hover:text-white hover:bg-emerald-500/80'
                                }`}
                              >
                                {escola.ativa ? <Lock size={18} /> : <Unlock size={18} />}
                              </button>
                              <button 
                                onClick={() => abrirModalEdicao(escola)}
                                title="Editar Assinatura"
                                className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                            </div>
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
                </div>
              )}
            </>
          )}

          {/* Conteúdo Aba Avisos */}
          {abaAtual === 'avisos' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Novo Aviso Global</h2>
                <form onSubmit={adicionarAviso} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Mensagem do Aviso</label>
                    <textarea 
                      required
                      value={novoAvisoTexto}
                      onChange={e => setNovoAvisoTexto(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 min-h-[100px]"
                      placeholder="Ex: O sistema passará por manutenção hoje às 23h..."
                    ></textarea>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                    <div className="w-full sm:w-48">
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo / Cor</label>
                      <select 
                        value={novoAvisoTipo}
                        onChange={e => setNovoAvisoTipo(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 h-[42px]"
                      >
                        <option value="info">Informação (Azul)</option>
                        <option value="alert">Alerta (Vermelho)</option>
                        <option value="success">Sucesso (Verde)</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors h-[42px]">
                      Publicar Aviso
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="font-semibold text-white">Avisos Recentes</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                  {avisos.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500">Nenhum aviso encontrado.</div>
                  ) : (
                    avisos.map(aviso => (
                      <div key={aviso.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2 hover:bg-zinc-800/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                              aviso.tipo === 'alert' ? 'bg-red-500/20 text-red-400' :
                              aviso.tipo === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {aviso.tipo}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {new Date(aviso.data_criacao).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className={`text-sm ${aviso.ativo ? 'text-white' : 'text-zinc-500 line-through'}`}>
                            {aviso.mensagem}
                          </p>
                        </div>
                        <button 
                          onClick={() => alternarStatusAviso(aviso.id)}
                          className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            aviso.ativo 
                            ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          }`}
                        >
                          {aviso.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

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
                  <option value="Automático">Automático (Pacotes por quantidade)</option>
                  <option value="Personalizado">Personalizado (Fixo)</option>
                  <option value="Vitalicio">Vitalício</option>
                </select>
              </div>

              {planoSelecionado !== 'Vitalicio' && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-zinc-400 mb-1">Data de Vencimento</label>
                      <input 
                        type="date"
                        value={dataVencimento}
                        onChange={(e) => setDataVencimento(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-zinc-400 mb-1">Valor do Plano (R$)</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorPorAluno}
                        onChange={(e) => setValorPorAluno(e.target.value)}
                        disabled={planoSelecionado === 'Automático'}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {planoSelecionado === 'Automático' 
                      ? 'O valor é calculado e atualizado automaticamente de acordo com o pacote de alunos da escola.' 
                      : 'O valor da cobrança será exatamente este valor fixado.'}
                  </p>

                  <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-white">Histórico de Cobranças</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={gerarCobrancaManual}
                          disabled={gerandoCobranca}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                          Gerar PIX
                        </button>
                        <button 
                          onClick={gerarNovaCobranca}
                          disabled={gerandoCobranca}
                          className="text-xs bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                          {gerandoCobranca ? 'Gerando...' : 'Gerar Via Asaas'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {faturasEscola.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-4">Nenhuma cobrança registrada.</p>
                      ) : (
                        faturasEscola.map(fatura => (
                          <div key={fatura.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {Number(fatura.valor).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                              </p>
                              <p className="text-xs text-zinc-400">
                                Venc: {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                fatura.status === 'Pago' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {fatura.status}
                              </span>
                              {fatura.asaas_invoice_url ? (
                                <a href={fatura.asaas_invoice_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">
                                  Ver Fatura Asaas
                                </a>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-medium bg-zinc-800 px-2 py-0.5 rounded">
                                  Fatura Manual (PIX Offline)
                                </span>
                              )}
                            </div>
                            <div className="ml-3 pl-3 border-l border-zinc-700/50 flex items-center gap-1">
                              {fatura.status !== 'Pago' && !fatura.asaas_invoice_url && (
                                <button 
                                  onClick={() => marcarFaturaPaga(fatura.id)}
                                  title="Marcar como Pago (Liberar Escola)"
                                  className="text-zinc-400 hover:text-emerald-400 p-1.5 rounded-md hover:bg-emerald-500/10 transition-colors"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {fatura.status !== 'Pago' && (
                                <button 
                                  onClick={() => excluirFatura(fatura.id)}
                                  title="Cancelar / Excluir Cobrança"
                                  className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
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

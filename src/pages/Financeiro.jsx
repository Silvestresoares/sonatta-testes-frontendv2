import React, { useState, useEffect, useMemo } from 'react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);
const canalComunicacao = new BroadcastChannel('sonatta_updates');
const canalSincronizacao = new BroadcastChannel('sonatta_sync');

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState('mensalidades'); // 'mensalidades', 'lancamentos' ou 'professores'
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [professoresFinanceiro, setProfessoresFinanceiro] = useState([]);
  const [carregandoProfessores, setCarregandoProfessores] = useState(false);
  const [resumoFinanceiro, setResumoFinanceiro] = useState({ receitas: 0, despesas: 0, saldo: 0, total_lancamentos: 0 });

  // Paginação Frontend
  const [paginaAlunos, setPaginaAlunos] = useState(1);
  const [paginaTransacoes, setPaginaTransacoes] = useState(1);
  const limite = 20;

  // Estados para Registro de Pagamento de Repasse (Professores)
  const [modalRepasseAberto, setModalRepasseAberto] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);
  const [formaPagamentoRepasse, setFormaPagamentoRepasse] = useState('Pix');
  const [observacaoRepasse, setObservacaoRepasse] = useState('');
  const [salvandoRepasse, setSalvandoRepasse] = useState(false);

  // Filtros de Data
  const agora = new Date();
  const mesAtualReal = agora.getMonth() + 1;
  const anoAtualReal = agora.getFullYear();

  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  // Verifica se o mês selecionado é o mês atual "real"
  const isMesAtual = useMemo(() => {
    const agora = new Date();
    return Number(mesFiltro) === (agora.getMonth() + 1) && Number(anoFiltro) === agora.getFullYear();
  }, [mesFiltro, anoFiltro]);

  // Verifica se o mês selecionado é um mês passado
  const isMesPassado = useMemo(() => {
    return (Number(anoFiltro) < anoAtualReal) || (Number(anoFiltro) === anoAtualReal && Number(mesFiltro) < mesAtualReal);
  }, [mesFiltro, anoFiltro]);

  // Verifica se o mês selecionado é um mês futuro
  const isMesFuturo = useMemo(() => {
    return (Number(anoFiltro) > anoAtualReal) || (Number(anoFiltro) === anoAtualReal && Number(mesFiltro) > mesAtualReal);
  }, [mesFiltro, anoFiltro]);

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    descricao: '',
    tipo: 'Receita',
    valor: '',
    data: '',
    status: 'Pago'
  });
  
  // Estados para edição
  const [editandoId, setEditandoId] = useState(null);

  // 📚 Carregar alunos
  const carregarAlunos = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;
    try {
      const resposta = await fetch(`${API_URL}/api/alunos`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dados = await resposta.json();
      setAlunos(Array.isArray(dados) ? dados.filter(a => a.status === 'Ativo' && a.mensalidade) : []);
    } catch (erro) {
      console.error("Erro ao buscar alunos:", erro);
    }
  };

  const carregarFinanceiro = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const params = new URLSearchParams({
        mes: String(mesFiltro),
        ano: String(anoFiltro),
        busca,
        tipo: filtroTipo === 'Todos' ? '' : filtroTipo,
        status: filtroStatus === 'Todos' ? '' : filtroStatus,
        dataInicio,
        dataFim
      });

      const [resposta, resumoResp] = await Promise.all([
        fetch(`${API_URL}/api/financeiro?${params.toString()}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/financeiro/resumo?${params.toString()}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (resposta.status === 403) {
        console.error('Acesso negado: Token inválido ou expirado.');
        setTransacoes([]);
        setResumoFinanceiro({ receitas: 0, despesas: 0, saldo: 0, total_lancamentos: 0 });
        return;
      }

      const dados = await resposta.json();
      const resumo = resumoResp.ok ? await resumoResp.json() : { receitas: 0, despesas: 0, saldo: 0, total_lancamentos: 0 };

      // Se for o mês atual, não mostramos as mensalidades em 'Outros Lançamentos' (pois já estão na aba Mensalidades)
      // Se for mês passado, mostramos, pois elas formam o histórico
      const isCurrentMonth = Number(mesFiltro) === (new Date().getMonth() + 1) && Number(anoFiltro) === new Date().getFullYear();
      setTransacoes(
        Array.isArray(dados)
          ? dados.filter(t => isCurrentMonth ? !t.aluno_id : true)
          : []
      );
      setResumoFinanceiro(resumo);
    } catch (erro) {
      console.error('Erro ao buscar dados financeiros:', erro);
      setTransacoes([]);
      setResumoFinanceiro({ receitas: 0, despesas: 0, saldo: 0, total_lancamentos: 0 });
    }
  };

  const carregarFinanceiroProfessores = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;
    setCarregandoProfessores(true);
    try {
      const resProfs = await fetch(`${API_URL}/api/professores`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resProfs.ok) throw new Error();
      const profs = await resProfs.json();
      
      const promessas = profs.map(async (prof) => {
        const resFin = await fetch(`${API_URL}/api/professores/${prof.id}/financeiro?mes=${mesFiltro}&ano=${anoFiltro}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resFin.ok) {
          return await resFin.json();
        }
        return null;
      });
      const resultados = await Promise.all(promessas);
      setProfessoresFinanceiro(resultados.filter(r => r !== null));
    } finally {
      setCarregandoProfessores(false);
    }
  };

  const abrirModalRepasse = (profData) => {
    setProfessorSelecionado(profData);
    setFormaPagamentoRepasse('Pix');
    setObservacaoRepasse('');
    setModalRepasseAberto(true);
  };

  const registrarPagamentoRepasse = async () => {
    if (!professorSelecionado) return;
    setSalvandoRepasse(true);
    const token = localStorage.getItem('@sonatta:token');
    try {
      const prof = professorSelecionado.professor;
      const valor = professorSelecionado.tipo_remuneracao === 'comissao'
        ? professorSelecionado.repasse_pendente_valor
        : professorSelecionado.total_a_pagar;

      const resposta = await fetch(`${API_URL}/api/professores/${prof.id}/repasse/pagar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mes: mesFiltro,
          ano: anoFiltro,
          forma_pagamento: formaPagamentoRepasse,
          observacao: observacaoRepasse,
          valor
        })
      });

      if (resposta.ok) {
        setModalRepasseAberto(false);
        setProfessorSelecionado(null);
        carregarFinanceiroProfessores();
        canalComunicacao.postMessage('atualizar_dados');
      } else {
        const err = await resposta.json();
        alert(err.erro || 'Erro ao registrar pagamento.');
      }
    } catch (erro) {
      alert('Erro de conexão ao registrar pagamento.');
    } finally {
      setSalvandoRepasse(false);
    }
  };

  useEffect(() => {
    carregarFinanceiro();
    carregarAlunos();
    carregarFinanceiroProfessores();
  }, [mesFiltro, anoFiltro, busca, filtroTipo, filtroStatus, dataInicio, dataFim]);

  // Alterna automaticamente para a aba de lançamentos ao consultar histórico
  useEffect(() => {
    if (!isMesAtual && abaSelecionada === 'mensalidades') {
      setAbaSelecionada('lancamentos');
    }
  }, [isMesAtual, abaSelecionada]);

  // Resetar páginas ao trocar de aba ou mês
  useEffect(() => {
    setPaginaAlunos(1);
    setPaginaTransacoes(1);
  }, [abaSelecionada, mesFiltro, anoFiltro]);

  useEffect(() => {
    // Escuta mensagens de outras páginas
    const escutarCanal = (evento) => {
      const msg = evento.data;
      if (msg === 'atualizar_dados' || msg.tipo === 'aula-criada' || msg.tipo === 'aula-removida') {
        carregarFinanceiro();
        carregarAlunos();
        carregarFinanceiroProfessores();
      }
    };

    // Escuta quando a aba de financeiro fica ativa
    const escutarSincronizacao = (evento) => {
      if (evento.data.tipo === 'muda_aba' && evento.data.aba === 'financeiro') {
        carregarFinanceiro();
        carregarAlunos();
        carregarFinanceiroProfessores();
      }
    };

    canalComunicacao.addEventListener('message', escutarCanal);
    canalSincronizacao.addEventListener('message', escutarSincronizacao);

    return () => {
      canalComunicacao.removeEventListener('message', escutarCanal);
      canalSincronizacao.removeEventListener('message', escutarSincronizacao);
    };
  }, []);

  // 💰 Alternar status de mensalidade de um aluno
  const alternarStatusMensalidade = async (alunoId, alunoNome, statusAtual) => {
    const token = localStorage.getItem('@sonatta:token');
    const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
    const dataPagamento = novoStatus === 'Pago' ? new Date().toISOString().split('T')[0] : null;
    
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/aluno-${alunoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus })
      });
      if (resposta.ok) {
        setAlunos(prev => prev.map(a => 
          a.id === alunoId ? { ...a, status_mensalidade: novoStatus, data_pagamento_mensalidade: dataPagamento } : a
        ));
        canalComunicacao.postMessage('atualizar_dados');
      } else {
        const erroData = await resposta.json();
        alert(`Erro ao atualizar status: ${erroData.erro || 'Erro desconhecido'}`);
      }
    } catch (erro) { console.error(erro); }
  };

  const alternarStatusLancamento = async (id, statusAtual) => {
    const token = localStorage.getItem('@sonatta:token');
    const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus })
      });
      if (resposta.ok) {
        setTransacoes(prev => prev.map(t => (t.id === id ? { ...t, status: novoStatus } : t)));
        canalComunicacao.postMessage('atualizar_dados');
      }
    } catch (erro) { console.error(erro); }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditandoId(null);
    setErro('');
    setFormData({
      descricao: '',
      tipo: 'Receita',
      valor: '',
      data: '',
      status: 'Pago'
    });
  };

  const handleNovoLancamento = async (e) => {
    e.preventDefault();
    setSubmetendo(true);
    setErro('');
    const token = localStorage.getItem('@sonatta:token');
    try {
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor)
      };

      if (editandoId) {
        // Editar lançamento existente
        const resposta = await fetch(`${API_URL}/api/financeiro/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        if (resposta.ok) {
          carregarFinanceiro();
          fecharModal();
          canalComunicacao.postMessage('atualizar_dados');
        }
      } else {
        // Criar novo lançamento
        const resposta = await fetch(`${API_URL}/api/financeiro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        if (resposta.ok) {
          carregarFinanceiro();
          fecharModal();
          canalComunicacao.postMessage('atualizar_dados');
        }
      }
    } catch (err) {
      setErro('Erro ao processar o lançamento. Verifique os dados.');
    } finally {
      setSubmetendo(false);
    }
  };

  // 🗑️ Deletar lançamento
  const handleDeletarLancamento = async (id, descricao) => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return alert("Sessão expirada.");

    if (window.confirm(`Tem certeza que deseja remover o lançamento "${descricao}"?`)) {
      try {
        const resposta = await fetch(`${API_URL}/api/financeiro/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
          setTransacoes(prev => prev.filter(t => t.id !== id));
          canalComunicacao.postMessage('atualizar_dados');
          alert('Lançamento excluído com sucesso!');
        } else {
          alert('Erro ao excluir lançamento.');
        }
      } catch (erro) {
        console.error('Erro ao deletar lançamento:', erro);
        alert('Erro de conexão ao deletar.');
      }
    }
  };

  // ✏️ Abrir modal para editar lançamento
  const handleEditarLancamento = (lancamento) => {
    setEditandoId(lancamento.id);
    setFormData({
      descricao: lancamento.descricao,
      tipo: lancamento.tipo,
      valor: lancamento.valor.toString(),
      data: lancamento.data,
      status: lancamento.status
    });
    setAbaSelecionada('lancamentos');
    setModalAberto(true);
  };

  const formatarData = (d) => {
    if (!d) return '-';
    const dataLimpa = String(d).split('T')[0];
    return dataLimpa.split('-').reverse().join('/');
  };

  // ✨ Calcular valor total baseado em quantidade_aulas
  const calcularValorTotal = (mensalidade, quantidadeAulas = 4) => {
    const mensalidadeBase = Number(mensalidade) || 0;
    const qtdAulas = Math.max(Number(quantidadeAulas) || 4, 1);
    const valorPorAula = mensalidadeBase / 4;
    
    if (qtdAulas <= 4) {
      return valorPorAula * qtdAulas;
    } else {
      return mensalidadeBase + (valorPorAula * (qtdAulas - 4));
    }
  };

  // Calcular estatísticas
  // Só calculamos mensalidades se estivermos vendo o mês atual, pois não temos histórico de alunos em meses passados/futuros
  const totalMensalidades = isMesAtual ? alunos.reduce((sum, a) => sum + calcularValorTotal(a.mensalidade, a.quantidade_aulas), 0) : 0;
  const mensalidadesPagas = isMesAtual ? alunos.filter(a => a.status_mensalidade === 'Pago').reduce((sum, a) => sum + calcularValorTotal(a.mensalidade, a.quantidade_aulas), 0) : 0;
  const mensalidadesPendentes = totalMensalidades - mensalidadesPagas;

  // Outros Lançamentos:
  let receitasOutros = 0;
  let despesasOutros = 0;

  if (isMesAtual) {
    // Para o mês atual, consideramos apenas lançamentos com status 'Pago'
    receitasOutros = transacoes.filter(t => t.tipo === "Receita" && t.status === "Pago" && !t.aluno_id).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    despesasOutros = transacoes.filter(t => t.tipo === "Despesa" && t.status === "Pago" && !t.aluno_id).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  } else if (isMesPassado) {
    // Para meses passados, incluímos TUDO (incluindo mensalidades salvas no financeiro), pois a aba Mensalidades não mostra passado
    receitasOutros = transacoes.filter(t => t.tipo === "Receita" && (t.status === "Pago" || t.status === "concluido")).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    despesasOutros = transacoes.filter(t => t.tipo === "Despesa" && (t.status === "Pago" || t.status === "concluido")).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  }
  // Se for isMesFuturo, receitasOutros e despesasOutros permanecem 0, o que é o comportamento desejado.

  const razaoReceitaDespesa = despesasOutros > 0 ? (receitasOutros / despesasOutros).toFixed(2) : 0;
  
  const saldoTotal = receitasOutros + mensalidadesPagas - despesasOutros;

  // Lógica de Paginação Local
  const alunosPaginados = alunos.slice((paginaAlunos - 1) * limite, paginaAlunos * limite);
  const totalPaginasAlunos = Math.ceil(alunos.length / limite) || 1;

  const transacoesPaginadas = transacoes.slice((paginaTransacoes - 1) * limite, paginaTransacoes * limite);
  const totalPaginasTransacoes = Math.ceil(transacoes.length / limite) || 1;

  return (
    <div className="flex-1 p-4 md:p-8 bg-zinc-950 text-white min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">💰 Fluxo Financeiro</h1>
          <p className="text-sm text-zinc-400">Gerencie mensalidades e outros lançamentos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtros de Histórico Compactos */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">
            <label className="text-[10px] font-bold text-zinc-500 uppercase whitespace-nowrap">Histórico:</label>
            <select 
              value={mesFiltro} 
              onChange={(e) => setMesFiltro(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {meses.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              value={anoFiltro} 
              onChange={(e) => setAnoFiltro(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {anos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => { setAbaSelecionada('lancamentos'); setModalAberto(true); }} 
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg text-sm cursor-pointer font-medium shadow-lg shadow-emerald-900/20"
          >
            + Novo lançamento
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
            <label className="text-xs uppercase text-zinc-500 mb-1 block">Buscar por descrição</label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: mensalidade, aula, salário"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="w-full lg:w-36">
            <label className="text-xs uppercase text-zinc-500 mb-1 block">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Todos">Todos</option>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
          </div>
          <div className="w-full lg:w-36">
            <label className="text-xs uppercase text-zinc-500 mb-1 block">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Todos">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
          <div className="w-full lg:w-40">
            <label className="text-xs uppercase text-zinc-500 mb-1 block">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="w-full lg:w-40">
            <label className="text-xs uppercase text-zinc-500 mb-1 block">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => {
              setPaginaAlunos(1);
              setPaginaTransacoes(1);
              carregarFinanceiro();
            }}
            className="bg-sky-600 hover:bg-sky-700 px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            Consultar
          </button>
        </div>
      </div>

      {isMesAtual || (isMesPassado && transacoes.length > 0) ? (
        <>
          {/* Cards de Balanço */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <span className="text-xs text-zinc-500 uppercase">Mensalidades Pagas</span>
              <p className="text-2xl font-bold text-emerald-400">R$ {mensalidadesPagas.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <span className="text-xs text-zinc-500 uppercase">Mensalidades Pendentes</span>
              <p className="text-2xl font-bold text-amber-400">R$ {mensalidadesPendentes.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <span className="text-xs text-zinc-500 uppercase">Outros lançamentos</span>
              <div className="space-y-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Receitas</span>
                  <p className="text-lg font-semibold text-emerald-400">R$ {receitasOutros.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Despesas</span>
                  <p className="text-lg font-semibold text-rose-400">R$ {despesasOutros.toFixed(2)}</p>
                </div>
                <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-semibold">Razão (R/D)</span>
                  <p className={`text-lg font-bold ${razaoReceitaDespesa >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {razaoReceitaDespesa}x
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <span className="text-xs text-zinc-400 uppercase">Saldo Total</span>
              <p className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                R$ {saldoTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg md:col-span-1">
              <span className="text-xs text-zinc-400 uppercase">Resumo do Período</span>
              <div className="space-y-2 mt-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Receitas</span>
                  <span className="font-semibold text-emerald-400">R$ {Number(resumoFinanceiro.receitas || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Despesas</span>
                  <span className="font-semibold text-rose-400">R$ {Number(resumoFinanceiro.despesas || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Saldo</span>
                  <span className={`font-semibold ${Number(resumoFinanceiro.saldo || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>R$ {Number(resumoFinanceiro.saldo || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between items-center text-xs uppercase text-zinc-500">
                  <span>Lançamentos</span>
                  <span className="text-zinc-200">{resumoFinanceiro.total_lancamentos || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Abas */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg mb-6 p-1">
            <button
              onClick={() => setAbaSelecionada('mensalidades')}
              className={`flex-1 py-3 rounded font-medium transition-all ${
                abaSelecionada === 'mensalidades'
                  ? 'bg-sky-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📚 Mensalidades ({alunos.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('lancamentos')}
              className={`flex-1 py-3 rounded font-medium transition-all ${
                abaSelecionada === 'lancamentos'
                  ? 'bg-sky-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📋 Outros lançamentos ({transacoes.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('professores')}
              className={`flex-1 py-3 rounded font-medium transition-all ${
                abaSelecionada === 'professores'
                  ? 'bg-sky-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              👨‍🏫 Professores ({professoresFinanceiro.length})
            </button>
          </div>

          {/* Conteúdo da Aba: MENSALIDADES */}
          {abaSelecionada === 'mensalidades' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {alunos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950">
                        <th className="text-left p-4 font-semibold">👤 Aluno</th>
                        <th className="text-left p-4 font-semibold">🎵 Instrumento</th>
                        <th className="text-right p-4 font-semibold">💰 Mensalidade</th>
                        <th className="text-center p-4 font-semibold">Data Pagto</th>
                        <th className="text-center p-4 font-semibold">Status</th>
                        <th className="text-center p-4 font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosPaginados.map((aluno) => (
                        <tr key={aluno.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                          <td className="p-4 text-zinc-200">{aluno.nome}</td>
                          <td className="p-4 text-zinc-400">{aluno.instrumento || '—'}</td>
                          <td className="p-4 text-right text-sky-400 font-semibold">
                            R$ {Number(aluno.valor_calculado || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-center text-zinc-400 text-xs">
                            {aluno.status_mensalidade === 'Pago' ? formatarData(aluno.data_pagamento_mensalidade) : '-'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              !isMesAtual 
                                ? 'bg-zinc-800 text-zinc-500' 
                                : aluno.status_mensalidade === 'Pago'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-amber-900/50 text-amber-300'
                            }`}>
                              {!isMesAtual ? '—' : (aluno.status_mensalidade === 'Pago' ? '✓ Pago' : '⏳ Pendente')}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {isMesAtual && (
                              <button 
                              onClick={() => alternarStatusMensalidade(aluno.id, aluno.nome, aluno.status_mensalidade || 'Pendente')}
                              className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                                aluno.status_mensalidade === 'Pago'
                                  ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
                                  : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                              }`}
                            >
                              {aluno.status_mensalidade === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                            </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500">
                  <p className="text-lg">📭 Nenhum aluno ativo com mensalidade registrada.</p>
                </div>
              )}

              {/* Controles de Paginação - Alunos */}
              {totalPaginasAlunos > 1 && (
                <div className="flex justify-between items-center bg-zinc-950 border-t border-zinc-800 p-4">
                  <div className="text-xs text-zinc-500">
                    Página <span className="font-bold text-white">{paginaAlunos}</span> de <span className="font-bold text-white">{totalPaginasAlunos}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaginaAlunos(p => Math.max(p - 1, 1))}
                      disabled={paginaAlunos === 1}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setPaginaAlunos(p => Math.min(p + 1, totalPaginasAlunos))}
                      disabled={paginaAlunos === totalPaginasAlunos}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba: OUTROS LANÇAMENTOS */}
          {abaSelecionada === 'lancamentos' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {transacoes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950">
                        <th className="text-left p-4 font-semibold">Descrição</th>
                        <th className="text-center p-4 font-semibold">Tipo</th>
                        <th className="text-right p-4 font-semibold">Valor</th>
                        <th className="text-center p-4 font-semibold">Data</th>
                        <th className="text-center p-4 font-semibold">Status</th>
                        <th className="text-center p-4 font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoesPaginadas.map((t) => (
                        <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                          <td className="p-4 text-zinc-200">{t.descricao}</td>
                          <td className="p-4 text-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              t.tipo === 'Receita' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-rose-900/50 text-rose-300'
                            }`}>
                              {t.tipo}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-semibold ${t.tipo === 'Receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            R$ {Number(t.valor || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-center text-zinc-400 text-xs">{formatarData(t.data)}</td>
                          <td className="p-4 text-center">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              t.status === 'Pago'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-amber-900/50 text-amber-300'
                            }`}>
                              {t.status === 'Pago' ? '✓ Pago' : '⏳ Pendente'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {!t.aluno_id && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditarLancamento(t)}
                                  className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                                  title="Editar Lançamento"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => alternarStatusLancamento(t.id, t.status)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                                    t.status === 'Pago'
                                      ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
                                      : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                                  }`}
                                >
                                  {t.status === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeletarLancamento(t.id, t.descricao); }}
                                  className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                                  title="Excluir Lançamento"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500">
                  <p className="text-lg">📭 Nenhum outro lançamento registrado.</p>
                </div>
              )}

              {/* Controles de Paginação - Transações */}
              {totalPaginasTransacoes > 1 && (
                <div className="flex justify-between items-center bg-zinc-950 border-t border-zinc-800 p-4">
                  <div className="text-xs text-zinc-500">
                    Página <span className="font-bold text-white">{paginaTransacoes}</span> de <span className="font-bold text-white">{totalPaginasTransacoes}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaginaTransacoes(p => Math.max(p - 1, 1))}
                      disabled={paginaTransacoes === 1}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setPaginaTransacoes(p => Math.min(p + 1, totalPaginasTransacoes))}
                      disabled={paginaTransacoes === totalPaginasTransacoes}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba: PROFESSORES */}
          {abaSelecionada === 'professores' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {carregandoProfessores ? (
                <div className="p-12 text-center text-zinc-500">
                  <p className="text-lg">🔄 Carregando dados dos professores...</p>
                </div>
              ) : professoresFinanceiro.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950">
                        <th className="text-left p-4 font-semibold">👤 Professor</th>
                        <th className="text-left p-4 font-semibold">🎵 Instrumento</th>
                        <th className="text-right p-4 font-semibold">Valor Base</th>
                        <th className="text-center p-4 font-semibold">Alunos</th>
                        <th className="text-center p-4 font-semibold">Aulas Ministradas</th>
                        <th className="text-right p-4 font-semibold">Valor a Pagar</th>
                        <th className="text-center p-4 font-semibold">Status</th>
                        <th className="text-center p-4 font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professoresFinanceiro.map((profData) => {
                        const prof = profData.professor;
                        const totalPagar = Number(profData.total_a_pagar || 0);
                        const status = profData.repasse_status || 'pendente';
                        return (
                          <tr key={prof.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                            <td className="p-4 text-zinc-200 font-medium">
                              {prof.nome}
                              {profData.pagamento_detalhes && (
                                <div className="text-[10px] text-zinc-500 font-normal mt-0.5">
                                  Obs: {profData.pagamento_detalhes.observacao || 'Sem obs.'}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-zinc-400">{prof.instrumento_principal || '—'}</td>
                            <td className="p-4 text-right text-zinc-400 text-xs">
                              {prof.tipo_remuneracao === 'mensalista' && (
                                <div>Fixo: R$ {Number(profData.valor_mensal || 0).toFixed(2)}</div>
                              )}
                              {prof.tipo_remuneracao === 'horista' && (
                                <div>Hora: R$ {Number(profData.valor_hora || 0).toFixed(2)}</div>
                              )}
                              {prof.tipo_remuneracao === 'comissao' && (
                                <div>Comissão: {Number(profData.porcentagem_professor || 0)}%</div>
                              )}
                            </td>
                            <td className="p-4 text-center text-zinc-300">{profData.total_alunos}</td>
                            <td className="p-4 text-center text-zinc-300">{profData.total_aulas}</td>
                            <td className="p-4 text-right text-emerald-400 font-bold font-mono">
                              R$ {totalPagar.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                status === 'pago'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : status === 'parcial'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/30'
                              }`}>
                                {status === 'pago' ? 'Pago' : status === 'parcial' ? 'Parcial' : 'Pendente'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {status !== 'pago' ? (
                                <button
                                  type="button"
                                  onClick={() => abrirModalRepasse(profData)}
                                  className="bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer"
                                >
                                  Pagar Repasse
                                </button>
                              ) : (
                                <span className="text-[10px] text-zinc-500">
                                  {profData.pagamento_detalhes?.forma || 'Pago'}
                                  {profData.pagamento_detalhes?.data && (
                                    <span> · {new Date(profData.pagamento_detalhes.data).toLocaleDateString('pt-BR')}</span>
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500">
                  <p className="text-lg">📭 Nenhum professor registrado ou ativo.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900 border border-zinc-800 rounded-2xl text-center shadow-inner">
          <div className="bg-zinc-950 p-6 rounded-full mb-4 border border-zinc-800">
            <span className="text-5xl">📂</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-300">Sem dados a mostrar</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm">
            Não foram encontrados registros financeiros para o período selecionado.
          </p>
        </div>
      )}

      {/* MODAL DE NOVO LANÇAMENTO */}
      {modalAberto && abaSelecionada === 'lancamentos' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
              <h2 className="text-lg font-bold">{editandoId ? '✏️ Editar lançamento' : '📝 Novo lançamento'}</h2>
              <button onClick={fecharModal} className="text-zinc-500 hover:text-white text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleNovoLancamento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Descrição *</label>
                <input 
                  type="text" required placeholder="Ex: Aluguel da sala" value={formData.descricao} 
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 cursor-pointer">
                    <option>Receita</option>
                    <option>Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Valor *</label>
                  <input 
                    type="number" required placeholder="0.00" step="0.01" value={formData.valor} 
                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Data</label>
                  <input 
                    type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 cursor-pointer">
                    <option>Pago</option>
                    <option>Pendente</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button 
                  type="button" onClick={fecharModal}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={submetendo}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all cursor-pointer"
                >
                  {submetendo ? (editandoId ? 'Atualizando...' : 'Salvando...') : (editandoId ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE PAGAMENTO DE REPASSE (PROFESSOR) */}
      {modalRepasseAberto && professorSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
              <h2 className="text-lg font-bold">💰 Registrar Pagamento de Repasse</h2>
              <button 
                onClick={() => { setModalRepasseAberto(false); setProfessorSelecionado(null); }} 
                className="text-zinc-500 hover:text-white text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Professor</label>
                <input 
                  type="text" readOnly value={professorSelecionado.professor.nome} 
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Valor a Pagar</label>
                  <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold font-mono">
                    R$ {Number(
                      professorSelecionado.tipo_remuneracao === 'comissao'
                        ? professorSelecionado.repasse_pendente_valor
                        : professorSelecionado.total_a_pagar
                    ).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Forma de Pagamento</label>
                  <select 
                    value={formaPagamentoRepasse} 
                    onChange={e => setFormaPagamentoRepasse(e.target.value)} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência Bancária</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Observações / Referência</label>
                <textarea
                  value={observacaoRepasse}
                  onChange={e => setObservacaoRepasse(e.target.value)}
                  placeholder="Ex: Transferência Pix banco da escola."
                  rows="3"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setModalRepasseAberto(false); setProfessorSelecionado(null); }}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={registrarPagamentoRepasse}
                  disabled={salvandoRepasse}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all cursor-pointer"
                >
                  {salvandoRepasse ? 'Registrando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { exportarParaCSV, exportarParaPDF } from '../utils/exportar';
import { Receipt, Plus, Edit, Trash2 } from 'lucide-react';
import ModalConfirmacaoLote from '../components/ModalConfirmacaoLote';
import ToastFeedback from '../components/ToastFeedback';

import { API_URL } from '../utils/api';
const canalComunicacao = new BroadcastChannel('sonatta_updates');
const canalSincronizacao = new BroadcastChannel('sonatta_sync');

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [buscaAlunos, setBuscaAlunos] = useState('');
  const [buscaProfessores, setBuscaProfessores] = useState('');
  const [statusMensalidadeFiltro, setStatusMensalidadeFiltro] = useState('Todos');
  const [abaSelecionada, setAbaSelecionada] = useState('mensalidades'); // 'mensalidades', 'extrato', 'lancamentos' ou 'professores'
  const [filtroOrigem, setFiltroOrigem] = useState('Todos'); // 'Todos', 'Mensalidades', 'Professores', 'Gerais', 'Locacao'
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [professoresFinanceiro, setProfessoresFinanceiro] = useState([]);
  const [carregandoProfessores, setCarregandoProfessores] = useState(false);
  const [resumoFinanceiro, setResumoFinanceiro] = useState({ receitas: 0, despesas: 0, saldo: 0, total_lancamentos: 0 });
  const [asaasConfigurado, setAsaasConfigurado] = useState(false);
  const [gerandoLote, setGerandoLote] = useState(false);

  // Paginação Frontend
  const [paginaAlunos, setPaginaAlunos] = useState(1);
  const [paginaTransacoes, setPaginaTransacoes] = useState(1);
  const limite = 20;

  // Estados para Registro de Pagamento de Repasse (Professores)
  const [modalRepasseAberto, setModalRepasseAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
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


  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const [modoFiltroData, setModoFiltroData] = useState('mes'); // 'mes' ou 'periodo'

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [modalDesmembrarAberto, setModalDesmembrarAberto] = useState(false);
  const [faturaParaDesmembrar, setFaturaParaDesmembrar] = useState(null);
  const [desmembrandoId, setDesmembrandoId] = useState(null);

  const [toastFeedback, setToastFeedback] = useState({ isVisible: false, message: '', type: 'sucesso' });
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
        busca,
        tipo: filtroTipo === 'Todos' ? '' : filtroTipo,
        status: filtroStatus === 'Todos' ? '' : filtroStatus,
      });

      if (modoFiltroData === 'mes') {
        params.append('mes', String(mesFiltro));
        params.append('ano', String(anoFiltro));
      } else {
        if (dataInicio) params.append('dataInicio', dataInicio);
        if (dataFim) params.append('dataFim', dataFim);
        // Enviamos um parâmetro para ignorar o mês atual no backend caso esteja filtrando por período
        params.append('ignorarMesPadrao', 'true');
      }

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

      setTransacoes(Array.isArray(dados) ? dados : []);
      setResumoFinanceiro(resumo);
    } catch (erro) {
      console.error('Erro ao buscar dados financeiros:', erro);
      setTransacoes([]);
      setResumoFinanceiro({ receitas: 0, despesas: 0, saldo: 0, total_lancamentos: 0 });
    }
  };

  const exportarFinanceiroCSV = () => {
    const colunas = [
      { header: 'Descrição', key: 'descricao' },
      { header: 'Tipo', key: 'tipo' },
      { header: 'Status', key: 'status' },
      { header: 'Valor (R$)', key: 'valor' },
      { header: 'Data', key: 'data' }
    ];
    exportarParaCSV(transacoes, colunas, 'historico_financeiro');
  };

  const exportarFinanceiroPDF = () => {
    const colunas = [
      { header: 'Descrição', key: 'descricao' },
      { header: 'Tipo', key: 'tipo' },
      { header: 'Status', key: 'status' },
      { header: 'Valor (R$)', key: 'valor' },
      { header: 'Data', key: 'data' }
    ];
    const dados = transacoes.map(r => ({
      ...r,
      data: formatarData(r.data),
      valor: Number(r.valor).toFixed(2)
    }));
    exportarParaPDF(dados, colunas, 'Relatório Financeiro', 'historico_financeiro');
  };

  useEffect(() => {
    const token = localStorage.getItem('@sonatta:token');
    if (token) {
      fetch(`${API_URL}/api/escola`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.asaas_api_key) setAsaasConfigurado(true);
        })
        .catch(err => console.error('Erro ao verificar Asaas:', err));
    }
  }, []);

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
        setToastFeedback({ isVisible: true, message: err.erro || 'Erro ao registrar pagamento.', type: 'erro' });
      }
    } catch (erro) {
      setToastFeedback({ isVisible: true, message: 'Erro de conexão ao registrar pagamento.', type: 'erro' });
    } finally {
      setSalvandoRepasse(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      carregarFinanceiro();
      carregarAlunos();
      carregarFinanceiroProfessores();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [mesFiltro, anoFiltro, busca, filtroTipo, filtroStatus, dataInicio, dataFim, modoFiltroData]);



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
    const dataPgto = novoStatus === 'Pago' ? (isMesAtual ? new Date().toISOString().split('T')[0] : `${anoFiltro}-${String(mesFiltro).padStart(2, '0')}-10`) : null;

    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/aluno-${alunoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus, mes: mesFiltro, ano: anoFiltro })
      });
      if (resposta.ok) {
        setAlunos(prev => prev.map(a =>
          a.id === alunoId ? { ...a, status_mensalidade: novoStatus, data_pagamento_mensalidade: dataPgto } : a
        ));

        // Atualiza transações localmente para a UI reagir instantaneamente
        if (!isMesAtual) {
          if (novoStatus === 'Pago') {
            setTransacoes(prev => [
              { aluno_id: alunoId, tipo: 'Receita', descricao: 'Mensalidade', status: 'Pago', data: dataPgto },
              ...prev
            ]);
          } else {
            setTransacoes(prev => prev.filter(t => !(t.aluno_id === alunoId && t.tipo === 'Receita' && t.descricao.toLowerCase().includes('mensalidade'))));
          }
        }

        carregarFinanceiro(); // Atualiza a tabela com os IDs reais do banco
        canalComunicacao.postMessage('atualizar_dados');
      } else {
        const erroData = await resposta.json();
        setToastFeedback({ isVisible: true, message: `Erro ao atualizar status: ${erroData.erro || 'Erro desconhecido'}`, type: 'erro' });
      }
    } catch (erro) { console.error(erro); }
  };

  const confirmarDesmembramento = (idFatura) => {
    setFaturaParaDesmembrar(idFatura);
    setModalDesmembrarAberto(true);
  };

  const executarDesmembramento = async () => {
    if (!faturaParaDesmembrar) return;
    const idFatura = faturaParaDesmembrar;
    setModalDesmembrarAberto(false);
    setDesmembrandoId(idFatura);
    
    const token = localStorage.getItem('@sonatta:token');
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/${idFatura}/desmembrar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        setToastFeedback({ isVisible: true, message: 'Lote desmembrado com sucesso!', type: 'sucesso' });
        carregarFinanceiro();
        carregarAlunos();
      } else {
        const erroData = await resposta.json();
        setToastFeedback({ isVisible: true, message: `Erro ao desmembrar lote: ${erroData.erro || 'Erro desconhecido'}`, type: 'erro' });
      }
    } catch (erro) {
      console.error(erro);
      setToastFeedback({ isVisible: true, message: 'Erro de conexão ao desmembrar lote.', type: 'erro' });
    } finally {
      setDesmembrandoId(null);
      setFaturaParaDesmembrar(null);
    }
  };

  const deletarLancamento = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a fatura de ${nome || 'este lançamento'}? Se houver cobrança no Asaas, ela será cancelada.`)) return;

    const token = localStorage.getItem('@sonatta:token');
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        setToastFeedback({ isVisible: true, message: 'Lançamento excluído com sucesso!', type: 'sucesso' });
        carregarFinanceiro();
        carregarAlunos();
        canalComunicacao.postMessage('atualizar_dados');
      } else {
        const erroData = await resposta.json();
        setToastFeedback({ isVisible: true, message: `Erro ao excluir: ${erroData.erro || 'Erro desconhecido'}`, type: 'erro' });
      }
    } catch (erro) {
      console.error(erro);
      setToastFeedback({ isVisible: true, message: 'Erro de conexão ao excluir.', type: 'erro' });
    }
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

  const gerarCobrancaAsaas = async (id, tipoLancamento) => {
    const token = localStorage.getItem('@sonatta:token');
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/${id}/gerar-asaas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resposta.json();
      if (resposta.ok) {
        setToastFeedback({ isVisible: true, message: 'Cobrança gerada com sucesso!', type: 'sucesso' });
        carregarFinanceiro();
        carregarAlunos();
      } else {
        setToastFeedback({ isVisible: true, message: `Erro ao gerar cobrança: ${data.erro}`, type: 'erro' });
      }
    } catch (erro) {
      console.error(erro);
      setToastFeedback({ isVisible: true, message: 'Erro de conexão ao gerar cobrança no Asaas.', type: 'erro' });
    }
  };

  const gerarMensalidadeManual = async (alunoId) => {
    const token = localStorage.getItem('@sonatta:token');
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/aluno-${alunoId}/gerar-mensalidade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resposta.json();
      if (resposta.ok) {
        setToastFeedback({ isVisible: true, message: 'Mensalidade gerada com sucesso! O aluno já pode ver no portal.', type: 'sucesso' });
        carregarFinanceiro();
        carregarAlunos();
      } else {
        setToastFeedback({ isVisible: true, message: `Erro ao gerar mensalidade: ${data.erro}`, type: 'erro' });
      }
    } catch (erro) {
      console.error(erro);
      setToastFeedback({ isVisible: true, message: 'Erro de conexão ao gerar mensalidade.', type: 'erro' });
    }
  };

  const gerarLoteMensalidades = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token || gerandoLote) return;
    setGerandoLote(true);
    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/gerar-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mes: mesFiltro, ano: anoFiltro })
      });
      const data = await resposta.json();
      if (resposta.ok) {
        setToastFeedback({ isVisible: true, message: 'Lote gerado com sucesso! Os responsáveis já podem acessar a fatura única.', type: 'sucesso' });
        setModalLoteAberto(false);
        carregarFinanceiro();
        carregarAlunos();
      } else {
        setToastFeedback({ isVisible: true, message: `Erro ao gerar lote: ${data.erro}`, type: 'erro' });
      }
    } catch (erro) {
      console.error(erro);
      setToastFeedback({ isVisible: true, message: 'Erro de conexão ao gerar lote.', type: 'erro' });
    } finally {
      setGerandoLote(false);
    }
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

  // Deletar lançamento
  const handleDeletarLancamento = async (id, descricao) => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return setToastFeedback({ isVisible: true, message: "Sessão expirada.", type: 'erro' });

    if (window.confirm(`Tem certeza que deseja remover o lançamento "${descricao}"?`)) {
      try {
        const resposta = await fetch(`${API_URL}/api/financeiro/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
          setTransacoes(prev => prev.filter(t => t.id !== id));
          canalComunicacao.postMessage('atualizar_dados');
          setToastFeedback({ isVisible: true, message: 'Lançamento excluído com sucesso!', type: 'sucesso' });
        } else {
          setToastFeedback({ isVisible: true, message: 'Erro ao excluir lançamento.', type: 'erro' });
        }
      } catch (erro) {
        console.error('Erro ao deletar lançamento:', erro);
        setToastFeedback({ isVisible: true, message: 'Erro de conexão ao deletar.', type: 'erro' });
      }
    }
  };

  // Abrir modal para editar lançamento
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

  // Calcular estatísticas
  // Só calculamos mensalidades se estivermos vendo o mês atual, pois não temos histórico de alunos em meses passados/futuros
  const totalMensalidades = isMesAtual ? alunos.reduce((sum, a) => sum + Number(a.valor_calculado || 0), 0) : 0;
  const mensalidadesPagas = isMesAtual ? alunos.filter(a => a.status_mensalidade === 'Pago').reduce((sum, a) => sum + Number(a.valor_calculado || 0), 0) : 0;
  const mensalidadesPendentes = totalMensalidades - mensalidadesPagas;

  // Outros Lançamentos:
  let receitasOutros = 0;
  let despesasOutros = 0;

  if (isMesAtual) {
    // Para o mês atual, consideramos apenas lançamentos com status 'Pago'
    receitasOutros = transacoes.filter(t => t.tipo === "Receita" && t.status === "Pago" && !t.aluno_id && !t.responsavel_id).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    despesasOutros = transacoes.filter(t => t.tipo === "Despesa" && t.status === "Pago" && !t.aluno_id && !t.responsavel_id).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  } else if (isMesPassado) {
    // Para meses passados, incluímos TUDO (incluindo mensalidades salvas no financeiro), pois a aba Mensalidades não mostra passado
    receitasOutros = transacoes.filter(t => t.tipo === "Receita" && (t.status === "Pago" || t.status === "concluido")).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    despesasOutros = transacoes.filter(t => t.tipo === "Despesa" && (t.status === "Pago" || t.status === "concluido")).reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  }
  // Se for isMesFuturo, receitasOutros e despesasOutros permanecem 0, o que é o comportamento desejado.

  const razaoReceitaDespesa = despesasOutros > 0 ? (receitasOutros / despesasOutros).toFixed(2) : 0;

  const saldoTotal = receitasOutros + mensalidadesPagas - despesasOutros;

  const alunosFiltrados = useMemo(() => {
    const filtrados = alunos.filter(a => {
      const matchBusca = a.nome.toLowerCase().includes(buscaAlunos.toLowerCase());
      const matchStatus = statusMensalidadeFiltro === 'Todos' ? true : a.status_mensalidade === statusMensalidadeFiltro;
      return matchBusca && matchStatus;
    });

    const grupos = {};
    const resultado = [];

    filtrados.forEach(aluno => {
      // Verifica se este aluno já possui uma fatura individual no mês atual (desmembrada ou avulsa)
      const faturaIndividual = transacoes.find(t => 
        t.aluno_id === aluno.id && 
        t.tipo === 'Receita' && 
        (isMesAtual ? t.status !== 'Cancelado' : true)
      );

      if (aluno.responsavel_id && !faturaIndividual) {
        if (!grupos[aluno.responsavel_id]) {
          grupos[aluno.responsavel_id] = {
            isGroup: true,
            id: `resp_${aluno.responsavel_id}`,
            responsavel_id: aluno.responsavel_id,
            alunos: [],
            valor_calculado: 0
          };
        }
        grupos[aluno.responsavel_id].alunos.push(aluno);
        grupos[aluno.responsavel_id].valor_calculado += Number(aluno.valor_calculado || 0);
      } else {
        // Se já tem fatura individual ou não tem responsável, exibe solto
        resultado.push({ 
          ...aluno, 
          isGroup: false,
          fatura_id: faturaIndividual ? faturaIndividual.id : null
        });
      }
    });

    // Desmembrar grupos que possuem apenas 1 aluno
    const chavesGrupos = Object.keys(grupos);
    chavesGrupos.forEach(chave => {
      const grupo = grupos[chave];
      if (grupo.alunos.length > 1) {
        resultado.push(grupo);
      } else if (grupo.alunos.length === 1) {
        // Se tem só 1 aluno, não exibe como Lote/Fatura Unificada
        const alunoSolto = grupo.alunos[0];
        const faturaAlunoSolto = transacoes.find(t => 
          t.aluno_id === alunoSolto.id && 
          t.tipo === 'Receita' && 
          (isMesAtual ? t.status !== 'Cancelado' : true)
        );
        resultado.push({ 
          ...alunoSolto, 
          isGroup: false,
          fatura_id: faturaAlunoSolto ? faturaAlunoSolto.id : null
        });
      }
    });

    // Populate Group Names and find Fatura Unificada to get status
    resultado.forEach(item => {
      if (item.isGroup) {
        item.nome = item.alunos.map(a => a.nome).join(', ');
        item.instrumento = 'Múltiplos';
        
        // Find corresponding Fatura Unificada in transacoes
        const fatura = transacoes.find(t => 
          !t.aluno_id &&
          t.responsavel_id != null && item.responsavel_id != null &&
          String(t.responsavel_id) === String(item.responsavel_id) && 
          t.tipo === 'Receita' && 
          (isMesAtual ? t.status !== 'Cancelado' : true)
        );

        if (fatura) {
          item.fatura_id = fatura.id;
          item.status_mensalidade = fatura.status;
          item.data_pagamento_mensalidade = fatura.data;
          // Set children status visually based on parent fatura
          item.alunos.forEach(a => {
            a.status_mensalidade = fatura.status;
            a.data_pagamento_mensalidade = fatura.data;
          });
        } else {
          // Fallback if not generated yet
          item.status_mensalidade = item.alunos.some(a => a.status_mensalidade === 'Pendente') ? 'Pendente' : 'Pago';
          item.data_pagamento_mensalidade = null;
        }
      }
    });

    return resultado;
  }, [alunos, buscaAlunos, statusMensalidadeFiltro, transacoes, isMesAtual]);

  // Lógica de Paginação Local
  const alunosPaginados = alunosFiltrados.slice((paginaAlunos - 1) * limite, paginaAlunos * limite);
  const totalPaginasAlunos = Math.ceil(alunosFiltrados.length / limite) || 1;

  const professoresFiltrados = useMemo(() => {
    if (!buscaProfessores) return professoresFinanceiro;
    return professoresFinanceiro.filter(p => p.professor.nome.toLowerCase().includes(buscaProfessores.toLowerCase()));
  }, [professoresFinanceiro, buscaProfessores]);

  const transacoesExtratoFiltradas = useMemo(() => {
    return transacoes.filter(t => {
      // Remover Faturas Unificadas da aba Extrato, elas são da aba Mensalidades
      if (t.responsavel_id) return false;

      const isLojinha = t.descricao.toLowerCase().includes('venda lojinha:');
      const isLocacao = t.descricao.toLowerCase().includes('locação de sala:');
      if (filtroOrigem === 'Mensalidades') return t.aluno_id != null && !isLojinha && !isLocacao;
      if (filtroOrigem === 'Lojinha') return isLojinha;
      if (filtroOrigem === 'Locacao') return isLocacao;
      if (filtroOrigem === 'Professores') return t.aluno_id == null && (t.descricao.toLowerCase().includes('professor') || t.descricao.toLowerCase().includes('repasse'));
      if (filtroOrigem === 'Gerais') return t.aluno_id == null && !(t.descricao.toLowerCase().includes('professor') || t.descricao.toLowerCase().includes('repasse')) && !isLojinha && !isLocacao;
      return true; // 'Todos'
    });
  }, [transacoes, filtroOrigem]);

  const transacoesLancamentosFiltradas = useMemo(() => {
    // Na aba de lançamentos manuais, não mostramos as mensalidades nem Faturas Unificadas
    // Mas incluimos as aulas extras e as vendas da lojinha (que podem possuir aluno_id)
    return transacoes.filter(t => {
      if (t.responsavel_id) return false;
      return t.aluno_id == null || (t.descricao && (t.descricao.toLowerCase().includes('aula extra') || t.descricao.toLowerCase().includes('venda lojinha:')));
    });
  }, [transacoes]);

  const extratoPaginado = transacoesExtratoFiltradas.slice((paginaTransacoes - 1) * limite, paginaTransacoes * limite);
  const totalPaginasExtrato = Math.ceil(transacoesExtratoFiltradas.length / limite) || 1;

  const lancamentosPaginados = transacoesLancamentosFiltradas.slice((paginaTransacoes - 1) * limite, paginaTransacoes * limite);
  const totalPaginasLancamentos = Math.ceil(transacoesLancamentosFiltradas.length / limite) || 1;

  return (
    <div className="flex-1 p-4 md:p-8 bg-zinc-950 text-white min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">💰 Fluxo Financeiro</h1>
          <p className="text-sm text-zinc-400">Gerencie mensalidades e outros lançamentos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalHistoricoAberto(true)}
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 px-4 py-2.5 rounded-lg text-sm cursor-pointer font-medium shadow-lg flex items-center gap-2 transition-all"
          >
            <Receipt size={16} />
            Histórico financeiro
          </button>
          <button
            onClick={() => { setAbaSelecionada('lancamentos'); setModalAberto(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg text-sm cursor-pointer font-medium shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <Plus size={16} />
            Novo lançamento
          </button>
        </div>
      </div>

      <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg mb-6 p-1">
        <button
          onClick={() => setAbaSelecionada('mensalidades')}
          className={`flex-1 py-3 rounded font-medium transition-all ${abaSelecionada === 'mensalidades'
            ? 'bg-sky-600 text-white'
            : 'text-zinc-400 hover:text-white'
            }`}
        >
          📚 Mensalidades ({alunos.length})
        </button>

        <button
          onClick={() => setAbaSelecionada('lancamentos')}
          className={`flex-1 py-3 rounded font-medium transition-all ${abaSelecionada === 'lancamentos'
            ? 'bg-sky-600 text-white'
            : 'text-zinc-400 hover:text-white'
            }`}
        >
          📋 Outros Lançamentos
        </button>
        <button
          onClick={() => setAbaSelecionada('professores')}
          className={`flex-1 py-3 rounded font-medium transition-all ${abaSelecionada === 'professores'
            ? 'bg-sky-600 text-white'
            : 'text-zinc-400 hover:text-white'
            }`}
        >
          👨‍🏫 Professores ({professoresFinanceiro.length})
        </button>
      </div>


      {/* Conteúdo da Aba: MENSALIDADES */}
      {abaSelecionada === 'mensalidades' && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setModalLoteAberto(true)} 
            disabled={gerandoLote}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded transition-colors shadow-lg"
          >
            {gerandoLote ? 'GERANDO...' : '⚡ GERAR MENSALIDADES EM LOTE'}
          </button>
        </div>
      )}
      {abaSelecionada === 'mensalidades' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Filtros de Mensalidades */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs uppercase text-zinc-500 mb-1 block">Buscar por nome</label>
                <input
                  type="text"
                  placeholder="🔍 Buscar aluno por nome..."
                  value={buscaAlunos}
                  onChange={(e) => {
                    setBuscaAlunos(e.target.value);
                    setPaginaAlunos(1);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="text-xs uppercase text-zinc-500 mb-1 block">Status</label>
                <select
                  value={statusMensalidadeFiltro}
                  onChange={(e) => {
                    setStatusMensalidadeFiltro(e.target.value);
                    setPaginaAlunos(1);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Pago">Pago</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
            </div>

            {/* Linha 2: Filtros de Data */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-3 pt-3 border-t border-zinc-800/50">
              <div className="w-full lg:w-48">
                <label className="text-xs uppercase text-zinc-500 mb-1 block">Filtrar por data</label>
                <select
                  value={modoFiltroData}
                  onChange={(e) => setModoFiltroData(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="mes">Mês Específico</option>
                  <option value="periodo">Período Personalizado</option>
                </select>
              </div>

              {modoFiltroData === 'mes' ? (
                <>
                  <div className="w-full lg:w-40">
                    <label className="text-xs uppercase text-zinc-500 mb-1 block">Mês</label>
                    <select
                      value={mesFiltro}
                      onChange={(e) => setMesFiltro(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {meses.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full lg:w-32">
                    <label className="text-xs uppercase text-zinc-500 mb-1 block">Ano</label>
                    <select
                      value={anoFiltro}
                      onChange={(e) => setAnoFiltro(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {anos.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {alunosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table role="table" aria-label="Tabela de dados" className="w-full text-sm">
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
                  {alunosPaginados.map((aluno) => {
                    let statusRender = aluno.status_mensalidade;
                    let dataPgtoRender = aluno.data_pagamento_mensalidade;

                    if (!isMesAtual && !aluno.isGroup) {
                      const transacaoMes = transacoes.find(t =>
                        t.aluno_id === aluno.id &&
                        t.tipo === 'Receita' &&
                        t.descricao.toLowerCase().includes('mensalidade')
                      );
                      statusRender = transacaoMes ? transacaoMes.status : 'Pendente';
                      dataPgtoRender = transacaoMes ? transacaoMes.data : null;
                    }

                    return (
                      <tr key={aluno.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="p-4 text-zinc-200">
                          {aluno.isGroup ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-sky-400">
                                {aluno.alunos?.[0]?.responsavel_nome ? `${aluno.alunos[0].responsavel_nome} - ` : ''}{aluno.nome}
                              </span>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Fatura Unificada</span>
                            </div>
                          ) : (
                            aluno.nome
                          )}
                        </td>
                        <td className="p-4 text-zinc-400">{aluno.instrumento || '—'}</td>
                        <td className="p-4 text-right text-sky-400 font-semibold">
                          R$ {Number(aluno.valor_calculado || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-center text-zinc-400 text-xs">
                          {statusRender === 'Pago' && dataPgtoRender ? formatarData(dataPgtoRender) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusRender === 'Pago'
                            ? 'bg-emerald-900/50 text-emerald-300'
                            : 'bg-amber-900/50 text-amber-300'
                            }`}>
                            {statusRender === 'Pago' ? '✓ Pago' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {aluno.isGroup && !aluno.fatura_id ? (
                            <span className="text-xs text-rose-500/70 italic px-2">Lote não gerado para este mês</span>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  if (aluno.isGroup) {
                                    alternarStatusLancamento(aluno.fatura_id, statusRender || 'Pendente');
                                  } else {
                                    alternarStatusMensalidade(aluno.id, aluno.nome, statusRender || 'Pendente');
                                  }
                                }}
                                title={statusRender === 'Pago' ? "Marcar como Pendente" : "Marcar como Pago Manualmente"}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${statusRender === 'Pago'
                                  ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
                                  : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                                  }`}
                              >
                                {statusRender === 'Pago' ? 'Desfazer Pago' : 'Marcar Pago'}
                              </button>
                              {aluno.isGroup && statusRender === 'Pendente' && (
                                <button
                                  onClick={() => confirmarDesmembramento(aluno.fatura_id)}
                                  disabled={desmembrandoId === aluno.fatura_id}
                                  title="Desmembrar Lote em Faturas Individuais"
                                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center min-w-[100px] ${
                                    desmembrandoId === aluno.fatura_id 
                                      ? 'bg-zinc-700/50 text-zinc-400 cursor-not-allowed'
                                      : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 cursor-pointer'
                                  }`}
                                >
                                  {desmembrandoId === aluno.fatura_id ? (
                                    <span className="flex items-center gap-2">
                                      <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                                      Carregando
                                    </span>
                                  ) : (
                                    'Desmembrar'
                                  )}
                                </button>
                              )}
                              {statusRender !== 'Pago' && (
                                asaasConfigurado ? (
                                  <button
                                    onClick={() => {
                                      if (aluno.isGroup) {
                                        gerarCobrancaAsaas(aluno.fatura_id, 'lancamento');
                                      } else {
                                        gerarCobrancaAsaas(`aluno-${aluno.id}`, 'mensalidade');
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium rounded text-white transition-all shadow-lg cursor-pointer"
                                  >
                                    Gerar Asaas
                                  </button>
                                ) : (
                                  <span className="text-xs text-zinc-500 italic px-2">Asaas não configurado</span>
                                )
                              )}
                              {/* Botão de Excluir Fatura (Para apagar duplicadas ou cancelar) */}
                              <button
                                onClick={() => deletarLancamento(aluno.fatura_id || aluno.id, aluno.nome)}
                                title="Excluir Fatura e Cancelar no Asaas"
                                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer ml-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              {statusRender !== 'Pago' && !aluno.isGroup && (
                                <button
                                  onClick={() => gerarMensalidadeManual(aluno.id)}
                                  className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 text-xs font-medium rounded text-white transition-all shadow-lg cursor-pointer ml-1"
                                  title="Gerar mensalidade pendente manualmente para o aluno ver no portal"
                                >
                                  Gerar Mensalidade
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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

      {/* MODAL DO HISTÓRICO / EXTRATO GERAL */}
      {modalHistoricoAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={20} className="text-purple-400" />
                Histórico Financeiro
              </h2>
              <button onClick={() => setModalHistoricoAberto(false)} className="text-zinc-500 hover:text-white text-xl cursor-pointer transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 bg-zinc-900">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
                {/* Filtros do Extrato */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex flex-col gap-4">
                    {/* Linha 1: Filtros de Texto, Origem, Tipo e Status */}
                    <div className="flex flex-col lg:flex-row gap-3">
                      <div className="flex-1">
                        <label className="text-xs uppercase text-zinc-500 mb-1 block">Buscar por descrição</label>
                        <input
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          placeholder="Ex.: mensalidade, aula, salário"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="w-full lg:w-48">
                        <label className="text-xs uppercase text-zinc-500 mb-1 block">Origem</label>
                        <select
                          value={filtroOrigem}
                          onChange={(e) => {
                            setFiltroOrigem(e.target.value);
                            setPaginaTransacoes(1);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Todos">Todas as Origens</option>
                          <option value="Mensalidades">Mensalidades (Alunos)</option>
                          <option value="Professores">Repasses (Professores)</option>
                          <option value="Lojinha">Vendas (Lojinha)</option>
                          <option value="Locacao">Locação de Salas</option>
                          <option value="Gerais">Outros Lançamentos</option>
                        </select>
                      </div>
                      <div className="w-full lg:w-40">
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
                      <div className="w-full lg:w-40">
                        <label className="text-xs uppercase text-zinc-500 mb-1 block">Status</label>
                        <select
                          value={filtroStatus}
                          onChange={(e) => setFiltroStatus(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Todos">Todos</option>
                          <option value="Pago">Pago</option>
                          <option value="Pendente">Pendente</option>
                        </select>
                      </div>
                    </div>

                    {/* Linha 2: Filtros de Data */}
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3 pt-3 border-t border-zinc-800/50">
                      <div className="w-full lg:w-48">
                        <label className="text-xs uppercase text-zinc-500 mb-1 block">Filtrar por data</label>
                        <select
                          value={modoFiltroData}
                          onChange={(e) => setModoFiltroData(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="mes">Mês Específico</option>
                          <option value="periodo">Período Personalizado</option>
                        </select>
                      </div>

                      {modoFiltroData === 'mes' ? (
                        <>
                          <div className="w-full lg:w-40">
                            <label className="text-xs uppercase text-zinc-500 mb-1 block">Mês</label>
                            <select
                              value={mesFiltro}
                              onChange={(e) => setMesFiltro(Number(e.target.value))}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            >
                              {meses.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-full lg:w-32">
                            <label className="text-xs uppercase text-zinc-500 mb-1 block">Ano</label>
                            <select
                              value={anoFiltro}
                              onChange={(e) => setAnoFiltro(Number(e.target.value))}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            >
                              {anos.map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cards Flutuantes de Balanço Integrados (Apenas se tiver histórico) */}
                {(isMesAtual || (isMesPassado && transacoes.length > 0)) && (
                  <div className="p-4 bg-zinc-950/40 border-b border-zinc-800">
                    <h3 className="text-xs font-bold uppercase text-zinc-500 mb-3 ml-1 tracking-wider">Resumo Deste Filtro</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold">Receitas Totais</span>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">R$ {Number(resumoFinanceiro.receitas || 0).toFixed(2)}</p>
                      </div>

                      <div className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold">Despesas Totais</span>
                        <p className="text-2xl font-bold text-rose-400 mt-1">R$ {Number(resumoFinanceiro.despesas || 0).toFixed(2)}</p>
                      </div>

                      <div className="flex-1 min-w-[200px] bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold">Saldo Final</span>
                        <p className={`text-2xl font-bold mt-1 ${Number(resumoFinanceiro.saldo || 0) >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                          R$ {Number(resumoFinanceiro.saldo || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex-1 min-w-[150px] bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-xl flex flex-col justify-center items-center relative overflow-hidden">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold text-center">Nº de Lançamentos</span>
                        <p className="text-3xl font-light text-zinc-300 mt-1">{resumoFinanceiro.total_lancamentos || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 p-4 border-b border-zinc-800 bg-zinc-950">
                  <button onClick={exportarFinanceiroPDF} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-4 rounded transition-colors shadow-lg">📄 EXPORTAR PDF</button>
                  <button onClick={exportarFinanceiroCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded transition-colors shadow-lg">📊 EXPORTAR EXCEL</button>
                </div>
                {transacoesExtratoFiltradas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table role="table" aria-label="Tabela de dados" className="w-full text-sm">
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
                        {extratoPaginado.map((t) => (
                          <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                            <td className="p-4 text-zinc-200">
                              {t.responsavel_nome ? `${t.descricao} (Resp: ${t.responsavel_nome})` : t.descricao}
                              {(t.aluno_id || t.responsavel_id) && <span className="ml-2 text-[10px] bg-sky-900/50 text-sky-400 px-2 py-0.5 rounded-full">Mensalidade</span>}
                              {!t.aluno_id && !t.responsavel_id && (t.descricao.toLowerCase().includes('professor') || t.descricao.toLowerCase().includes('repasse')) && (
                                <span className="ml-2 text-[10px] bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full">Professor</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${t.tipo === 'Receita' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-rose-900/50 text-rose-300'
                                }`}>
                                {t.tipo}
                              </span>
                            </td>
                            <td className={`p-4 text-right font-semibold ${t.tipo === 'Receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              R$ {Number(t.valor || 0).toFixed(2)}
                            </td>
                            <td className="p-4 text-center text-zinc-400 text-xs">{formatarData(t.data)}</td>
                            <td className="p-4 text-center">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.status === 'Pago'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-amber-900/50 text-amber-300'
                                }`}>
                                {t.status === 'Pago' ? '✓ Pago' : '⏳ Pendente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-500">
                    <p className="text-lg">📭 Nenhum lançamento encontrado neste período.</p>
                  </div>
                )}

                {/* Controles de Paginação - Extrato */}
                {totalPaginasExtrato > 1 && (
                  <div className="flex justify-between items-center bg-zinc-950 border-t border-zinc-800 p-4">
                    <div className="text-xs text-zinc-500">
                      Página <span className="font-bold text-white">{paginaTransacoes}</span> de <span className="font-bold text-white">{totalPaginasExtrato}</span>
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
                        onClick={() => setPaginaTransacoes(p => Math.min(p + 1, totalPaginasExtrato))}
                        disabled={paginaTransacoes === totalPaginasExtrato}
                        className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba: LANÇAMENTOS MANUAIS */}
      {abaSelecionada === 'lancamentos' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">

          {/* Filtros de Lançamentos */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex flex-col gap-4">
              {/* Linha 1: Filtros de Texto, Tipo e Status */}
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs uppercase text-zinc-500 mb-1 block">Buscar por descrição</label>
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Ex.: conta de luz, internet, etc"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="w-full lg:w-48">
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
                <div className="w-full lg:w-48">
                  <label className="text-xs uppercase text-zinc-500 mb-1 block">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Filtros de Data */}
              <div className="flex flex-col lg:flex-row lg:items-end gap-3 pt-3 border-t border-zinc-800/50">
                <div className="w-full lg:w-48">
                  <label className="text-xs uppercase text-zinc-500 mb-1 block">Filtrar por data</label>
                  <select
                    value={modoFiltroData}
                    onChange={(e) => setModoFiltroData(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="mes">Mês Específico</option>
                    <option value="periodo">Período Personalizado</option>
                  </select>
                </div>

                {modoFiltroData === 'mes' ? (
                  <>
                    <div className="w-full lg:w-40">
                      <label className="text-xs uppercase text-zinc-500 mb-1 block">Mês</label>
                      <select
                        value={mesFiltro}
                        onChange={(e) => setMesFiltro(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {meses.map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full lg:w-32">
                      <label className="text-xs uppercase text-zinc-500 mb-1 block">Ano</label>
                      <select
                        value={anoFiltro}
                        onChange={(e) => setAnoFiltro(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {anos.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {transacoesLancamentosFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <table role="table" aria-label="Tabela de dados" className="w-full text-sm">
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
                  {lancamentosPaginados.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="p-4 text-zinc-200">
                        <div className="flex flex-col gap-1">
                          <span>{t.responsavel_nome ? `${t.descricao} (Resp: ${t.responsavel_nome})` : t.descricao}</span>
                          {t.responsavel_id && (
                            <span className="w-fit text-[10px] bg-sky-900/50 text-sky-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider" title="O pagamento desta fatura atualizará todos os alunos vinculados a ela">
                              Fatura Unificada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${t.tipo === 'Receita' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-rose-900/50 text-rose-300'
                          }`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-semibold ${t.tipo === 'Receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        R$ {Number(t.valor || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-center text-zinc-400 text-xs">{formatarData(t.data)}</td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.status === 'Pago'
                          ? 'bg-emerald-900/50 text-emerald-300'
                          : 'bg-amber-900/50 text-amber-300'
                          }`}>
                          {t.status === 'Pago' ? '✓ Pago' : '⏳ Pendente'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditarLancamento(t)}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                            title="Editar Lançamento"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => alternarStatusLancamento(t.id, t.status)}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${t.status === 'Pago'
                              ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
                              : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                              }`}
                          >
                            {t.status === 'Pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                          </button>
                          {asaasConfigurado && t.tipo === 'Receita' && t.status !== 'Pago' && (
                            <button
                              onClick={() => gerarCobrancaAsaas(t.id, 'lancamento')}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium rounded text-white transition-all shadow-lg ml-2"
                            >
                              Gerar Asaas
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletarLancamento(t.id, t.descricao); }}
                            className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                            title="Excluir Lançamento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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

          {/* Controles de Paginação - Lançamentos Manuais */}
          {totalPaginasLancamentos > 1 && (
            <div className="flex justify-between items-center bg-zinc-950 border-t border-zinc-800 p-4">
              <div className="text-xs text-zinc-500">
                Página <span className="font-bold text-white">{paginaTransacoes}</span> de <span className="font-bold text-white">{totalPaginasLancamentos}</span>
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
                  onClick={() => setPaginaTransacoes(p => Math.min(p + 1, totalPaginasLancamentos))}
                  disabled={paginaTransacoes === totalPaginasLancamentos}
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

          {/* Filtros de Professores */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs uppercase text-zinc-500 mb-1 block">Buscar Professor</label>
              <input
                type="text"
                placeholder="Nome do professor..."
                value={buscaProfessores}
                onChange={(e) => setBuscaProfessores(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="w-full lg:w-40">
              <label className="text-xs uppercase text-zinc-500 mb-1 block">Mês Referência</label>
              <select
                value={mesFiltro}
                onChange={(e) => setMesFiltro(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {meses.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-full lg:w-32">
              <label className="text-xs uppercase text-zinc-500 mb-1 block">Ano</label>
              <select
                value={anoFiltro}
                onChange={(e) => setAnoFiltro(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {anos.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {carregandoProfessores ? (
            <div className="p-12 text-center text-zinc-500">
              <p className="text-lg">🔄 Carregando dados dos professores...</p>
            </div>
          ) : professoresFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table role="table" aria-label="Tabela de dados" className="w-full text-sm">
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
                  {professoresFiltrados.map((profData) => {
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
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status === 'pago'
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
      {/* MODAL DE NOVO LANÇAMENTO */}
      {modalAberto && abaSelecionada === 'lancamentos' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
              <h2 className="text-lg font-bold flex items-center gap-2">{editandoId ? <><Edit size={20} /> Editar lançamento</> : '📝 Novo lançamento'}</h2>
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

      {/* Modal Confirmar Desmembramento */}
      {modalDesmembrarAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-6 h-6 text-rose-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Desmembrar Fatura Unificada?
              </h3>
              
              <p className="text-zinc-400 text-sm text-center mb-6 leading-relaxed">
                Essa fatura será cancelada e dividida em faturas individuais para cada aluno. Caso já exista uma cobrança no Asaas, ela será cancelada e as novas faturas serão recriadas separadamente.
                <br /><br />
                <span className="font-semibold text-rose-400">Esta ação não pode ser desfeita automaticamente.</span>
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalDesmembrarAberto(false);
                    setFaturaParaDesmembrar(null);
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executarDesmembramento}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-rose-900/20"
                >
                  Sim, desmembrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacaoLote
        isOpen={modalLoteAberto}
        onClose={() => setModalLoteAberto(false)}
        onConfirm={gerarLoteMensalidades}
        isLoading={gerandoLote}
        mes={mesFiltro}
        ano={anoFiltro}
      />

      <ToastFeedback
        isVisible={toastFeedback.isVisible}
        message={toastFeedback.message}
        type={toastFeedback.type}
        onClose={() => setToastFeedback((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

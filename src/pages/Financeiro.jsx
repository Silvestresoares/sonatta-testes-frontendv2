import React, { useState, useEffect, useMemo } from 'react';
import { exportarParaCSV, exportarParaPDF } from '../utils/exportar';
import { 
  Receipt, Plus, Edit, Trash2, ChevronLeft, ChevronRight, 
  MoreVertical, CheckCircle2, Clock, DollarSign 
} from 'lucide-react';
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
  const [menuAcaoAbertoId, setMenuAcaoAbertoId] = useState(null);

  // 📚 Carregar alunos
  const carregarAlunos = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;
    try {
      const resposta = await fetch(`${API_URL}/api/alunos`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
          headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
        }),
        fetch(`${API_URL}/api/financeiro/resumo?${params.toString()}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!resProfs.ok) throw new Error();
      const profs = await resProfs.json();

      const promessas = profs.map(async (prof) => {
        const resFin = await fetch(`${API_URL}/api/professores/${prof.id}/financeiro?mes=${mesFiltro}&ano=${anoFiltro}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
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
    const isPagoAtual = statusAtual === 'Pago' || statusAtual === 'concluido';
    const novoStatus = isPagoAtual ? 'Pendente' : 'Pago';
    const dataPgto = novoStatus === 'Pago' ? (isMesAtual ? new Date().toISOString().split('T')[0] : `${anoFiltro}-${String(mesFiltro).padStart(2, '0')}-10`) : null;

    try {
      const resposta = await fetch(`${API_URL}/api/financeiro/aluno-${alunoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
        body: JSON.stringify({ status: novoStatus, mes: mesFiltro, ano: anoFiltro })
      });
      if (resposta.ok) {
        if (isMesAtual) {
          setAlunos(prev => prev.map(a =>
            a.id === alunoId ? { ...a, status_mensalidade: novoStatus, data_pagamento_mensalidade: dataPgto } : a
          ));
        }

        // Atualiza transações localmente para a UI reagir instantaneamente
        if (!isMesAtual) {
          if (novoStatus === 'Pago') {
            setTransacoes(prev => [
              { aluno_id: alunoId, tipo: 'Receita', descricao: `Mensalidade - ${alunoNome}`, status: 'Pago', data: dataPgto },
              ...prev
            ]);
          } else {
            setTransacoes(prev => prev.filter(t => !(t.aluno_id === alunoId && t.tipo === 'Receita' && (t.descricao?.toLowerCase().includes('mensalidade') || t.descricao?.toLowerCase().includes(alunoNome.toLowerCase())))));
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
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
          headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
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

  // 📚 Itens de Mensalidades (Alunos individuais e Grupos/Faturas Unificadas)
  // Calcula o status efetivo e data de pagamento de cada aluno ou família para o mês/ano selecionado
  const todosItensMensalidades = useMemo(() => {
    const grupos = {};
    const resultado = [];

    alunos.forEach(aluno => {
      // Procura fatura/transação correspondente a este aluno no mês selecionado
      const faturaIndividual = transacoes.find(t => 
        t.aluno_id === aluno.id && 
        t.tipo === 'Receita' && 
        t.status !== 'Cancelado' &&
        (t.descricao?.toLowerCase().includes('mensalidade') || t.descricao?.toLowerCase().includes(aluno.nome.toLowerCase()))
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
        grupos[aluno.responsavel_id].valor_calculado += Number(aluno.valor_calculado || aluno.mensalidade || 0);
      } else {
        // Aluno avulso / com fatura individual
        const isPagoIndividual = faturaIndividual
          ? (faturaIndividual.status === 'Pago' || faturaIndividual.status === 'concluido')
          : (isMesAtual ? (aluno.status_mensalidade === 'Pago' || aluno.status_mensalidade === 'concluido') : false);

        resultado.push({ 
          ...aluno, 
          isGroup: false,
          fatura_id: faturaIndividual ? faturaIndividual.id : null,
          status_mensalidade: isPagoIndividual ? 'Pago' : 'Pendente',
          data_pagamento_mensalidade: isPagoIndividual
            ? (faturaIndividual?.data || aluno.data_pagamento_mensalidade)
            : null
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
        const alunoSolto = grupo.alunos[0];
        const faturaAlunoSolto = transacoes.find(t => 
          t.aluno_id === alunoSolto.id && 
          t.tipo === 'Receita' && 
          t.status !== 'Cancelado' &&
          (t.descricao?.toLowerCase().includes('mensalidade') || t.descricao?.toLowerCase().includes(alunoSolto.nome.toLowerCase()))
        );
        const isPagoSolto = faturaAlunoSolto
          ? (faturaAlunoSolto.status === 'Pago' || faturaAlunoSolto.status === 'concluido')
          : (isMesAtual ? (alunoSolto.status_mensalidade === 'Pago' || alunoSolto.status_mensalidade === 'concluido') : false);

        resultado.push({ 
          ...alunoSolto, 
          isGroup: false,
          fatura_id: faturaAlunoSolto ? faturaAlunoSolto.id : null,
          status_mensalidade: isPagoSolto ? 'Pago' : 'Pendente',
          data_pagamento_mensalidade: isPagoSolto
            ? (faturaAlunoSolto?.data || alunoSolto.data_pagamento_mensalidade)
            : null
        });
      }
    });

    // Popular nomes dos grupos e buscar fatura unificada de lote
    resultado.forEach(item => {
      if (item.isGroup) {
        item.nome = item.alunos.map(a => a.nome).join(', ');
        item.instrumento = 'Múltiplos';
        
        const fatura = transacoes.find(t => 
          !t.aluno_id &&
          t.responsavel_id != null && item.responsavel_id != null &&
          String(t.responsavel_id) === String(item.responsavel_id) && 
          t.tipo === 'Receita' && 
          t.status !== 'Cancelado'
        );

        if (fatura) {
          const isPagoFatura = fatura.status === 'Pago' || fatura.status === 'concluido';
          item.fatura_id = fatura.id;
          item.status_mensalidade = isPagoFatura ? 'Pago' : fatura.status;
          item.data_pagamento_mensalidade = isPagoFatura ? fatura.data : null;
          item.alunos.forEach(a => {
            a.status_mensalidade = item.status_mensalidade;
            a.data_pagamento_mensalidade = item.data_pagamento_mensalidade;
          });
        } else {
          if (isMesAtual) {
            const todosPagos = item.alunos.length > 0 && item.alunos.every(a => a.status_mensalidade === 'Pago');
            item.status_mensalidade = todosPagos ? 'Pago' : 'Pendente';
          } else {
            item.status_mensalidade = 'Pendente';
          }
          item.data_pagamento_mensalidade = null;
        }
      }
    });

    return resultado;
  }, [alunos, transacoes, isMesAtual]);

  // 🔍 Filtro dos alunos exibidos na tabela por busca e pílulas de status
  const alunosFiltrados = useMemo(() => {
    return todosItensMensalidades.filter(item => {
      const matchBusca = !buscaAlunos || item.nome.toLowerCase().includes(buscaAlunos.toLowerCase());
      const isPago = item.status_mensalidade === 'Pago' || item.status_mensalidade === 'concluido';
      const matchStatus = statusMensalidadeFiltro === 'Todos'
        ? true
        : statusMensalidadeFiltro === 'Pago'
          ? isPago
          : !isPago;
      return matchBusca && matchStatus;
    });
  }, [todosItensMensalidades, buscaAlunos, statusMensalidadeFiltro]);

  // Lógica de Paginação Local
  const alunosPaginados = alunosFiltrados.slice((paginaAlunos - 1) * limite, paginaAlunos * limite);
  const totalPaginasAlunos = Math.ceil(alunosFiltrados.length / limite) || 1;

  // 📊 Resumo Métrico específico da aba Mensalidades (calculado sobre todos os itens do mês)
  const resumoAbaMensalidades = useMemo(() => {
    let totalPrevisto = 0;
    let totalRecebido = 0;
    let totalPendente = 0;
    let countTotal = 0;
    let countPago = 0;
    let countPendente = 0;

    todosItensMensalidades.forEach(item => {
      const val = Number(item.valor_calculado || item.mensalidade || 0);
      totalPrevisto += val;
      countTotal++;

      const isPago = item.status_mensalidade === 'Pago' || item.status_mensalidade === 'concluido';
      if (isPago) {
        totalRecebido += val;
        countPago++;
      } else {
        totalPendente += val;
        countPendente++;
      }
    });

    const percentualRecebido = totalPrevisto > 0 ? Math.round((totalRecebido / totalPrevisto) * 100) : 0;
    return { totalPrevisto, totalRecebido, totalPendente, countTotal, countPago, countPendente, percentualRecebido };
  }, [todosItensMensalidades]);

  const handleMesAnterior = () => {
    if (mesFiltro === 1) {
      setMesFiltro(12);
      setAnoFiltro(prev => prev - 1);
    } else {
      setMesFiltro(prev => prev - 1);
    }
    setPaginaAlunos(1);
  };

  const handleProximoMes = () => {
    if (mesFiltro === 12) {
      setMesFiltro(1);
      setAnoFiltro(prev => prev + 1);
    } else {
      setMesFiltro(prev => prev + 1);
    }
    setPaginaAlunos(1);
  };

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
        <div className="space-y-4">
          {/* 1. Cards de Métricas da Mensalidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Previsto */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                  <Receipt size={14} className="text-sky-400" />
                  Previsto no Período
                </p>
                <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
                  R$ {resumoAbaMensalidades.totalPrevisto.toFixed(2)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {resumoAbaMensalidades.countTotal} cobrança{resumoAbaMensalidades.countTotal === 1 ? '' : 's'} no mês
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                Σ
              </div>
            </div>

            {/* Recebido */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Recebido ({resumoAbaMensalidades.percentualRecebido}%)
                </p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  R$ {resumoAbaMensalidades.totalRecebido.toFixed(2)}
                </p>
                <div className="w-36 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(resumoAbaMensalidades.percentualRecebido, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  {resumoAbaMensalidades.countPago} pagas
                </span>
              </div>
            </div>

            {/* Em Aberto */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  Em Aberto / Pendente
                </p>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                  R$ {resumoAbaMensalidades.totalPendente.toFixed(2)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {resumoAbaMensalidades.countPendente} cobrança{resumoAbaMensalidades.countPendente === 1 ? '' : 's'} a receber
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                  {resumoAbaMensalidades.countPendente} pendentes
                </span>
              </div>
            </div>
          </div>

          {/* 2. Barra de Controle e Filtros Unificada */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Busca e Filtro de Status em Pílulas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Buscar aluno por nome..."
                  value={buscaAlunos}
                  onChange={(e) => {
                    setBuscaAlunos(e.target.value);
                    setPaginaAlunos(1);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
                {buscaAlunos && (
                  <button 
                    onClick={() => setBuscaAlunos('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Pílulas de Status */}
              <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => { setStatusMensalidadeFiltro('Todos'); setPaginaAlunos(1); }}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusMensalidadeFiltro === 'Todos' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos ({resumoAbaMensalidades.countTotal})
                </button>
                <button
                  onClick={() => { setStatusMensalidadeFiltro('Pendente'); setPaginaAlunos(1); }}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusMensalidadeFiltro === 'Pendente' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-400 hover:text-amber-400'
                  }`}
                >
                  Pendentes ({resumoAbaMensalidades.countPendente})
                </button>
                <button
                  onClick={() => { setStatusMensalidadeFiltro('Pago'); setPaginaAlunos(1); }}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusMensalidadeFiltro === 'Pago' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-zinc-400 hover:text-emerald-400'
                  }`}
                >
                  Pagos ({resumoAbaMensalidades.countPago})
                </button>
              </div>
            </div>

            {/* Navegador de Mês / Período e Botão Lote */}
            <div className="flex items-center gap-2 justify-end">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                <button
                  onClick={handleMesAnterior}
                  title="Mês anterior"
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-xs font-semibold text-zinc-200 min-w-[120px] text-center">
                  {meses[mesFiltro - 1]} / {anoFiltro}
                </span>
                <button
                  onClick={handleProximoMes}
                  title="Próximo mês"
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button 
                onClick={() => setModalLoteAberto(true)} 
                disabled={gerandoLote}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <span>⚡</span>
                <span>{gerandoLote ? 'Gerando...' : 'Gerar Lote'}</span>
              </button>
            </div>
          </div>

          {/* 3. Tabela Limpa */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {alunosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table role="table" aria-label="Tabela de mensalidades" className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider">
                      <th className="text-left p-4 font-semibold">Aluno / Detalhes</th>
                      <th className="text-right p-4 font-semibold">Valor</th>
                      <th className="text-center p-4 font-semibold">Vencimento / Pgto</th>
                      <th className="text-center p-4 font-semibold">Status</th>
                      <th className="text-center p-4 font-semibold w-48">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {alunosPaginados.map((aluno) => {
                      const isPago = aluno.status_mensalidade === 'Pago' || aluno.status_mensalidade === 'concluido';
                      const dataPgtoRender = aluno.data_pagamento_mensalidade;
                      const valorFormatado = Number(aluno.valor_calculado || aluno.mensalidade || 0).toFixed(2);
                      const isMenuAberto = menuAcaoAbertoId === (aluno.fatura_id || aluno.id);

                      return (
                        <tr key={aluno.id} className="hover:bg-zinc-800/25 transition-colors">
                          {/* Aluno & Instrumento */}
                          <td className="p-4">
                            {aluno.isGroup ? (
                              <div>
                                <div className="font-semibold text-sky-400 text-sm flex items-center gap-1.5">
                                  <span>👨‍👩‍👧</span>
                                  <span>{aluno.alunos?.[0]?.responsavel_nome ? `${aluno.alunos[0].responsavel_nome} • ` : ''}{aluno.nome}</span>
                                </div>
                                <span className="inline-block mt-0.5 text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-full font-medium">
                                  Fatura Familiar ({aluno.alunos?.length || 2} alunos)
                                </span>
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-zinc-100 text-sm">{aluno.nome}</p>
                                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                                  <span>🎵 {aluno.instrumento || 'Geral'}</span>
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Valor */}
                          <td className="p-4 text-right">
                            <span className="font-mono font-bold text-zinc-100 text-sm">
                              R$ {valorFormatado}
                            </span>
                          </td>

                          {/* Data Pgto / Vencimento */}
                          <td className="p-4 text-center text-xs text-zinc-400">
                            {isPago ? (
                              <span className="text-emerald-400 font-medium flex items-center justify-center gap-1">
                                <CheckCircle2 size={13} />
                                {dataPgtoRender ? formatarData(dataPgtoRender) : 'Pago'}
                              </span>
                            ) : (
                              <span className="text-zinc-500">
                                Vencimento dia {aluno.dia_vencimento_mensalidade || 10}
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              isPago
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {isPago ? '✓ Pago' : '⏳ Pendente'}
                            </span>
                          </td>

                          {/* Ações Simplificadas */}
                          <td className="p-4 text-center">
                            <div className="relative flex items-center justify-center gap-1.5">
                              {/* Botão Principal: Alternar Pago / Desfazer */}
                              <button
                                onClick={() => {
                                  if (aluno.isGroup) {
                                    alternarStatusLancamento(aluno.fatura_id, isPago ? 'Pago' : 'Pendente');
                                  } else {
                                    alternarStatusMensalidade(aluno.id, aluno.nome, isPago ? 'Pago' : 'Pendente');
                                  }
                                }}
                                title={isPago ? "Desfazer pagamento" : "Marcar como pago"}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                                  isPago
                                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                {isPago ? 'Desfazer' : '✓ Marcar Pago'}
                              </button>

                              {/* Menu de Ações Secundárias (•••) */}
                              <div className="relative">
                                <button
                                  onClick={() => setMenuAcaoAbertoId(isMenuAberto ? null : (aluno.fatura_id || aluno.id))}
                                  title="Mais opções"
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {isMenuAberto && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setMenuAcaoAbertoId(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 text-left text-xs animate-in fade-in zoom-in-95">
                                      {/* Gerar Asaas */}
                                      {!isPago && asaasConfigurado && (
                                        <button
                                          onClick={() => {
                                            setMenuAcaoAbertoId(null);
                                            if (aluno.isGroup) {
                                              gerarCobrancaAsaas(aluno.fatura_id, 'lancamento');
                                            } else {
                                              gerarCobrancaAsaas(`aluno-${aluno.id}`, 'mensalidade');
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                          <DollarSign size={14} className="text-sky-400" />
                                          Gerar Cobrança Asaas
                                        </button>
                                      )}

                                      {/* Desmembrar Lote */}
                                      {aluno.isGroup && !isPago && (
                                        <button
                                          onClick={() => {
                                            setMenuAcaoAbertoId(null);
                                            confirmarDesmembramento(aluno.fatura_id);
                                          }}
                                          disabled={desmembrandoId === aluno.fatura_id}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-amber-300 hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                          <span>✂️</span>
                                          Desmembrar em Individuais
                                        </button>
                                      )}

                                      {/* Gerar Mensalidade Individual se Pendente */}
                                      {!isPago && !aluno.isGroup && (
                                        <button
                                          onClick={() => {
                                            setMenuAcaoAbertoId(null);
                                            gerarMensalidadeManual(aluno.id);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                        >
                                          <span>📝</span>
                                          Gerar Mensalidade Avulsa
                                        </button>
                                      )}

                                      {/* Excluir Fatura */}
                                      <button
                                        onClick={() => {
                                          setMenuAcaoAbertoId(null);
                                          deletarLancamento(aluno.fatura_id || aluno.id, aluno.nome);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={14} />
                                        Excluir Fatura
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-base font-medium text-zinc-400">Nenhuma mensalidade encontrada</p>
                <p className="text-xs text-zinc-600 mt-1">Tente ajustar a busca ou o mês selecionado.</p>
              </div>
            )}

            {/* Paginação */}
            {totalPaginasAlunos > 1 && (
              <div className="flex justify-between items-center bg-zinc-950/80 border-t border-zinc-800 p-3.5">
                <div className="text-xs text-zinc-500">
                  Página <span className="font-bold text-zinc-300">{paginaAlunos}</span> de <span className="font-bold text-zinc-300">{totalPaginasAlunos}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPaginaAlunos(p => Math.max(p - 1, 1))}
                    disabled={paginaAlunos === 1}
                    className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-800 disabled:opacity-40 text-zinc-300"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaAlunos(p => Math.min(p + 1, totalPaginasAlunos))}
                    disabled={paginaAlunos === totalPaginasAlunos}
                    className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-800 disabled:opacity-40 text-zinc-300"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
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
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.status === 'Pago' || t.status === 'concluido'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-amber-900/50 text-amber-300'
                                }`}>
                                {t.status === 'Pago' || t.status === 'concluido' ? '✓ Pago' : '⏳ Pendente'}
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
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.status === 'Pago' || t.status === 'concluido'
                          ? 'bg-emerald-900/50 text-emerald-300'
                          : 'bg-amber-900/50 text-amber-300'
                          }`}>
                          {t.status === 'Pago' || t.status === 'concluido' ? '✓ Pago' : '⏳ Pendente'}
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
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${t.status === 'Pago' || t.status === 'concluido'
                              ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
                              : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                              }`}
                          >
                            {t.status === 'Pago' || t.status === 'concluido' ? 'Marcar Pendente' : 'Marcar Pago'}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, History, Upload, PlusCircle, Search, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/Skeleton';
import HistoricoAlunoModal from '../components/HistoricoAlunoModal';
import { exportarParaCSV, exportarParaPDF } from '../utils/exportar';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const ordenarAlunosPorNome = (lista) => [...lista].sort((a, b) =>
  (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
);

const formatarDataParaExibicao = (data) => {
  if (!data) return '-';
  const dataLimpa = typeof data === 'string' ? data.split('T')[0] : data;
  const partes = dataLimpa.split('-');
  if (partes.length !== 3) return dataLimpa;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

export default function Alunos() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('@sonatta:token');
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const limite = 20;

  // Estados do Relatório de Movimentação
  const [abaPrincipal, setAbaPrincipal] = useState('alunos'); // 'alunos' ou 'movimentacao'
  const [dataInicioMov, setDataInicioMov] = useState('');
  const [dataFimMov, setDataFimMov] = useState('');

  // Controle de Edição vs Cadastro
  const [modalAberto, setModalAberto] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState(null);
  const [visualizarAluno, setVisualizarAluno] = useState(null);

  // Controle de Histórico de Aulas
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [alunoHistoricoSelecionado, setAlunoHistoricoSelecionado] = useState(null);

  // Estados para o formulário
  const [nome, setNome] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [dataMatricula, setDataMatricula] = useState('');
  const [primeiraAula, setPrimeiraAula] = useState('');
  const [diaAula, setDiaAula] = useState('Segunda');
  const [horario, setHorario] = useState('');
  const [mensalidade, setMensalidade] = useState('');
  const [quantidadeAulas, setQuantidadeAulas] = useState('');
  const [aulasMesEntrada, setAulasMesEntrada] = useState('4');
  const [statusMensalidade, setStatusMensalidade] = useState('Pendente');
  const [professorId, setProfessorId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');

  // React Query: Movimentações
  const { data: dadosMov = { matriculas: [], cancelamentos: [] }, isLoading: carregandoMov } = useQuery({
    queryKey: ['movimentacao', { dataInicioMov, dataFimMov }],
    queryFn: async () => {
      const url = new URL(`${API_URL}/api/alunos/historico/movimentacao`);
      if (dataInicioMov) url.searchParams.append('dataInicio', dataInicioMov);
      if (dataFimMov) url.searchParams.append('dataFim', dataFimMov);
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro mov');
      return res.json();
    },
    enabled: !!token && abaPrincipal === 'movimentacao',
  });
  
  const matriculasMov = dadosMov.matriculas || [];
  const cancelamentosMov = dadosMov.cancelamentos || [];

  const buscarHistoricoMovimentacao = () => queryClient.invalidateQueries({ queryKey: ['movimentacao'] });

  const exportarMovimentacaoPDF = () => {
    const colunasMatriculas = [
      { header: 'Aluno', key: 'nome' },
      { header: 'Data da Matrícula', key: 'data_matricula' },
      { header: 'Status Atual', key: 'status' }
    ];
    const colunasCancelamentos = [
      { header: 'Aluno', key: 'nome' },
      { header: 'Data do Cancelamento', key: 'data_inativacao' },
      { header: 'Status Atual', key: 'status' }
    ];

    if (matriculasMov.length > 0) {
      exportarParaPDF(
        matriculasMov.map(m => ({ ...m, data_matricula: formatarDataParaExibicao(m.data_matricula) })),
        colunasMatriculas,
        'Relatório de Novas Matrículas',
        'matriculas'
      );
    }
    if (cancelamentosMov.length > 0) {
      exportarParaPDF(
        cancelamentosMov.map(m => ({ ...m, data_inativacao: formatarDataParaExibicao(m.data_inativacao) })),
        colunasCancelamentos,
        'Relatório de Cancelamentos',
        'cancelamentos'
      );
    }
  };

  const exportarMovimentacaoCSV = () => {
    const colunasMatriculas = [
      { header: 'Aluno', key: 'nome' },
      { header: 'Data da Matrícula', key: 'data_matricula' },
      { header: 'Status Atual', key: 'status' }
    ];
    const colunasCancelamentos = [
      { header: 'Aluno', key: 'nome' },
      { header: 'Data do Cancelamento', key: 'data_inativacao' },
      { header: 'Status Atual', key: 'status' }
    ];
    if (matriculasMov.length > 0) exportarParaCSV(matriculasMov, colunasMatriculas, 'matriculas_csv');
    if (cancelamentosMov.length > 0) exportarParaCSV(cancelamentosMov, colunasCancelamentos, 'cancelamentos_csv');
  };

  // React Query: Busca de Alunos
  const { data: dadosAlunos, isLoading: carregandoAlunos } = useQuery({
    queryKey: ['alunos', { pagina, filtroStatus, busca }],
    queryFn: async () => {
      const url = new URL(`${API_URL}/api/alunos`);
      url.searchParams.append('paginated', 'true');
      url.searchParams.append('page', pagina);
      url.searchParams.append('limit', limite);
      url.searchParams.append('busca', busca);
      url.searchParams.append('status', filtroStatus);

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('@sonatta:token'); window.location.href = '/login';
      }
      if (!res.ok) throw new Error('Erro ao buscar alunos');
      return res.json();
    },
    enabled: !!token,
  });

  const alunosOrdenados = dadosAlunos?.data ? dadosAlunos.data : (Array.isArray(dadosAlunos) ? ordenarAlunosPorNome(dadosAlunos) : []);
  const totalPaginas = dadosAlunos?.totalPages || 1;
  const totalAlunos = dadosAlunos?.total || (Array.isArray(dadosAlunos) ? dadosAlunos.length : 0);

  // React Query: Professores e Responsáveis
  const { data: professores = [] } = useQuery({
    queryKey: ['professores'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/professores`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro prof');
      const dados = await res.json();
      return Array.isArray(dados) ? dados.filter(p => p.status === 'Ativo') : [];
    },
    enabled: !!token
  });

  const { data: responsaveis = [] } = useQuery({
    queryKey: ['responsaveis'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/responsaveis`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro resp');
      return res.json();
    },
    enabled: !!token
  });

  const mutacaoStatus = useMutation({
    mutationFn: async (payload) => {
      const resposta = await fetch(`${API_URL}/api/alunos/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!resposta.ok) throw new Error(await resposta.text());
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['alunos'] });
      const previous = queryClient.getQueryData(['alunos', { pagina, filtroStatus, busca }]);
      queryClient.setQueryData(['alunos', { pagina, filtroStatus, busca }], old => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map(a => a.id === payload.id ? { ...a, status: payload.status } : a) };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      alert(`Erro ao alterar status: ${err.message}`);
      queryClient.setQueryData(['alunos', { pagina, filtroStatus, busca }], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['alunos'] })
  });

  const handleAlternarStatus = (e, aluno) => {
    e.stopPropagation();
    if (!token) return alert("Sessão expirada.");

    const novoStatus = aluno.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const payload = {
      ...aluno,
      status: novoStatus,
      cpf: aluno.cpf || '',
      email: aluno.email || '',
      telefone: aluno.telefone || '',
      data_matricula: aluno.data_matricula ? String(aluno.data_matricula).split('T')[0] : '',
      primeira_aula: aluno.primeira_aula ? String(aluno.primeira_aula).split('T')[0] : '',
      horario: aluno.horario || '',
      mensalidade: aluno.mensalidade ? Number(aluno.mensalidade) : 0,
      quantidade_aulas: aluno.quantidade_aulas ? parseInt(aluno.quantidade_aulas) : 4,
      aulas_mes_entrada: aluno.aulas_mes_entrada ? parseInt(aluno.aulas_mes_entrada) : 4,
      professor_id: aluno.professor_id ? Number(aluno.professor_id) : null,
      responsavel_id: aluno.responsavel_id ? Number(aluno.responsavel_id) : null,
      endereco: aluno.endereco || '',
      cidade: aluno.cidade || '',
      estado: aluno.estado || '',
      cep: aluno.cep || ''
    };
    mutacaoStatus.mutate(payload);
  };

  const mutacaoSalvar = useMutation({
    mutationFn: async (dadosAluno) => {
      let URL = idSendoEditado ? `${API_URL}/api/alunos/${idSendoEditado}` : `${API_URL}/api/alunos`;
      let metodo = idSendoEditado ? 'PUT' : 'POST';
      const resposta = await fetch(URL, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dadosAluno)
      });
      if (!resposta.ok) throw new Error(await resposta.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      fecharModal();
    },
    onError: (err) => alert(`Erro do servidor ao salvar: ${err.message}`)
  });

  // 3. SALVAR / EDITAR ALUNO (POST / PUT)
  const handleSalvarAluno = (e) => {
    e.preventDefault();
    if (!token) return alert("Sessão expirada. Faça login novamente.");
    if (!nome.trim()) return alert("O nome do aluno é obrigatório.");

    const dadosAluno = {
      nome, instrumento, status, cpf: cpf || '', email: email || '', telefone: telefone || '',
      data_matricula: dataMatricula || '', primeira_aula: primeiraAula || '', dia_aula: diaAula,
      horario: horario || '', mensalidade: mensalidade ? Number(mensalidade) : 0,
      quantidade_aulas: quantidadeAulas ? parseInt(quantidadeAulas) : 4,
      aulas_mes_entrada: aulasMesEntrada ? parseInt(aulasMesEntrada) : 4,
      status_mensalidade: statusMensalidade,
      professor_id: professorId ? Number(professorId) : null,
      responsavel_id: responsavelId ? Number(responsavelId) : null,
      endereco, cidade, estado, cep
    };

    mutacaoSalvar.mutate(dadosAluno);
  };

  const mutacaoExcluir = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/alunos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao excluir');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      alert("Aluno excluído com sucesso!");
    },
    onError: () => alert("Erro ao tentar excluir.")
  });

  // 4. EXCLUIR ALUNO (DELETE)
  const handleDeletarAluno = (id, nomeAluno) => {
    if (!token) return alert("Sessão expirada.");
    if (window.confirm(`Tem certeza que deseja remover permanentemente o aluno "${nomeAluno}"?`)) {
      mutacaoExcluir.mutate(id);
    }
  };

  // Abrir modal preenchido para edição
  const abrirParaEdicao = (aluno) => {
    setIdSendoEditado(aluno.id);
    setNome(aluno.nome);
    setInstrumento(aluno.instrumento);
    setStatus(aluno.status);
    setCpf(aluno.cpf || '');
    setEmail(aluno.email || '');
    setTelefone(aluno.telefone || '');
    setDataMatricula(aluno.data_matricula ? aluno.data_matricula.split('T')[0] : '');
    setPrimeiraAula(aluno.primeira_aula ? aluno.primeira_aula.split('T')[0] : '');
    setStatusMensalidade(aluno.status_mensalidade || 'Pendente');
    setHorario(aluno.horario || '');

    const diaTratado = aluno.dia_aula ? aluno.dia_aula.replace('-feira', '') : 'Segunda';
    setDiaAula(diaTratado);

    setMensalidade(aluno.mensalidade || '');
    setQuantidadeAulas(aluno.quantidade_aulas?.toString() || '4');
    setAulasMesEntrada(aluno.aulas_mes_entrada || '4');
    setProfessorId(aluno.professor_id || '');
    setResponsavelId(aluno.responsavel_id || '');
    setEndereco(aluno.endereco || '');
    setCidade(aluno.cidade || '');
    setEstado(aluno.estado || '');
    setCep(aluno.cep || '');
    setModalAberto(true);
  };

  const abrirModalHistorico = (aluno) => {
    setAlunoHistoricoSelecionado(aluno);
    setModalHistoricoAberto(true);
  };

  const fecharModalHistorico = () => {
    setModalHistoricoAberto(false);
    setAlunoHistoricoSelecionado(null);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdSendoEditado(null);
    setNome(''); setCpf(''); setEmail(''); setTelefone(''); setDataMatricula(''); setPrimeiraAula(''); setMensalidade(''); setHorario('');
    setInstrumento(''); setStatus('Ativo'); setDiaAula('Segunda'); setQuantidadeAulas(''); setAulasMesEntrada('4');
    setStatusMensalidade('Pendente');
    setProfessorId('');
    setResponsavelId('');
    setEndereco('');
    setCidade('');
    setEstado('');
    setCep('');
  };

  const buscarCep = async (cepBuscado) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEndereco(data.logradouro ? `${data.logradouro}, ` : endereco);
        setCidade(data.localidade || cidade);
        setEstado(data.uf || estado);
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e);
    }
  };



  // Calcular valor por aula (dividido em 4 aulas base, SEMPRE)
  const calcularValorPorAula = () => {
    if (!mensalidade) {
      return '0.00';
    }
    const valor = parseFloat(mensalidade) / 4;
    return valor.toFixed(2);
  };

  // Calcular valor total com sistema de aulas extras
  // Base: 4 aulas = mensalidade completa
  // Acima de 4: +R$ (valor_por_aula) por aula extra
  const calcularValorTotal = () => {
    if (!mensalidade || !quantidadeAulas || quantidadeAulas === '0') {
      return '0.00';
    }

    const mensalidadeBase = parseFloat(mensalidade);
    const valorPorAula = mensalidadeBase / 4;
    const totalAulas = parseInt(quantidadeAulas);

    let valorTotal = 0;

    if (totalAulas <= 4) {
      // Até 4 aulas: cobra valor proporcional
      valorTotal = valorPorAula * totalAulas;
    } else {
      // Acima de 4 aulas: cobra a mensalidade completa + valor por aula extra
      const aulasExtras = totalAulas - 4;
      valorTotal = mensalidadeBase + (aulasExtras * valorPorAula);
    }

    return valorTotal.toFixed(2);
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-y-auto min-h-screen">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Alunos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Dica: use o ícone de lápis para editar detalhes.</p>
        </div>
        <button
          onClick={() => { setIdSendoEditado(null); setModalAberto(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
        >
          + Novo Aluno
        </button>
      </div>

      {/* Abas */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg mb-6 p-1">
        <button
          onClick={() => setAbaPrincipal('alunos')}
          className={`flex-1 py-3 rounded font-medium transition-all ${abaPrincipal === 'alunos' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
        >
          👥 Gerenciar Alunos
        </button>
        <button
          onClick={() => setAbaPrincipal('movimentacao')}
          className={`flex-1 py-3 rounded font-medium transition-all ${abaPrincipal === 'movimentacao' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
        >
          📈 Relatório de Movimentação
        </button>
      </div>

      {abaPrincipal === 'alunos' && (
        <>
          {/* Barra de Filtros */}
          <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="w-full sm:flex-1">
              <input
                type="text" placeholder="🔍 Buscar por nome..." value={busca}
                onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Exibir:</label>
              <select
                value={filtroStatus}
                onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1); }}
                className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="Todos">👥 Todos os Alunos</option>
                <option value="Ativo">🟢 Apenas Ativos</option>
                <option value="Inativo">🔴 Apenas Inativos</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          {carregandoAlunos ? (
            <TableSkeleton />
          ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-zinc-900/50 text-zinc-400 uppercase text-xs">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Instrumento</th>
                    <th className="p-4">Dia de Aula</th>
                    <th className="p-4">Data de Matrícula</th>
                    <th className="p-4">Primeira Aula</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {alunosOrdenados.length > 0 ? (
                    alunosOrdenados.map(aluno => (
                      <tr
                        key={aluno.id}
                        className="hover:bg-zinc-800/40 transition-all select-none"
                      >
                        <td className="p-4 font-medium text-zinc-200">
                          <div>{aluno.nome}</div>
                          {aluno.professor_nome && (
                            <div className="text-xs text-zinc-500 font-normal mt-0.5 flex items-center gap-1">
                              <span>👨‍🏫</span>
                              <span>{aluno.professor_nome}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-zinc-400">{aluno.instrumento}</td>
                        <td className="p-4 text-zinc-300">
                          {aluno.dia_aula} {aluno.horario ? ` às ${aluno.horario}` : ''}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {formatarDataParaExibicao(aluno.data_matricula)}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {formatarDataParaExibicao(aluno.primeira_aula)}
                        </td>
                        <td className="p-4">
                          {/* Botão de Clique Rápido de Status recolocado e funcional */}
                          <button
                            onClick={(e) => handleAlternarStatus(e, aluno)}
                            title="Clique para alternar o status rapidamente"
                            className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:brightness-125 border ${aluno.status === 'Ativo'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                          >
                            {aluno.status === 'Ativo' ? '🟢 Ativo' : '🔴 Inativo'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const telefoneZap = (aluno.telefone || '').replace(/\D/g, '');
                                if (telefoneZap.length >= 10) {
                                  window.open(`https://wa.me/55${telefoneZap}`, '_blank');
                                } else {
                                  alert('O aluno não possui um número de telefone válido cadastrado.');
                                }
                              }}
                              className="text-[#25D366] hover:text-[#20bd5a] p-2 rounded transition-all cursor-pointer hover:bg-[#25D366]/10"
                              title="Contatar via WhatsApp"
                            >
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setVisualizarAluno(aluno); }}
                              className="text-emerald-400 hover:text-emerald-300 p-2 rounded transition-all cursor-pointer hover:bg-emerald-500/10"
                              title="Visualizar ficha completa"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => abrirModalHistorico(aluno)}
                              className="text-zinc-400 hover:text-emerald-400 p-2 rounded transition-all cursor-pointer hover:bg-emerald-500/10"
                              title="Ver Histórico de Aulas"
                            >
                              <History size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); abrirParaEdicao(aluno); }}
                              className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                              title="Editar ficha completa"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate('/materiais', { state: { alunoId: aluno.id } }); }}
                              className="text-amber-400 hover:text-amber-300 p-2 rounded transition-all cursor-pointer hover:bg-amber-500/10"
                              title="Upload de Material"
                            >
                              <Upload size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletarAluno(aluno.id, aluno.nome); }}
                              className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                              title="Excluir aluno definitivamente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-zinc-500">
                        Nenhum aluno encontrado com estes filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Controles de Paginação */}
          {totalPaginas > 1 && (
            <div className="flex justify-between items-center mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Mostrando página <span className="font-bold text-zinc-900 dark:text-white">{pagina}</span> de <span className="font-bold text-zinc-900 dark:text-white">{totalPaginas}</span> ({totalAlunos} alunos no total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina(prev => Math.max(prev - 1, 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {abaPrincipal === 'movimentacao' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-end gap-3 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <div className="w-full md:w-48">
              <label className="text-xs uppercase text-zinc-500 mb-1 block">Data Inicial</label>
              <input
                type="date"
                value={dataInicioMov}
                onChange={(e) => setDataInicioMov(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-xs uppercase text-zinc-500 mb-1 block">Data Final</label>
              <input
                type="date"
                value={dataFimMov}
                onChange={(e) => setDataFimMov(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={buscarHistoricoMovimentacao}
              className="bg-sky-600 hover:bg-sky-700 px-6 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Pesquisar
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-zinc-500 uppercase block mb-1">Novas Matrículas</span>
                <span className="text-2xl font-bold text-emerald-400">{matriculasMov.length}</span>
              </div>
              <span className="text-3xl opacity-50">🟢</span>
            </div>
            <div className="flex-1 bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-zinc-500 uppercase block mb-1">Cancelamentos (Inativações)</span>
                <span className="text-2xl font-bold text-rose-400">{cancelamentosMov.length}</span>
              </div>
              <span className="text-3xl opacity-50">🔴</span>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <button onClick={exportarMovimentacaoPDF} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded transition-colors shadow-lg">📄 EXPORTAR PDF</button>
              <button onClick={exportarMovimentacaoCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded transition-colors shadow-lg">📊 EXPORTAR EXCEL</button>
            </div>
          </div>

          {/* Resumo por Professor */}
          <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
            <h3 className="text-sm font-bold text-zinc-300 uppercase mb-3">Balanço por Professor</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(() => {
                const balanco = {};
                matriculasMov.forEach(m => {
                  const prof = m.professor_nome || 'Sem Professor';
                  balanco[prof] = (balanco[prof] || 0) + 1;
                });
                cancelamentosMov.forEach(c => {
                  const prof = c.professor_nome || 'Sem Professor';
                  balanco[prof] = (balanco[prof] || 0) - 1;
                });
                return Object.keys(balanco).sort().map(prof => (
                  <div key={prof} className="bg-zinc-900 border border-zinc-700 p-3 rounded-md flex justify-between items-center">
                    <span className="text-xs text-zinc-400 truncate pr-2">{prof}</span>
                    <span className={`text-sm font-bold ${balanco[prof] > 0 ? 'text-emerald-400' : balanco[prof] < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {balanco[prof] > 0 ? '+' : ''}{balanco[prof]}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {carregandoMov ? (
            <div className="p-12 text-center text-zinc-500">🔄 Buscando dados...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-emerald-900/50 rounded-xl overflow-hidden bg-zinc-950/50 flex flex-col max-h-[600px]">
                <div className="bg-emerald-900/20 p-3 border-b border-emerald-900/50 sticky top-0">
                  <h3 className="font-bold text-emerald-400">Novas Matrículas ({matriculasMov.length})</h3>
                </div>
                <div className="overflow-y-auto p-2">
                  {matriculasMov.length > 0 ? (
                    <ul className="divide-y divide-zinc-800">
                      {matriculasMov.map(m => (
                        <li key={m.id} className="p-3 hover:bg-zinc-900 transition-colors flex justify-between items-center rounded-lg">
                          <div>
                            <p className="font-medium text-zinc-200">{m.nome}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">👨‍🏫 {m.professor_nome || 'Sem Prof.'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-400">{formatarDataParaExibicao(m.data_matricula)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-zinc-500 text-sm">Sem matrículas no período.</div>
                  )}
                </div>
              </div>

              <div className="border border-rose-900/50 rounded-xl overflow-hidden bg-zinc-950/50 flex flex-col max-h-[600px]">
                <div className="bg-rose-900/20 p-3 border-b border-rose-900/50 sticky top-0">
                  <h3 className="font-bold text-rose-400">Cancelamentos ({cancelamentosMov.length})</h3>
                </div>
                <div className="overflow-y-auto p-2">
                  {cancelamentosMov.length > 0 ? (
                    <ul className="divide-y divide-zinc-800">
                      {cancelamentosMov.map(m => (
                        <li key={m.id} className="p-3 hover:bg-zinc-900 transition-colors flex justify-between items-center rounded-lg">
                          <div>
                            <p className="font-medium text-zinc-200">{m.nome}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">👨‍🏫 {m.professor_nome || 'Sem Prof.'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-400">{formatarDataParaExibicao(m.data_inativacao)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-zinc-500 text-sm">Sem cancelamentos no período.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold">
                {idSendoEditado ? '📋 Editar Ficha do Aluno' : '✨ Nova Matrícula'}
              </h2>
              <button onClick={fecharModal} className="text-zinc-500 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSalvarAluno} className="p-6 space-y-4 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nome Completo</label>
                  <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">WhatsApp / Tel</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={telefone}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      val = val.replace(/^(\d{2})(\d)/g, '($1) $2');
                      val = val.replace(/(\d)(\d{4})$/, '$1-$2');
                      setTelefone(val);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">CPF</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={cpf}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      val = val.replace(/(\d{3})(\d)/, '$1.$2');
                      val = val.replace(/(\d{3})(\d)/, '$1.$2');
                      val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                      setCpf(val);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Endereço Completo</label>
                  <input type="text" placeholder="Rua, Número, Bairro" value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    maxLength={9}
                    value={cep}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
                      setCep(val);
                      if (val.replace(/\D/g, '').length === 8) buscarCep(val);
                    }}
                    onBlur={(e) => buscarCep(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Cidade</label>
                  <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Estado</label>
                  <input type="text" placeholder="SP" maxLength={2} value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>


                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Instrumento</label>
                  <input
                    type="text"
                    value={instrumento}
                    onChange={e => setInstrumento(e.target.value)}
                    placeholder="Ex: Piano, Violão, Canto..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Professor</label>
                  <select
                    value={professorId}
                    onChange={e => setProfessorId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none text-white text-sm cursor-pointer"
                  >
                    <option value="">Nenhum</option>
                    {professores.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Responsável Financeiro</label>
                  <select
                    value={responsavelId}
                    onChange={e => setResponsavelId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none text-white text-sm cursor-pointer"
                  >
                    <option value="">O próprio aluno</option>
                    {responsaveis.map(r => (
                      <option key={r.id} value={r.id}>{r.nome} - {r.cpf || 'Sem CPF'}</option>
                    ))}
                  </select>
                </div>
                {/* LINHA 1: Dia da aula, Horário da aula, Data de matrícula */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Dia da Aula</label>
                    <select value={diaAula} onChange={e => setDiaAula(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none text-white text-sm cursor-pointer">
                      <option value="Segunda">Segunda</option>
                      <option value="Terça">Terça</option>
                      <option value="Quarta">Quarta</option>
                      <option value="Quinta">Quinta</option>
                      <option value="Sexta">Sexta</option>
                      <option value="Sábado">Sábado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Horário da Aula</label>
                    <input
                      type="time"
                      value={horario}
                      onChange={e => setHorario(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none [color-scheme:dark] text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Data de Matrícula</label>
                    <input type="date" value={dataMatricula} onChange={e => setDataMatricula(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none [color-scheme:dark] text-white text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">📅 Primeira Aula</label>
                    <input type="date" value={primeiraAula} onChange={e => setPrimeiraAula(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none [color-scheme:dark] text-white text-sm" />
                  </div>
                </div>

                {/* LINHA 2: Mensalidade, Quantidade de Aulas, Aulas Proporcionais */}
                <div className="col-span-2 grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Mensalidade</label>
                    <input type="number" step="0.01" placeholder="Ex: 250.00" value={mensalidade} onChange={e => setMensalidade(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Aulas/Mês</label>
                    <input type="number" min="1" value={quantidadeAulas} onChange={e => setQuantidadeAulas(e.target.value)} placeholder="Qtd..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Proporcionais</label>
                    <input type="number" min="1" max="4" value={aulasMesEntrada} onChange={e => setAulasMesEntrada(e.target.value)} placeholder="Qtd..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                  </div>
                </div>

                {/* LINHA 3: Valor por Aula, Valor Total */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Valor por Aula (R$)</label>
                    <input type="text" disabled value={`${calcularValorPorAula()}`} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 mt-1 outline-none text-emerald-400 text-sm font-semibold cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Valor Total (R$)</label>
                    <input type="text" disabled value={`${calcularValorTotal()}`} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 mt-1 outline-none text-sky-400 text-sm font-semibold cursor-not-allowed" />
                  </div>
                </div>

                {/* CARD COM BREAKDOWN DO CÁLCULO - COMPACTO */}
                {mensalidade && quantidadeAulas && (
                  <div className="col-span-2 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-lg p-2.5">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-zinc-400">Base (4 aulas):</span>
                        <span className="text-emerald-400 font-bold">R$ {parseFloat(mensalidade).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-zinc-400">Valor/aula:</span>
                        <span className="text-cyan-400 font-bold">R$ {calcularValorPorAula()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-zinc-400">Aulas:</span>
                        <span className="text-white font-bold">{quantidadeAulas}</span>
                      </div>

                      {parseInt(quantidadeAulas) > 4 && (
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-zinc-400">Extras:</span>
                          <span className="text-orange-400 font-bold">{parseInt(quantidadeAulas) - 4} × R$ {calcularValorPorAula()} = R$ {(parseInt(quantidadeAulas - 4) * parseFloat(calcularValorPorAula())).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 mt-1 border-t border-emerald-500/30">
                        <span className="text-white font-bold">💰 TOTAL:</span>
                        <span className="text-emerald-300 font-bold">R$ {calcularValorTotal()}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="pt-4 flex justify-between items-end gap-3 border-t border-zinc-800">
                <div className="w-32">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none text-white text-sm cursor-pointer">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={fecharModal} className="text-zinc-500 hover:text-white px-4 cursor-pointer text-sm">Cancelar</button>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg transition-all cursor-pointer text-sm">
                    {idSendoEditado ? 'Salvar Alterações' : 'Finalizar Matrícula'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      <HistoricoAlunoModal
        isOpen={modalHistoricoAberto}
        onClose={fecharModalHistorico}
        aluno={alunoHistoricoSelecionado}
      />

      {/* Modal de Visualização da Ficha */}
      {visualizarAluno && (
        <ModalVisualizacaoAluno
          aluno={visualizarAluno}
          onClose={() => setVisualizarAluno(null)}
          onEditar={() => {
            const aluno = visualizarAluno;
            setVisualizarAluno(null);
            abrirParaEdicao(aluno);
          }}
        />
      )}
    </div>
  );
}

// ─── MODAL DE VISUALIZAÇÃO / FICHA DO ALUNO ─────────────────────────────────
function ModalVisualizacaoAluno({ aluno, onClose, onEditar }) {
  const formatarData = (data) => {
    if (!data) return '—';
    const clean = typeof data === 'string' ? data.split('T')[0] : data;
    const partes = clean.split('-');
    if (partes.length !== 3) return clean;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  const initials = (aluno.nome || 'A')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const imprimir = () => window.print();

  // Lógica para enviar acesso ao portal via WhatsApp
  const urlPortal = `${window.location.origin}/portal/login`;
  const loginAcesso = aluno.email || aluno.cpf || null;
  const telefoneZap = (aluno.telefone || '').replace(/\D/g, '');
  
  const mensagemWhatsApp = `Olá, ${aluno.nome}! Seu Portal do Aluno na Sonatta está pronto! Por lá você poderá ver sua agenda, materiais de estudo e o financeiro.\n\nAcesse: ${urlPortal}\nLogin: ${loginAcesso}\nSenha provisória: sonatta123\n\nVocê pode alterar essa senha no primeiro acesso.`;
  const urlWhatsApp = `https://wa.me/55${telefoneZap}?text=${encodeURIComponent(mensagemWhatsApp)}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div id="ficha-aluno" className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{aluno.nome}</h2>
              <p className="text-sm text-emerald-400">{aluno.instrumento || 'Sem instrumento informado'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={imprimir}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
              title="Imprimir ficha"
            >
              Imprimir
            </button>
            <button
              onClick={onEditar}
              className="text-xs text-blue-400 hover:text-blue-300 px-2.5 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 transition-all cursor-pointer"
              title="Editar"
            >
              Editar
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status e Matrícula */}
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${aluno.status === 'Ativo'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
              {aluno.status === 'Ativo' ? '🟢 Ativo' : '🔴 Inativo'}
            </span>
            <span className="text-xs text-zinc-500">· Matrícula: {formatarData(aluno.data_matricula)}</span>
          </div>

          {/* Informações Gerais */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cadastro & Contato</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
              <div>
                <p className="text-zinc-500 text-xs">E-mail</p>
                <p className="text-zinc-200 break-all">{aluno.email || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Telefone / WhatsApp</p>
                <p className="text-zinc-200">{aluno.telefone || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">CPF</p>
                <p className="text-zinc-200 font-mono">{aluno.cpf || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Professor Responsável</p>
                <p className="text-zinc-200">{aluno.professor_nome || 'Nenhum'}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-800/50 mt-1">
                <p className="text-zinc-500 text-xs">Responsável Financeiro</p>
                <p className="text-zinc-200">{aluno.responsavel_nome || 'O próprio aluno'}</p>
              </div>
            </div>
          </section>

          {/* Acesso ao Portal */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">🎓</span> Acesso ao Portal do Aluno
            </h3>
            <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 relative z-10">
                <div>
                  <p className="text-emerald-500/70 text-xs">Link do Portal</p>
                  <a href={urlPortal} target="_blank" rel="noreferrer" className="text-emerald-400 font-medium hover:underline break-all text-sm">
                    {urlPortal}
                  </a>
                </div>
                <div>
                  <p className="text-emerald-500/70 text-xs">Login</p>
                  <p className="text-zinc-200 font-medium">{loginAcesso || <span className="text-rose-400 text-xs">⚠️ Cadastre Email ou CPF</span>}</p>
                </div>
                <div>
                  <p className="text-emerald-500/70 text-xs">Senha Padrão (Provisória)</p>
                  <p className="text-zinc-200 font-medium font-mono text-sm tracking-wider">sonatta123</p>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-900/30 relative z-10">
                {telefoneZap.length >= 10 && loginAcesso ? (
                  <a 
                    href={urlWhatsApp}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    Enviar Acesso pelo WhatsApp
                  </a>
                ) : (
                  <p className="text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded text-center border border-amber-500/20">
                    ⚠️ Preencha um WhatsApp válido e um Email/CPF na ficha do aluno para enviar o acesso.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Horários & Aula */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Aulas & Planejamento</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
              <div>
                <p className="text-zinc-500 text-xs">Dia da Aula</p>
                <p className="text-zinc-200">{aluno.dia_aula || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Horário da Aula</p>
                <p className="text-zinc-200">{aluno.horario || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Primeira Aula</p>
                <p className="text-zinc-200">{formatarData(aluno.primeira_aula)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Aulas p/ Mês</p>
                <p className="text-zinc-200">{aluno.quantidade_aulas || 4} aula(s)</p>
              </div>
            </div>
          </section>

          {/* Financeiro */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Situação Financeira</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
              <div>
                <p className="text-zinc-500 text-xs">Mensalidade Base</p>
                <p className="text-zinc-200 font-bold font-mono">R$ {Number(aluno.mensalidade || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Status da Mensalidade</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${aluno.status_mensalidade === 'Pago'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                  {aluno.status_mensalidade || 'Pendente'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

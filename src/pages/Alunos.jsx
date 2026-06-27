import React, { useState, useEffect } from 'react';

// Detecta a URL da internet ou usa o localhost se estiver testando no computador
// Deixe vazio em produção para usar o proxy do vercel.json, ou use a env se preferir
const API_URL = import.meta.env.VITE_API_URL || '';

// Cria o canal de comunicação interna do navegador
const canalComunicacao = new BroadcastChannel('sonatta_updates');
const canalSincronizacao = new BroadcastChannel('sonatta_sync');

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
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Controle de Edição vs Cadastro
  const [modalAberto, setModalAberto] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState(null);

  // Estados para o formulário
  const [nome, setNome] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataMatricula, setDataMatricula] = useState('');
  const [primeiraAula, setPrimeiraAula] = useState('');
  const [diaAula, setDiaAula] = useState('Segunda'); 
  const [horario, setHorario] = useState(''); 
  const [mensalidade, setMensalidade] = useState('');
  const [quantidadeAulas, setQuantidadeAulas] = useState('');
  const [statusMensalidade, setStatusMensalidade] = useState('Pendente');
  const [professorId, setProfessorId] = useState('');
  const [professores, setProfessores] = useState([]);

  // 1. BUSCAR ALUNOS E PROFESSORES (GET)
  const carregarAlunos = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const resposta = await fetch(`${API_URL}/api/alunos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resposta.status === 401 || resposta.status === 403) {
        localStorage.removeItem('@sonatta:token');
        window.location.href = '/login';
      } else if (resposta.ok) {
        const dados = await resposta.json();
        setAlunos(Array.isArray(dados) ? ordenarAlunosPorNome(dados) : []);
      }
    } catch (erro) {
      console.error("Erro ao buscar alunos:", erro);
    }
  };

  const carregarProfessores = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const resposta = await fetch(`${API_URL}/api/professores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resposta.ok) {
        const dados = await resposta.json();
        setProfessores(Array.isArray(dados) ? dados.filter(p => p.status === 'Ativo') : []);
      }
    } catch (erro) {
      console.error("Erro ao buscar professores:", erro);
    }
  };

  useEffect(() => {
    carregarAlunos();
    carregarProfessores();

    // Escuta mensagens de outras páginas
    const escutarCanal = (evento) => {
      if (evento.data === 'atualizar_dados') {
        carregarAlunos();
        carregarProfessores();
      }
    };

    // Escuta quando a aba de alunos fica ativa
    const escutarSincronizacao = (evento) => {
      if (evento.data.tipo === 'muda_aba' && evento.data.aba === 'alunos') {
        carregarAlunos();
        carregarProfessores();
      }
    };

    canalComunicacao.addEventListener('message', escutarCanal);
    canalSincronizacao.addEventListener('message', escutarSincronizacao);

    return () => {
      canalComunicacao.removeEventListener('message', escutarCanal);
      canalSincronizacao.removeEventListener('message', escutarSincronizacao);
    };
  }, []);

  // 2. ALTERAR STATUS RAPIDAMENTE (CORRIGIDO)
  const handleAlternarStatus = async (e, aluno) => {
    e.stopPropagation();
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return alert("Sessão expirada.");

    const novoStatus = aluno.status === 'Ativo' ? 'Inativo' : 'Ativo';

    try {
      const resposta = await fetch(`${API_URL}/api/alunos/${aluno.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...aluno, status: novoStatus })
      });

      if (resposta.ok) {
        // Atualiza a lista local corretamente
        setAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, status: novoStatus } : a));
        canalComunicacao.postMessage('atualizar_dados');
      }
    } catch (erro) {
      console.error("Erro ao alterar status:", erro);
    }
  };

  // 3. SALVAR / EDITAR ALUNO (POST / PUT)
  const handleSalvarAluno = async (e) => {
    e.preventDefault();
    // Removido bloqueio de nome obrigatório no frontend

    const token = localStorage.getItem('@sonatta:token');
    if (!token) return alert("Sessão expirada. Faça login novamente.");

    const dadosAluno = {
      nome: nome,
      instrumento: instrumento,
      status: status,
      cpf: cpf || '',
      email: email || '',
      telefone: telefone || '',
      data_matricula: dataMatricula || '',
      primeira_aula: primeiraAula || '',
      dia_aula: diaAula,
      horario: horario || '', 
      mensalidade: mensalidade ? Number(mensalidade) : 0,
      quantidade_aulas: quantidadeAulas ? parseInt(quantidadeAulas) : 4,
      status_mensalidade: statusMensalidade,
      professor_id: professorId ? Number(professorId) : null
    };

    try {
      let URL = `${API_URL}/api/alunos`;
      let metodo = 'POST';
      const token = localStorage.getItem('@sonatta:token');

      if (!nome.trim()) {
        return alert("O nome do aluno é obrigatório.");
      }

      if (idSendoEditado) {
        URL = `${API_URL}/api/alunos/${idSendoEditado}`;
        metodo = 'PUT';
      }

      const respuesta = await fetch(URL, {
        method: metodo,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosAluno)
      });

      if (respuesta.ok) {
        carregarAlunos();
        // 📢 Notifica todas as páginas sobre a atualização
        setTimeout(() => canalComunicacao.postMessage('atualizar_dados'), 500);
        fecharModal();    
      } else {
        const erroTexto = await respuesta.text();
        alert(`Erro do servidor ao salvar: ${erroTexto}`);
      }
    } catch (erro) {
      console.error("Erro de rede ao salvar dados:", erro);
      alert("Não foi possível conectar ao servidor backend.");
    }
  };

  // 4. EXCLUIR ALUNO (DELETE)
  const handleDeletarAluno = async (id, nomeAluno) => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return alert("Sessão expirada.");

    if (window.confirm(`Tem certeza que deseja remover permanentemente o aluno "${nomeAluno}"?`)) {
      try {
        const resposta = await fetch(`${API_URL}/api/alunos/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (resposta.ok) {
          // Filtra e remove da tela imediatamente
          setAlunos(prev => prev.filter(aluno => aluno.id !== id));
          // 📢 Notifica todas as páginas sobre a exclusão
          canalComunicacao.postMessage('atualizar_dados');
          alert("Aluno excluído com sucesso!");
        } else {
          alert("Erro ao excluir aluno do banco.");
        }
      } catch (error) {
        console.error("Erro na requisição de exclusão:", error);
        alert("Erro de conexão ao tentar deletar.");
      }
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
    setProfessorId(aluno.professor_id || '');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdSendoEditado(null);
    setNome(''); setCpf(''); setEmail(''); setTelefone(''); setDataMatricula(''); setPrimeiraAula(''); setMensalidade(''); setHorario(''); 
    setInstrumento(''); setStatus('Ativo'); setDiaAula('Segunda'); setQuantidadeAulas(''); setStatusMensalidade('Pendente');
    setProfessorId('');
  };

  // Filtros combinados dinâmicos
  const alunosFiltrados = alunos.filter(aluno => {
    const correspondeNome = aluno.nome && aluno.nome.toLowerCase().includes(busca.toLowerCase());
    const correspondeStatus = filtroStatus === 'Todos' || aluno.status === filtroStatus;
    return correspondeNome && correspondeStatus;
  });
  const alunosOrdenados = ordenarAlunosPorNome(alunosFiltrados);

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

  // Criar breakdown explicativo do cálculo
  const gerarBreakdownCalculo = () => {
    if (!mensalidade || !quantidadeAulas || quantidadeAulas === '0') {
      return null;
    }

    const mensalidadeBase = parseFloat(mensalidade);
    const valorPorAula = mensalidadeBase / 4;
    const totalAulas = parseInt(quantidadeAulas);
    
    if (totalAulas <= 4) {
      return {
        tipo: 'proporcional',
        mensagem: `${totalAulas} aula${totalAulas !== 1 ? 's' : ''} × R$ ${valorPorAula.toFixed(2)} = R$ ${calcularValorTotal()}`
      };
    } else {
      const aulasExtras = totalAulas - 4;
      return {
        tipo: 'com_extras',
        mensagem: `Mensalidade (4 aulas) + ${aulasExtras} aula${aulasExtras !== 1 ? 's' : ''} extra${aulasExtras !== 1 ? 's' : ''} = R$ ${mensalidadeBase.toFixed(2)} + R$ ${(aulasExtras * valorPorAula).toFixed(2)} = R$ ${calcularValorTotal()}`
      };
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-y-auto min-h-screen">
      
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

      {/* Barra de Filtros */}
      <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="w-full sm:flex-1">
          <input 
            type="text" placeholder="🔍 Buscar por nome..." value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Exibir:</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="Todos">👥 Todos os Alunos</option>
            <option value="Ativo">🟢 Apenas Ativos</option>
            <option value="Inativo">🔴 Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
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
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:brightness-125 border ${
                          aluno.status === 'Ativo' 
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
                          onClick={(e) => { e.stopPropagation(); abrirParaEdicao(aluno); }}
                          className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                          title="Editar ficha completa"
                        >
                          ✏️
                        </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletarAluno(aluno.id, aluno.nome); }} 
                        className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                        title="Excluir Aluno"
                      >
                        🗑️
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-zinc-500">
                    Nenhum aluno encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {idSendoEditado ? '📋 Editar Ficha do Aluno' : '✨ Nova Matrícula'}
              </h2>
              <button onClick={fecharModal} className="text-zinc-500 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSalvarAluno} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nome Completo</label>
                  <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">WhatsApp / Tel</label>
                  <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">CPF</label>
                  <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
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

                {/* LINHA 2: Mensalidade, Quantidade de Aulas */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Mensalidade</label>
                    <input type="number" step="0.01" placeholder="Ex: 250.00" value={mensalidade} onChange={e => setMensalidade(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Quantidade de Aulas</label>
                    <input type="number" min="1" value={quantidadeAulas} onChange={e => setQuantidadeAulas(e.target.value)} placeholder="Digite a quantidade..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm" />
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
    </div>
  );
}

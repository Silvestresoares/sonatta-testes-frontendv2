import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Phone, Music, ChevronRight, ChevronLeft, Edit2, Trash2, MessageCircle, MapPin, Search, Archive, ArchiveRestore, UserPlus, Megaphone, AlignLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanSkeleton } from '../components/Skeleton';


import { API_URL } from '../utils/api';
const STATUS_STAGES = [
  { id: 'novo_contato', label: 'Novo Contato', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { id: 'agendada', label: 'Aula Agendada', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { id: 'realizada', label: 'Pós Aula (fazer contato)', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  { id: 'matriculado', label: 'Matriculado', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { id: 'perdido', label: 'Perdido', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' }
];

export default function AulasExperimentais() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('@sonatta:token');

  const [mostrando_formulario, setMostrando_formulario] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [busca, setBusca] = useState('');
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  const [formData, setFormData] = useState({
    nome_aluno: '', telefone: '', instrumento: '', data_aula: '', horario_aula: '', professor_id: '', sala_id: '', status: 'agendada', origem: '', anotacoes: ''
  });

  // React Query: Busca com Cache Global e Polling Automático
  const { data: aulas = [], isLoading: carregandoAulas } = useQuery({
    queryKey: ['aulasExperimentais'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais?arquivados=${mostrarArquivados}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar aulas');
      const json = await res.json();
      return json.dados || [];
    },
    enabled: !!token,
    refetchInterval: 10000
  });

  // Re-fetch ao mudar a flag de arquivados
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] });
  }, [mostrarArquivados, queryClient]);

  const { data: professores = [] } = useQuery({
    queryKey: ['professores'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/professores`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar professores');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.dados || []);
    },
    enabled: !!token
  });

  const { data: salas = [] } = useQuery({
    queryKey: ['salasFisicas'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/salas`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar salas');
      return await res.json();
    },
    enabled: !!token
  });

  // Mutações React Query (Atualizações Otimistas e Revalidação Automática)
  const mutacaoSalvar = useMutation({
    mutationFn: async (dados) => {
      const metodo = idSendoEditado ? 'PUT' : 'POST';
      const url = idSendoEditado ? `${API_URL}/api/aulas-experimentais/${idSendoEditado}` : `${API_URL}/api/aulas-experimentais`;
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dados)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.erro || 'Erro ao salvar contato');
      }
      return res.json();
    },
    onSuccess: () => {
      setSucesso(idSendoEditado ? 'Contato atualizado com sucesso!' : 'Novo contato captado!');
      limparEdicao();
      queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] }); // Recarrega os dados imediatamente
    },
    onError: (error) => setErro(error.message)
  });

  const mutacaoStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Erro ao mover contato');
    },
    onMutate: async ({ id, status }) => {
      // Cancela queries ativas para não sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: ['aulasExperimentais'] });
      const aulasAnteriores = queryClient.getQueryData(['aulasExperimentais']);

      // Atualiza o cache de forma instantânea (UX)
      queryClient.setQueryData(['aulasExperimentais'], old =>
        old?.map(a => String(a.id) === String(id) ? { ...a, status } : a)
      );
      return { aulasAnteriores };
    },
    onError: (err, variables, context) => {
      setErro('Erro de conexão ao mover');
      // Reverte se a API falhar
      queryClient.setQueryData(['aulasExperimentais'], context.aulasAnteriores);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] })
  });

  const mutacaoSituacao = useMutation({
    mutationFn: async ({ id, situacao_aula }) => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais/${id}/situacao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ situacao_aula })
      });
      if (!res.ok) throw new Error('Erro ao atualizar situação');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] }),
    onError: () => setErro('Erro de conexão ao atualizar situação')
  });

  const mutacaoExcluir = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir');
    },
    onSuccess: () => {
      setSucesso('Lead excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] });
    },
    onError: () => setErro('Erro ao excluir lead')
  });

  const mutacaoArquivar = useMutation({
    mutationFn: async ({ id, arquivado }) => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais/${id}/arquivar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ arquivado })
      });
      if (!res.ok) throw new Error('Erro ao arquivar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] });
    },
    onError: () => setErro('Erro ao mudar status de arquivamento')
  });

  const mutacaoConverter = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais/${id}/converter`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao converter lead');
      return res.json();
    },
    onSuccess: () => {
      setSucesso('🎉 Lead convertido em Aluno Oficial com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] });
      // Idealmente, redirecionar ou apenas avisar
    },
    onError: () => setErro('Erro ao converter lead em aluno')
  });

  const mutacaoAnotacao = useMutation({
    mutationFn: async (aulaModificada) => {
      const res = await fetch(`${API_URL}/api/aulas-experimentais/${aulaModificada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(aulaModificada)
      });
      if (!res.ok) throw new Error('Erro ao salvar anotação');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulasExperimentais'] })
  });

  useEffect(() => {
    if (erro || sucesso) {
      const timer = setTimeout(() => {
        setErro('');
        setSucesso('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [erro, sucesso]);

  const handleMudanca = (e) => {
    let { name, value } = e.target;
    if (name === 'telefone') {
      value = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{4,5})(\d{4})$/, '$1-$2').slice(0, 15);
    } else if (name === 'nome_aluno') {
      value = value.replace(/\b\w/g, c => c.toUpperCase());
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');
    if (!formData.nome_aluno.trim()) return setErro('Nome do aluno é obrigatório');
    if (!formData.telefone.trim()) return setErro('Telefone é obrigatório');
    mutacaoSalvar.mutate(formData);
  };

  const handleExcluir = (id) => {
    if (window.confirm('Deseja excluir este lead permanentemente?')) {
      mutacaoExcluir.mutate(id);
    }
  };

  const handleEditar = (aula) => {
    setIdSendoEditado(aula.id);
    setFormData({
      nome_aluno: aula.nome_aluno, telefone: aula.telefone, instrumento: aula.instrumento || '',
      data_aula: aula.data_aula ? aula.data_aula.split('T')[0] : '', horario_aula: aula.horario_aula || '',
      professor_id: aula.professor_id || '', sala_id: aula.sala_id || '', status: aula.status || 'novo_contato',
      origem: aula.origem || '', anotacoes: aula.anotacoes || ''
    });
    setMostrando_formulario(true);
  };

  const limparEdicao = () => {
    setIdSendoEditado(null);
    setFormData({ nome_aluno: '', telefone: '', instrumento: '', data_aula: '', horario_aula: '', professor_id: '', sala_id: '', status: 'agendada', origem: '', anotacoes: '' });
    setMostrando_formulario(false);
  };

  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data + 'T00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const moverPara = (aula, direcao) => {
    const currentIndex = STATUS_STAGES.findIndex(s => s.id === (aula.status || 'novo_contato'));
    if (direcao === 'frente' && currentIndex < STATUS_STAGES.length - 1) {
      mutacaoStatus.mutate({ id: aula.id, status: STATUS_STAGES[currentIndex + 1].id });
    } else if (direcao === 'tras' && currentIndex > 0) {
      mutacaoStatus.mutate({ id: aula.id, status: STATUS_STAGES[currentIndex - 1].id });
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white flex flex-col">
      <div className="bg-white dark:bg-gradient-to-r dark:from-zinc-900 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-800 p-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">🚀 CRM & Funil de Vendas</h1>
            <p className="text-zinc-400">Gerencie contatos e aulas experimentais (Refatorado com React Query)</p>
          </div>
          <button onClick={() => setMostrando_formulario(!mostrando_formulario)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
            <Plus size={20} /> Novo Lead
          </button>
        </div>
        
        {/* Barra de Ferramentas: Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar lead por nome, telefone ou instrumento..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => setMostrarArquivados(!mostrarArquivados)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${mostrarArquivados ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'}`}
          >
            {mostrarArquivados ? <ArchiveRestore size={18} /> : <Archive size={18} />}
            {mostrarArquivados ? 'Ocultar Arquivados' : 'Ver Arquivados'}
          </button>
        </div>
      </div>

      {(erro || sucesso) && (
        <div className="px-6 pt-4 flex-shrink-0">
          {erro && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-center gap-2">❌ {erro}</div>}
          {sucesso && <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">✅ {sucesso}</div>}
        </div>
      )}

      {mostrando_formulario && (
        <div className="mx-6 mt-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">{idSendoEditado ? <><Edit2 size={24} /> Editar Contato</> : <><Plus size={24} /> Cadastrar Novo Lead</>}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><User size={16} /> Nome do Aluno *</label>
                <input type="text" name="nome_aluno" value={formData.nome_aluno} onChange={handleMudanca} required placeholder="Ex: João Silva" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Phone size={16} /> Telefone *</label>
                <input type="tel" name="telefone" value={formData.telefone} onChange={handleMudanca} required placeholder="(11) 99999-9999" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Music size={16} /> Instrumento</label>
                <input type="text" name="instrumento" value={formData.instrumento} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Calendar size={16} /> Data da Aula</label>
                <input type="date" name="data_aula" value={formData.data_aula} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Clock size={16} /> Horário</label>
                <input type="time" name="horario_aula" value={formData.horario_aula} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><User size={16} /> Professor</label>
                <select name="professor_id" value={formData.professor_id} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none">
                  <option value="">Selecione...</option>
                  {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><MapPin size={16} /> Sala Física</label>
                <select name="sala_id" value={formData.sala_id} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none">
                  <option value="">Nenhuma específica</option>
                  {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Megaphone size={16} /> Origem (Source)</label>
                <select name="origem" value={formData.origem} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none">
                  <option value="">Desconhecida</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google / Site</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Passou na Frente">Passou na Frente</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={limparEdicao} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-lg">Cancelar</button>
              <button type="submit" disabled={mutacaoSalvar.isPending} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">{idSendoEditado ? 'Salvar Edição' : 'Cadastrar Lead'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-start custom-scrollbar min-h-0">
        {carregandoAulas ? (
          <KanbanSkeleton />
        ) : (
          STATUS_STAGES.map((stage, stageIndex) => {
            const stageAulas = aulas.filter(a => {
              const matchStatus = (a.status || 'novo_contato') === stage.id;
              const term = busca.toLowerCase();
              const matchBusca = term === '' || 
                (a.nome_aluno || '').toLowerCase().includes(term) || 
                (a.telefone || '').includes(term) || 
                (a.instrumento || '').toLowerCase().includes(term);
              return matchStatus && matchBusca;
            });
            return (
              <div
                key={stage.id}
                className={`w-[320px] flex-shrink-0 flex flex-col h-full rounded-xl border transition-colors ${dragOverStage === stage.id ? 'bg-zinc-200/50 dark:bg-zinc-800/80 border-emerald-500/50' : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/50'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const aulaId = e.dataTransfer.getData('aulaId');
                  if (aulaId) mutacaoStatus.mutate({ id: aulaId, status: stage.id });
                }}
              >
                <div className={`px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex justify-between items-center ${stage.color} bg-opacity-20`}>
                  <h3 className="font-bold text-sm uppercase tracking-wider">{stage.label}</h3>
                  <span className="bg-white/20 dark:bg-black/20 text-xs font-bold px-2 py-1 rounded-full">{stageAulas.length}</span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {stageAulas.length === 0 ? (
                    <div className="text-center p-4 text-zinc-400 dark:text-zinc-500 text-sm border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">Nenhum contato</div>
                  ) : (
                    stageAulas.map(aula => (
                      <div
                        key={aula.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('aulaId', aula.id.toString())}
                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:border-emerald-500/50 transition-colors group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-zinc-900 dark:text-white leading-tight">{aula.nome_aluno}</h4>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditar(aula)} className="p-1 text-zinc-400 hover:text-blue-400 transition-colors" title="Editar"><Edit2 size={14} /></button>
                            <button onClick={() => handleExcluir(aula.id)} className="p-1 text-zinc-400 hover:text-rose-400 transition-colors" title="Excluir"><Trash2 size={14} /></button>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <a
                            href={`https://wa.me/55${aula.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${aula.nome_aluno.split(' ')[0]}, tudo bem?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors w-fit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle size={12} /> {aula.telefone}
                          </a>
                          {(aula.data_aula || aula.horario_aula) && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <Calendar size={12} className="text-zinc-400" />
                                <span className={!aula.data_aula || (new Date(aula.data_aula) < new Date()) ? 'text-rose-400 font-medium' : ''}>
                                  {formatarData(aula.data_aula)} {aula.horario_aula && `às ${aula.horario_aula}`}
                                </span>
                              </div>
                              <select
                                value={aula.situacao_aula || 'pendente'}
                                onChange={(e) => mutacaoSituacao.mutate({ id: aula.id, situacao_aula: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 outline-none cursor-pointer hover:border-emerald-500/50 transition-colors w-max
                                  ${aula.situacao_aula === 'presente' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' :
                                    aula.situacao_aula === 'falta' || aula.situacao_aula === 'cancelada' ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' :
                                      aula.situacao_aula === 'reagendada' ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' : 'text-zinc-500'}`}
                              >
                                <option value="pendente">⏳ PENDENTE</option>
                                <option value="presente">✅ VEIO NA AULA</option>
                                <option value="falta">❌ FALTOU</option>
                                <option value="cancelada">🚫 CANCELOU</option>
                                <option value="reagendada">🔄 REAGENDOU</option>
                              </select>
                            </div>
                          )}
                          {aula.instrumento && <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"><Music size={12} className="text-zinc-400" />{aula.instrumento}</div>}
                          {aula.professor_nome && <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"><User size={12} className="text-zinc-400" />{aula.professor_nome}</div>}
                          {aula.sala_nome && <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"><MapPin size={12} className="text-zinc-400" />{aula.sala_nome}</div>}
                          {aula.origem && <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"><Megaphone size={12} className="text-zinc-400" />{aula.origem}</div>}
                          
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded flex flex-col group/note relative">
                            <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1 opacity-70"><AlignLeft size={10} /> Anotações:</span>
                            <textarea
                              defaultValue={aula.anotacoes || ''}
                              placeholder="Adicione uma anotação aqui..."
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => {
                                if (e.target.value !== (aula.anotacoes || '')) {
                                  mutacaoAnotacao.mutate({ ...aula, anotacoes: e.target.value });
                                }
                              }}
                              className="w-full bg-transparent text-[11px] text-amber-900 dark:text-amber-100 outline-none resize-none placeholder-amber-700/50 min-h-[40px]"
                            />
                            <div className="absolute top-1 right-2 opacity-0 group-hover/note:opacity-100 text-[9px] text-amber-600/70 pointer-events-none transition-opacity">Salva ao sair</div>
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-700 flex flex-col gap-2">
                          <div className="flex justify-between items-center w-full">
                            <button onClick={() => mutacaoArquivar.mutate({ id: aula.id, arquivado: !mostrarArquivados })} className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400 hover:text-amber-500 transition-colors" title={mostrarArquivados ? "Desarquivar" : "Arquivar"}>
                              {mostrarArquivados ? <ArchiveRestore size={14} /> : <Archive size={14} />} {mostrarArquivados ? 'Desarquiv' : 'Arquivar'}
                            </button>
                            {(stage.id === 'realizada' || stage.id === 'matriculado') && !mostrarArquivados && (
                              <button onClick={() => mutacaoConverter.mutate(aula.id)} className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors" title="Converter em Aluno Oficial">
                                <UserPlus size={14} /> Converter
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between items-center w-full">
                            <button onClick={() => moverPara(aula, 'tras')} disabled={stageIndex === 0} className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
                            <span className="text-[10px] uppercase font-bold text-zinc-400">Mover</span>
                            <button onClick={() => moverPara(aula, 'frente')} disabled={stageIndex === STATUS_STAGES.length - 1} className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

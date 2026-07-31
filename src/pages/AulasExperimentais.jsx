import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Phone, Music, ChevronRight, ChevronLeft, Edit2, Trash2, MessageCircle } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const STATUS_STAGES = [
  { id: 'novo_contato', label: 'Novo Contato', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { id: 'agendada', label: 'Aula Agendada', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { id: 'realizada', label: 'Aula Realizada(fazer contato)', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  { id: 'matriculado', label: 'Matriculado', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { id: 'perdido', label: 'Perdido', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' }
];

export default function AulasExperimentais() {
  const [aulas, setAulas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrando_formulario, setMostrando_formulario] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const [formData, setFormData] = useState({
    nome_aluno: '',
    telefone: '',
    instrumento: '',
    data_aula: '',
    horario_aula: '',
    professor_id: '',
    status: 'agendada'
  });

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Carregar aulas experimentais
  const carregarAulas = async (silencioso = false) => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    if (!silencioso) setCarregando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/aulas-experimentais`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) throw new Error('Erro ao carregar aulas');

      const dados = await resposta.json();
      setAulas(dados.dados || []);
    } catch (erro) {
      console.error('Erro ao carregar aulas:', erro);
      setErro('Erro ao carregar aulas experimentais');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  };

  const carregarProfessores = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/professores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const dados = await res.json();
        setProfessores(Array.isArray(dados) ? dados : (dados.dados || []));
      }
    } catch (err) {
      console.error('Erro ao carregar professores:', err);
    }
  };

  useEffect(() => {
    carregarAulas();
    carregarProfessores();
    
    const intervalo = setInterval(() => {
      carregarAulas(true);
    }, 10000);
    
    return () => clearInterval(intervalo);
  }, []);

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
      value = value
        .replace(/\D/g, '') // Remove tudo o que não é dígito
        .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2') // Coloca hífen entre o quarto e o quinto dígitos
        .slice(0, 15); // Limita o tamanho máximo
    } else if (name === 'nome_aluno') {
      value = value.replace(/\b\w/g, c => c.toUpperCase()); // Capitaliza a primeira letra de cada palavra
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!formData.nome_aluno.trim()) {
      setErro('Nome do aluno é obrigatório');
      return;
    }
    if (!formData.telefone.trim()) {
      setErro('Telefone é obrigatório');
      return;
    }

    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const metodo = idSendoEditado ? 'PUT' : 'POST';
      const url = idSendoEditado
        ? `${API_URL}/api/aulas-experimentais/${idSendoEditado}`
        : `${API_URL}/api/aulas-experimentais`;

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Erro ao salvar contato');
        return;
      }

      setSucesso(idSendoEditado ? 'Contato atualizado com sucesso! ✏️' : 'Novo contato captado! 🎉');
      limparEdicao();
      setTimeout(() => carregarAulas(true), 1000);
    } catch (erro) {
      setErro('Erro ao salvar aula experimental');
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    // Atualização otimista (instantânea na UI)
    const aulasAnteriores = [...aulas];
    setAulas(prev => prev.map(a => String(a.id) === String(id) ? { ...a, status: novoStatus } : a));

    try {
      const resposta = await fetch(`${API_URL}/api/aulas-experimentais/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (!resposta.ok) {
        setErro('Erro ao mover contato');
        setAulas(aulasAnteriores); // Reverte se falhou no backend
      }
    } catch (err) {
      setErro('Erro de conexão ao mover');
      setAulas(aulasAnteriores); // Reverte se falhou no backend
    }
  };

  const atualizarSituacao = async (id, novaSituacao) => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    // Atualização otimista
    const aulasAnteriores = [...aulas];
    setAulas(prev => prev.map(a => {
      if (String(a.id) === String(id)) {
        const novoStatus = (a.status !== 'matriculado' && a.status !== 'perdido' && novaSituacao !== 'pendente') ? 'realizada' : a.status;
        return { ...a, situacao_aula: novaSituacao, status: novoStatus };
      }
      return a;
    }));

    try {
      const resposta = await fetch(`${API_URL}/api/aulas-experimentais/${id}/situacao`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ situacao_aula: novaSituacao })
      });

      if (!resposta.ok) {
        setErro('Erro ao atualizar situação');
        setAulas(aulasAnteriores);
      }
    } catch (err) {
      setErro('Erro de conexão ao atualizar situação');
      setAulas(aulasAnteriores);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja excluir este lead permanentemente?')) return;
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const resposta = await fetch(`${API_URL}/api/aulas-experimentais/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resposta.ok) throw new Error('Erro ao excluir');
      setSucesso('Lead excluído com sucesso!');
      carregarAulas(true);
    } catch (erro) {
      setErro('Erro ao excluir lead');
    }
  };

  const handleEditar = (aula) => {
    setIdSendoEditado(aula.id);
    setFormData({
      nome_aluno: aula.nome_aluno,
      telefone: aula.telefone,
      instrumento: aula.instrumento || '',
      data_aula: aula.data_aula || '',
      horario_aula: aula.horario_aula || '',
      professor_id: aula.professor_id || '',
      status: aula.status || 'novo_contato'
    });
    setMostrando_formulario(true);
  };

  const limparEdicao = () => {
    setIdSendoEditado(null);
    setFormData({
      nome_aluno: '',
      telefone: '',
      instrumento: '',
      data_aula: '',
      horario_aula: '',
      professor_id: '',
      status: 'agendada'
    });
    setMostrando_formulario(false);
  };

  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data + 'T00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Funções de mover nos botões
  const moverPara = (aula, direcao) => {
    const currentIndex = STATUS_STAGES.findIndex(s => s.id === (aula.status || 'novo_contato'));
    if (direcao === 'frente' && currentIndex < STATUS_STAGES.length - 1) {
      atualizarStatus(aula.id, STATUS_STAGES[currentIndex + 1].id);
    } else if (direcao === 'tras' && currentIndex > 0) {
      atualizarStatus(aula.id, STATUS_STAGES[currentIndex - 1].id);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-zinc-900 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-800 p-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">🚀 CRM & Funil de Vendas</h1>
            <p className="text-zinc-400">Gerencie contatos e aulas experimentais</p>
          </div>
          <button
            onClick={() => setMostrando_formulario(!mostrando_formulario)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            <Plus size={20} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {(erro || sucesso) && (
        <div className="px-6 pt-4 flex-shrink-0">
          {erro && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-center gap-2">
              ❌ {erro}
            </div>
          )}
          {sucesso && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
              ✅ {sucesso}
            </div>
          )}
        </div>
      )}

      {/* Formulário Modal/Inline */}
      {mostrando_formulario && (
        <div className="mx-6 mt-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{idSendoEditado ? '✏️ Editar Contato' : '📝 Cadastrar Novo Lead'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <User size={16} /> Nome do Aluno *
                </label>
                <input type="text" name="nome_aluno" value={formData.nome_aluno} onChange={handleMudanca} required placeholder="Ex: João Silva" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:border-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Phone size={16} /> Telefone *
                </label>
                <input type="tel" name="telefone" value={formData.telefone} onChange={handleMudanca} required placeholder="(11) 99999-9999" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:border-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Music size={16} /> Instrumento (Opcional)
                </label>
                <input type="text" name="instrumento" value={formData.instrumento} onChange={handleMudanca} placeholder="Ex: Piano" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:border-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Calendar size={16} /> Data da Aula (Opcional)
                </label>
                <input type="date" name="data_aula" value={formData.data_aula} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:border-emerald-500 outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Clock size={16} /> Horário (Opcional)
                </label>
                <input type="time" name="horario_aula" value={formData.horario_aula} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:border-emerald-500 outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <User size={16} /> Professor (Opcional)
                </label>
                <select name="professor_id" value={formData.professor_id} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:border-emerald-500 outline-none">
                  <option value="">Selecione...</option>
                  {professores.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={limparEdicao} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">{idSendoEditado ? 'Salvar Edição' : 'Cadastrar Lead'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-start custom-scrollbar min-h-0">
        {carregando ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          STATUS_STAGES.map((stage, stageIndex) => {
            const stageAulas = aulas.filter(a => (a.status || 'novo_contato') === stage.id);
            return (
              <div
                key={stage.id}
                className={`w-[320px] flex-shrink-0 flex flex-col h-full rounded-xl border transition-colors ${dragOverStage === stage.id ? 'bg-zinc-200/50 dark:bg-zinc-800/80 border-emerald-500/50' : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/50'}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.id);
                }}
                onDragLeave={() => {
                  setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const aulaId = e.dataTransfer.getData('aulaId');
                  if (aulaId) {
                    atualizarStatus(aulaId, stage.id);
                  }
                }}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 rounded-t-xl flex justify-between items-center ${stage.color} bg-opacity-20`}>
                  <h3 className="font-bold text-sm uppercase tracking-wider">{stage.label}</h3>
                  <span className="bg-white/20 dark:bg-black/20 text-xs font-bold px-2 py-1 rounded-full">
                    {stageAulas.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {stageAulas.length === 0 ? (
                    <div className="text-center p-4 text-zinc-400 dark:text-zinc-500 text-sm border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      Nenhum contato
                    </div>
                  ) : (
                    stageAulas.map(aula => (
                      <div
                        key={aula.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('aulaId', aula.id.toString());
                        }}
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
                            href={`https://wa.me/55${aula.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors w-fit"
                            title="Chamar no WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle size={12} />
                            {aula.telefone}
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
                                onChange={(e) => atualizarSituacao(aula.id, e.target.value)}
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
                          {aula.instrumento && (
                            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <Music size={12} className="text-zinc-400" />
                              {aula.instrumento}
                            </div>
                          )}
                          {aula.professor_nome && (
                            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <User size={12} className="text-zinc-400" />
                              {aula.professor_nome}
                            </div>
                          )}
                        </div>

                        {/* Move Actions */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700 flex justify-between items-center">
                          <button
                            onClick={() => moverPara(aula, 'tras')}
                            disabled={stageIndex === 0}
                            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Mover</span>
                          <button
                            onClick={() => moverPara(aula, 'frente')}
                            disabled={stageIndex === STATUS_STAGES.length - 1}
                            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
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

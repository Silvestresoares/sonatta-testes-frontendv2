import React, { useState, useEffect } from 'react';
import { X, CheckCircle, BookOpen, MessageSquare, Info, Users, Clock, Music, Calendar } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const STATUS_OPCOES = [
  { id: 'presente', label: 'Presente', icon: <CheckCircle size={16} />, color: 'emerald', activeClass: 'bg-emerald-600/50' },
  { id: 'falta_aluno_aviso', label: 'Falta Aluno (C/ Aviso)', icon: <span className="text-lg">📅</span>, color: 'amber', activeClass: 'bg-amber-600/50' },
  { id: 'falta_aluno_sem_aviso', label: 'Falta Aluno (S/ Aviso)', icon: <span className="text-lg">⏳</span>, color: 'orange', activeClass: 'bg-orange-600/50' },
  { id: 'falta_professor', label: 'Falta Professor', icon: <X size={16} />, color: 'red', activeClass: 'bg-red-600/50' },
  { id: 'aula_reposta', label: 'Aula Reposta', icon: <span className="text-lg">↩️</span>, color: 'blue', activeClass: 'bg-blue-600/50' },
  { id: 'feriado', label: 'Feriado / Recesso', icon: <span className="text-lg">🌴</span>, color: 'zinc', activeClass: 'bg-zinc-600/80' },
  { id: 'cancelada', label: 'Aula Cancelada', icon: <X size={16} />, color: 'red', activeClass: 'bg-red-600/50' },
  { id: 'reagendada', label: 'Aula Reagendada', icon: <span className="text-lg">🔄</span>, color: 'emerald', activeClass: 'bg-emerald-600/50' },
];

export default function RegistroTurmaModal({ isOpen, onClose, turmaAula, onSave }) {
  const [formData, setFormData] = useState({
    conteudo_trabalhado: '',
    tarefas_casa: '',
    anotacoes: '',
    observacoes: ''
  });
  
  const [alunos, setAlunos] = useState([]);
  const [presencas, setPresencas] = useState({}); // { aluno_id: 'status' }
  const [statusGeral, setStatusGeral] = useState('dada'); // 'dada', 'cancelada', 'reagendada'
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (isOpen && turmaAula) {
      carregarAlunosERegistros();
      setErro('');
      setSucesso(false);
      setFormData({
        conteudo_trabalhado: '',
        tarefas_casa: '',
        anotacoes: '',
        observacoes: ''
      });
      setPresencas({});
      setStatusGeral('dada');
    }
  }, [isOpen, turmaAula]);

  const carregarAlunosERegistros = async () => {
    if (!turmaAula?.turma_id) return;
    setCarregando(true);
    try {
      const token = localStorage.getItem('@sonatta:token');
      
      // 1. Buscar alunos da turma
      const resAlunos = await fetch(`${API_URL}/api/turmas/${turmaAula.turma_id}/alunos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resAlunos.ok) throw new Error('Erro ao buscar alunos da turma.');
      const dataAlunos = await resAlunos.json();
      setAlunos(dataAlunos);

      // 2. Buscar registros prévios do dia para esses alunos para preencher
      const dataBusca = turmaAula.data_aula;
      let conteudoUnificado = '';
      let tarefasUnificadas = '';
      let anotacoesUnificadas = '';
      let observacoesUnificadas = '';
      const presencasMap = {};

      for (const aluno of dataAlunos) {
        const params = new URLSearchParams({ data_aula: dataBusca, aluno_id: aluno.id, turma_id: turmaAula.turma_id });
        const resReg = await fetch(`${API_URL}/api/registros-aula/buscar?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resReg.ok) {
          const reg = await resReg.json();
          if (reg) {
            presencasMap[aluno.id] = reg.status_presenca;
            if (!conteudoUnificado && reg.conteudo_trabalhado) conteudoUnificado = reg.conteudo_trabalhado;
            if (!tarefasUnificadas && reg.tarefas_casa) tarefasUnificadas = reg.tarefas_casa;
            if (!anotacoesUnificadas && reg.anotacoes) anotacoesUnificadas = reg.anotacoes;
            if (!observacoesUnificadas && reg.observacoes) observacoesUnificadas = reg.observacoes;
          }
        }
      }

      setPresencas(presencasMap);
      
      const valores = Object.values(presencasMap);
      if (valores.length > 0 && valores.length === dataAlunos.length) {
        if (valores.every(v => v === 'cancelada')) setStatusGeral('cancelada');
        else if (valores.every(v => v === 'reagendada')) setStatusGeral('reagendada');
        else setStatusGeral('dada');
      } else {
        setStatusGeral('dada');
      }

      setFormData({
        conteudo_trabalhado: conteudoUnificado,
        tarefas_casa: tarefasUnificadas,
        anotacoes: anotacoesUnificadas,
        observacoes: observacoesUnificadas
      });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handlePresencaChange = (alunoId, status) => {
    setPresencas(prev => ({ ...prev, [alunoId]: status }));
  };

  const handleMarcarTodos = (status) => {
    const novasPresencas = {};
    alunos.forEach(a => { novasPresencas[a.id] = status; });
    setPresencas(novasPresencas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    
    // A validação de preenchimento obrigatório de presença para todos foi removida a pedido do usuário

    try {
      const token = localStorage.getItem('@sonatta:token');
      const payload = {
        turma_id: turmaAula.turma_id,
        data_aula: turmaAula.data_aula,
        alunos: alunos.map(a => ({ aluno_id: a.id, status_presenca: presencas[a.id] })),
        conteudo_trabalhado: formData.conteudo_trabalhado,
        tarefas_casa: formData.tarefas_casa,
        anotacoes: formData.anotacoes,
        observacoes: formData.observacoes
      };

      const response = await fetch(`${API_URL}/api/registros-aula/turma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao salvar registro de turma.');
      }

      setSucesso(true);
      setTimeout(() => {
        if (onSave) onSave();
        else onClose();
      }, 1500);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-800">
        
        {/* HEADER */}
        <div className="flex-none p-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full text-xs font-bold border border-violet-500/30 flex items-center gap-2">
                  <Users size={14} /> Registro Coletivo de Turma
                </span>
                {sucesso && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    Salvo com sucesso!
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white">{turmaAula?.nome_aluno}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm mt-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar size={16} className="text-violet-400" />
              <span>{turmaAula?.data_aula ? new Date(turmaAula.data_aula + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock size={16} className="text-violet-400" />
              <span>{turmaAula?.horario}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Music size={16} className="text-violet-400" />
              <span>{turmaAula?.instrumento}</span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {erro && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-medium">{erro}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUNA ESQUERDA: LISTA DE ALUNOS E PRESENÇA */}
            <div className="space-y-6">
              
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 text-center">Status Geral da Turma</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setStatusGeral('dada'); handleMarcarTodos('presente'); }}
                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${statusGeral === 'dada' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                  >Aula Dada</button>
                  <button 
                    onClick={() => { setStatusGeral('cancelada'); handleMarcarTodos('cancelada'); }}
                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${statusGeral === 'cancelada' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                  >Aula Cancelada</button>
                  <button 
                    onClick={() => { setStatusGeral('reagendada'); handleMarcarTodos('reagendada'); }}
                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${statusGeral === 'reagendada' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                  >Aula Reagendada</button>
                </div>
              </div>

              {statusGeral === 'dada' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users size={18} className="text-emerald-400" /> Chamada dos Alunos
                  </h3>

                <div className="flex flex-wrap gap-2 mb-4 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 items-center">
                  <span className="text-xs text-zinc-400 mr-2 font-bold uppercase tracking-widest w-full sm:w-auto mb-2 sm:mb-0">Marcar todos:</span>
                  <button onClick={() => handleMarcarTodos('presente')} className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold">Presente</button>
                  <button onClick={() => handleMarcarTodos('falta_aluno_aviso')} className="text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold">Falta (C/ Av.)</button>
                  <button onClick={() => handleMarcarTodos('falta_aluno_sem_aviso')} className="text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold">Falta (S/ Av.)</button>
                  <button onClick={() => handleMarcarTodos('cancelada')} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold">Cancelada</button>
                  <button onClick={() => handleMarcarTodos('reagendada')} className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold">Reagendada</button>
                </div>
                
                {carregando && alunos.length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center py-8 border border-zinc-800 border-dashed rounded-2xl">
                    Carregando alunos da turma...
                  </div>
                ) : alunos.length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center py-8 border border-zinc-800 border-dashed rounded-2xl">
                    Nenhum aluno matriculado nesta turma.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alunos.map(aluno => (
                      <div key={aluno.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 transition-all hover:border-zinc-700">
                        <div className="font-bold text-white mb-3 text-base">{aluno.nome}</div>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPCOES.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handlePresencaChange(aluno.id, opt.id)}
                              className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                                ${presencas[aluno.id] === opt.id 
                                  ? opt.activeClass || `bg-${opt.color}-500 text-white border-${opt.color}-500 shadow-lg shadow-${opt.color}-500/20 scale-105` 
                                  : `bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800`}
                              `}
                            >
                              {opt.icon}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>

            {/* COLUNA DIREITA: REGISTRO PEDAGÓGICO */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-400" /> Registro Pedagógico da Turma
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      Conteúdo Trabalhado
                    </label>
                    <textarea
                      value={formData.conteudo_trabalhado}
                      onChange={(e) => setFormData(p => ({...p, conteudo_trabalhado: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      placeholder="Descreva o que foi ensinado para a turma..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      Tarefas de Casa
                    </label>
                    <textarea
                      value={formData.tarefas_casa}
                      onChange={(e) => setFormData(p => ({...p, tarefas_casa: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                      placeholder="Exercícios e práticas recomendadas..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <MessageSquare size={14} className="text-zinc-500" /> 
                      Anotações (Opcional - Visível para alunos)
                    </label>
                    <textarea
                      value={formData.anotacoes}
                      onChange={(e) => setFormData(p => ({...p, anotacoes: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all resize-none"
                      placeholder="Recados gerais para a turma..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Info size={14} className="text-zinc-500" /> 
                      Observações Internas (Opcional - Invisível)
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData(p => ({...p, observacoes: e.target.value}))}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all resize-none"
                      placeholder="Anotações privadas suas/da escola..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-none p-6 border-t border-zinc-800/80 bg-zinc-950 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            disabled={carregando}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={carregando || alunos.length === 0}
            className={`
              px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all
              ${carregando || alunos.length === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:scale-105 shadow-emerald-500/25 active:scale-95'}
            `}
          >
            {carregando ? 'Salvando...' : 'Salvar Registro da Turma'}
          </button>
        </div>
      </div>
    </div>
  );
}

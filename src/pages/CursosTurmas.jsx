import React, { useState } from 'react';
import { PlusCircle, Trash2, Users, Edit, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function CursosTurmas() {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState('cursos'); // 'cursos' ou 'turmas'

  // Modais Cursos
  const [modalCurso, setModalCurso] = useState(false);
  const [cursoEdit, setCursoEdit] = useState(null);
  const [cursoNome, setCursoNome] = useState('');
  const [cursoDesc, setCursoDesc] = useState('');

  // Modais Turmas
  const [modalTurma, setModalTurma] = useState(false);
  const [turmaEdit, setTurmaEdit] = useState(null);
  const [tCursoId, setTCursoId] = useState('');
  const [tProfId, setTProfId] = useState('');
  const [tNome, setTNome] = useState('');
  const [tDia, setTDia] = useState('Segunda');
  const [tHoraIni, setTHoraIni] = useState('');
  const [tHoraFim, setTHoraFim] = useState('');
  const [tCap, setTCap] = useState(10);

  // Modal Alunos da Turma
  const [modalAlunosTurma, setModalAlunosTurma] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState('');

  // ==========================================
  // React Query: QUERIES
  // ==========================================
  const { data: cursos = [], isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/cursos`);
      if (!res.ok) throw new Error('Erro ao carregar cursos');
      return res.json();
    }
  });

  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({
    queryKey: ['turmas'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/turmas`);
      if (!res.ok) throw new Error('Erro ao carregar turmas');
      return res.json();
    }
  });

  const { data: professores = [] } = useQuery({
    queryKey: ['professores'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/professores`);
      if (!res.ok) throw new Error('Erro ao carregar professores');
      return res.json();
    }
  });

  const { data: todosAlunos = [] } = useQuery({
    queryKey: ['todosAlunos'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/alunos?paginated=false`);
      if (!res.ok) throw new Error('Erro ao carregar alunos');
      return res.json();
    }
  });

  const { data: alunosDaTurma = [], isLoading: loadingAlunosTurma } = useQuery({
    queryKey: ['alunosTurma', turmaSelecionada?.id],
    queryFn: async () => {
      if (!turmaSelecionada) return [];
      const res = await fetch(`${API_URL}/api/turmas/${turmaSelecionada.id}/alunos`);
      if (!res.ok) throw new Error('Erro ao carregar alunos da turma');
      return res.json();
    },
    enabled: !!turmaSelecionada
  });

  // ==========================================
  // React Query: MUTATIONS
  // ==========================================
  const mutationCurso = useMutation({
    mutationFn: async (dados) => {
      const url = dados.id ? `${API_URL}/api/cursos/${dados.id}` : `${API_URL}/api/cursos`;
      const method = dados.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error('Erro ao salvar curso');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cursos']);
      setModalCurso(false);
    }
  });

  const deleteCursoMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/cursos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir curso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cursos']);
    }
  });

  const mutationTurma = useMutation({
    mutationFn: async (dados) => {
      const url = dados.id ? `${API_URL}/api/turmas/${dados.id}` : `${API_URL}/api/turmas`;
      const method = dados.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error('Erro ao salvar turma');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['turmas']);
      setModalTurma(false);
    }
  });

  const deleteTurmaMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/turmas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir turma');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['turmas']);
    }
  });

  const matricularMutation = useMutation({
    mutationFn: async ({ turmaId, alunoId }) => {
      const res = await fetch(`${API_URL}/api/turmas/${turmaId}/alunos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: Number(alunoId) })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.erro || 'Erro ao matricular aluno');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['alunosTurma', variables.turmaId]);
      queryClient.invalidateQueries(['turmas']);
      setAlunoSelecionadoId('');
    },
    onError: (err) => alert(err.message)
  });

  const removerAlunoMutation = useMutation({
    mutationFn: async ({ turmaId, alunoId }) => {
      const res = await fetch(`${API_URL}/api/turmas/${turmaId}/alunos/${alunoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover aluno da turma');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['alunosTurma', variables.turmaId]);
      queryClient.invalidateQueries(['turmas']);
    }
  });

  // ==========================================
  // HANDLERS
  // ==========================================
  const salvarCurso = (e) => {
    e.preventDefault();
    mutationCurso.mutate({
      id: cursoEdit?.id,
      nome: cursoNome,
      descricao: cursoDesc
    });
  };

  const deletarCurso = (id) => {
    if(!window.confirm('Excluir curso? (Pode afetar turmas)')) return;
    deleteCursoMutation.mutate(id);
  };

  const salvarTurma = (e) => {
    e.preventDefault();
    mutationTurma.mutate({
      id: turmaEdit?.id,
      curso_id: Number(tCursoId),
      professor_id: tProfId ? Number(tProfId) : null,
      nome: tNome,
      dia_semana: tDia,
      horario_inicio: tHoraIni,
      horario_fim: tHoraFim,
      capacidade: Number(tCap)
    });
  };

  const deletarTurma = (id) => {
    if(!window.confirm('Excluir turma? (Alunos serão desvinculados)')) return;
    deleteTurmaMutation.mutate(id);
  };

  const abrirModalAlunos = (turma) => {
    setTurmaSelecionada(turma);
    setAlunoSelecionadoId('');
    setModalAlunosTurma(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Cursos e Turmas</h1>
          <p className="text-zinc-400 text-sm">Gerencie a grade curricular e turmas coletivas</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
        <button 
          onClick={() => setAba('cursos')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${aba === 'cursos' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10' : 'text-zinc-400 hover:text-white'}`}
        >
          Cursos Base
        </button>
        <button 
          onClick={() => setAba('turmas')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${aba === 'turmas' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10' : 'text-zinc-400 hover:text-white'}`}
        >
          Turmas Ativas
        </button>
      </div>

      {aba === 'cursos' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4">
          <button onClick={() => { setCursoEdit(null); setCursoNome(''); setCursoDesc(''); setModalCurso(true); }} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mb-4">
            <PlusCircle size={18} /> Novo Curso
          </button>
          
          {loadingCursos ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse mt-4">
              <thead className="bg-zinc-950/50 text-zinc-400 text-sm">
                <tr>
                  <th className="p-4 font-medium border-b border-zinc-800">Nome do Curso</th>
                  <th className="p-4 font-medium border-b border-zinc-800">Descrição</th>
                  <th className="p-4 font-medium border-b border-zinc-800 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cursos.map(c => (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-4 text-white">{c.nome}</td>
                    <td className="p-4 text-zinc-400">{c.descricao || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setCursoEdit(c); setCursoNome(c.nome); setCursoDesc(c.descricao||''); setModalCurso(true); }} className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10" title="Editar"><Edit size={16} /></button>
                        <button onClick={() => deletarCurso(c.id)} className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba === 'turmas' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4">
          <button onClick={() => { setTurmaEdit(null); setTNome(''); setTCursoId(''); setTProfId(''); setModalTurma(true); }} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mb-4">
            <PlusCircle size={18} /> Nova Turma
          </button>

          {loadingTurmas ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse mt-4">
              <thead className="bg-zinc-950/50 text-zinc-400 text-sm">
                <tr>
                  <th className="p-4 font-medium border-b border-zinc-800">Turma</th>
                  <th className="p-4 font-medium border-b border-zinc-800">Curso</th>
                  <th className="p-4 font-medium border-b border-zinc-800">Professor</th>
                  <th className="p-4 font-medium border-b border-zinc-800">Horário</th>
                  <th className="p-4 font-medium border-b border-zinc-800 text-center">Alunos</th>
                  <th className="p-4 font-medium border-b border-zinc-800 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {turmas.map(t => (
                  <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-4 text-white font-medium">{t.nome}</td>
                    <td className="p-4 text-emerald-400">{t.curso_nome}</td>
                    <td className="p-4 text-zinc-300">{t.professor_nome || '-'}</td>
                    <td className="p-4 text-zinc-400">{t.dia_semana}, {t.horario_inicio} às {t.horario_fim}</td>
                    <td className="p-4 text-center">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full text-xs">{t.alunos_matriculados} / {t.capacidade}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirModalAlunos(t)} className="text-emerald-400 hover:text-emerald-300 p-2 rounded transition-all cursor-pointer hover:bg-emerald-500/10" title="Gerenciar Alunos"><Users size={16}/></button>
                        <button onClick={() => { setTurmaEdit(t); setTNome(t.nome); setTCursoId(t.curso_id); setTProfId(t.professor_id||''); setTDia(t.dia_semana); setTHoraIni(t.horario_inicio); setTHoraFim(t.horario_fim); setTCap(t.capacidade); setModalTurma(true); }} className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10" title="Editar"><Edit size={16} /></button>
                        <button onClick={() => deletarTurma(t.id)} className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL CURSO */}
      {modalCurso && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{cursoEdit ? 'Editar Curso' : 'Novo Curso'}</h2>
            <form onSubmit={salvarCurso} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nome do Curso *</label>
                <input type="text" value={cursoNome} onChange={e=>setCursoNome(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
                <textarea value={cursoDesc} onChange={e=>setCursoDesc(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg" rows="3"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={()=>setModalCurso(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={mutationCurso.isPending} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
                  {mutationCurso.isPending && <Loader2 size={16} className="animate-spin" />} Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TURMA */}
      {modalTurma && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">{turmaEdit ? 'Editar Turma' : 'Nova Turma'}</h2>
            <form onSubmit={salvarTurma} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Nome da Turma (Ex: Turma A - Manhã) *</label>
                  <input type="text" value={tNome} onChange={e=>setTNome(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Curso Vinculado *</label>
                  <select value={tCursoId} onChange={e=>setTCursoId(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg">
                    <option value="">Selecione...</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Professor (Opcional)</label>
                  <select value={tProfId} onChange={e=>setTProfId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg">
                    <option value="">Nenhum</option>
                    {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Dia da Semana</label>
                  <select value={tDia} onChange={e=>setTDia(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg">
                    <option>Segunda</option><option>Terça</option><option>Quarta</option><option>Quinta</option><option>Sexta</option><option>Sábado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Capacidade (Alunos)</label>
                  <input type="number" min="1" value={tCap} onChange={e=>setTCap(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Horário Início</label>
                  <input type="time" value={tHoraIni} onChange={e=>setTHoraIni(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Horário Fim</label>
                  <input type="time" value={tHoraFim} onChange={e=>setTHoraFim(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={()=>setModalTurma(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={mutationTurma.isPending} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
                  {mutationTurma.isPending && <Loader2 size={16} className="animate-spin" />} Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALUNOS DA TURMA */}
      {modalAlunosTurma && turmaSelecionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">Alunos: {turmaSelecionada.nome}</h2>
              <button onClick={() => setModalAlunosTurma(false)} className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); matricularMutation.mutate({ turmaId: turmaSelecionada.id, alunoId: alunoSelecionadoId }); }} className="flex gap-3 items-end bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Adicionar Aluno</label>
                  <select 
                    value={alunoSelecionadoId} 
                    onChange={e => setAlunoSelecionadoId(e.target.value)} 
                    className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:border-emerald-500 outline-none transition-colors"
                  >
                    <option value="">Selecione um aluno cadastrado...</option>
                    {todosAlunos.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={!alunoSelecionadoId || (turmaSelecionada.capacidade <= alunosDaTurma.length) || matricularMutation.isPending}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {matricularMutation.isPending && <Loader2 size={16} className="animate-spin" />} Matricular
                </button>
              </form>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-zinc-300 font-medium">Alunos Matriculados</h3>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">
                    {alunosDaTurma.length} / {turmaSelecionada.capacidade}
                  </span>
                </div>
                
                {loadingAlunosTurma ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" /></div>
                ) : alunosDaTurma.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                    Nenhum aluno matriculado nesta turma ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alunosDaTurma.map(aluno => (
                      <div key={aluno.id} className="flex items-center justify-between bg-zinc-800/40 border border-zinc-700/50 px-4 py-3 rounded-lg hover:bg-zinc-800/60 transition-colors">
                        <div>
                          <p className="text-white font-medium">{aluno.nome}</p>
                          <p className="text-xs text-zinc-400">{aluno.email || 'Sem e-mail'} • {aluno.telefone || 'Sem telefone'}</p>
                        </div>
                        <button 
                          onClick={() => {
                            if(window.confirm('Remover aluno desta turma?')) {
                              removerAlunoMutation.mutate({ turmaId: turmaSelecionada.id, alunoId: aluno.id });
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remover Aluno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
              <button type="button" onClick={() => setModalAlunosTurma(false)} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar } from 'lucide-react';


import { API_URL } from '../utils/api';
export default function MinhasTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  
  const [modalAlunosAberto, setModalAlunosAberto] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [alunosTurma, setAlunosTurma] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    carregarTurmas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarTurmas = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`${API_URL}/api/turmas`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!res.ok) throw new Error('Erro ao carregar turmas');
      const data = await res.json();
      setTurmas(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalAlunos = async (turma) => {
    setTurmaSelecionada(turma);
    setModalAlunosAberto(true);
    setCarregandoAlunos(true);
    try {
      const res = await fetch(`${API_URL}/api/turmas/${turma.id}/alunos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!res.ok) throw new Error('Erro ao carregar alunos');
      const data = await res.json();
      setAlunosTurma(data);
    } catch (err) {
      alert('Erro ao carregar alunos: ' + err.message);
    } finally {
      setCarregandoAlunos(false);
    }
  };

  if (carregando) return <div className="p-6 text-zinc-400">Carregando turmas...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          🎓 Minhas Turmas
        </h1>
        <p className="text-zinc-400 text-sm">
          Visualize os detalhes e os alunos das turmas onde você está vinculado.
        </p>
      </div>

      {erro && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/30">
          {erro}
        </div>
      )}

      {turmas.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
          Você ainda não possui turmas vinculadas ao seu perfil.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.map(turma => (
            <div key={turma.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors shadow-lg flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                    {turma.curso_nome}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${turma.status === 'Ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {turma.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{turma.nome}</h3>
                
                <div className="space-y-3 text-sm text-zinc-400 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-zinc-500" />
                    {turma.dia_semana || 'Sem dia definido'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-zinc-500" />
                    {turma.horario_inicio && turma.horario_fim ? `${turma.horario_inicio} às ${turma.horario_fim}` : 'Sem horário definido'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-zinc-500" />
                    {turma.alunos_matriculados} / {turma.capacidade} alunos
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => abrirModalAlunos(turma)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Users size={16} /> Ver Alunos
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Alunos */}
      {modalAlunosAberto && turmaSelecionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-white">
                Alunos: {turmaSelecionada.nome}
              </h2>
              <button onClick={() => setModalAlunosAberto(false)} className="text-zinc-500 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {carregandoAlunos ? (
                <div className="text-center text-zinc-500 py-8">Carregando lista de alunos...</div>
              ) : alunosTurma.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">Nenhum aluno matriculado nesta turma.</div>
              ) : (
                <div className="space-y-3">
                  {alunosTurma.map(aluno => (
                    <div key={aluno.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{aluno.nome}</div>
                        <div className="text-xs text-zinc-500">{aluno.email || 'Sem e-mail'} • {aluno.telefone || 'Sem telefone'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

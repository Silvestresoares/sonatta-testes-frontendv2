import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaHistory, FaFileUpload } from 'react-icons/fa';
import HistoricoAlunoModal from '../components/HistoricoAlunoModal';



import { API_URL } from '../utils/api';
export default function MeusAlunos() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Controle de Histórico de Aulas
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [alunoHistoricoSelecionado, setAlunoHistoricoSelecionado] = useState(null);

  const carregarAlunos = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      setCarregando(true);
      const url = new URL(`${API_URL}/api/alunos`);
      // Não mandamos paginated para vir a lista completa

      const resposta = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        }
      });

      if (resposta.ok) {
        const dados = await resposta.json();
        // A API já filtra os alunos do professor logado.
        // Vamos garantir que exiba apenas os 'Ativos'.
        const lista = Array.isArray(dados) ? dados : (dados.data || []);
        const ativos = lista.filter(a => a.status === 'Ativo');

        // Ordena por nome
        ativos.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
        setAlunos(ativos);
      }
    } catch (erro) {
      console.error("Erro ao buscar alunos:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAlunos();
  }, []);

  const abrirModalHistorico = (aluno) => {
    setAlunoHistoricoSelecionado(aluno);
    setModalHistoricoAberto(true);
  };

  const fecharModalHistorico = () => {
    setModalHistoricoAberto(false);
    setAlunoHistoricoSelecionado(null);
  };

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (a.instrumento && a.instrumento.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-y-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Meus Alunos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerencie seus alunos ativos, consulte o histórico de aulas e envie materiais.</p>
        </div>
      </div>

      <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center shadow-sm relative">
        <FaSearch className="absolute left-7 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar aluno por nome ou instrumento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table role="table" aria-label="Tabela de dados" className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="p-4">Nome do Aluno</th>
                <th className="p-4">Instrumento</th>
                <th className="p-4">Aula</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {carregando ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-zinc-500">Carregando alunos...</td>
                </tr>
              ) : alunosFiltrados.length > 0 ? (
                alunosFiltrados.map(aluno => (
                  <tr key={aluno.id} className="hover:bg-zinc-800/40 transition-all select-none">
                    <td className="p-4 font-medium text-zinc-200">
                      {aluno.nome}
                    </td>
                    <td className="p-4 text-zinc-400">
                      {aluno.instrumento || '-'}
                    </td>
                    <td className="p-4 text-zinc-300">
                      {aluno.dia_aula} {aluno.horario ? `às ${aluno.horario}` : ''}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirModalHistorico(aluno)}
                          className="flex items-center gap-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
                          title="Ver Histórico, Repertório e Boletins"
                        >
                          <FaHistory size={14} /> Ficha Pedagógica
                        </button>
                        <button
                          onClick={() => navigate('/materiais', { state: { alunoId: aluno.id } })}
                          className="flex items-center gap-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
                          title="Upload de Material"
                        >
                          <FaFileUpload size={14} /> Material
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-zinc-500">
                    Nenhum aluno ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HistoricoAlunoModal
        isOpen={modalHistoricoAberto}
        onClose={fecharModalHistorico}
        aluno={alunoHistoricoSelecionado}
      />
    </div>
  );
}

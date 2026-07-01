import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Phone, Music } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3001';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function AulasExperimentais() {
  const [aulas, setAulas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrando_formulario, setMostrando_formulario] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState(null);
  
  const [formData, setFormData] = useState({
    nome_aluno: '',
    telefone: '',
    instrumento: '',
    data_aula: '',
    horario_aula: ''
  });

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Carregar aulas experimentais
  const carregarAulas = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    setCarregando(true);
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
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAulas();
  }, []);

  // Limpar erros/sucessos após 5 segundos
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    // Validações
    if (!formData.nome_aluno.trim()) {
      setErro('Nome do aluno é obrigatório');
      return;
    }
    if (!formData.telefone.trim()) {
      setErro('Telefone é obrigatório');
      return;
    }
    if (!formData.instrumento.trim()) {
      setErro('Instrumento é obrigatório');
      return;
    }
    if (!formData.data_aula) {
      setErro('Data da aula é obrigatória');
      return;
    }
    if (!formData.horario_aula) {
      setErro('Horário da aula é obrigatório');
      return;
    }

    const token = localStorage.getItem('@sonatta:token');
    if (!token) {
      setErro('Token não encontrado');
      return;
    }

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
        setErro(dados.erro || (idSendoEditado ? 'Erro ao atualizar aula experimental' : 'Erro ao criar aula experimental'));
        return;
      }

      setSucesso(idSendoEditado ? 'Aula experimental atualizada com sucesso! ✏️' : 'Aula experimental criada com sucesso! 🎉');
      limparEdicao();
      
      // Recarregar aulas após 1 segundo
      setTimeout(() => {
        carregarAulas();
      }, 1000);
    } catch (erro) {
      console.error('Erro ao criar aula:', erro);
      setErro('Erro ao criar aula experimental');
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Deseja excluir esta aula experimental?')) return;

    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const resposta = await fetch(`${API_URL}/api/aulas-experimentais/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) throw new Error('Erro ao excluir');

      setSucesso('Aula experimental excluída com sucesso!');
      carregarAulas();
    } catch (erro) {
      console.error('Erro ao excluir:', erro);
      setErro('Erro ao excluir aula experimental');
    }
  };

  const handleEditar = (aula) => {
    setIdSendoEditado(aula.id);
    setFormData({
      nome_aluno: aula.nome_aluno,
      telefone: aula.telefone,
      instrumento: aula.instrumento,
      data_aula: aula.data_aula,
      horario_aula: aula.horario_aula
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
      horario_aula: ''
    });
    setMostrando_formulario(false);
  };

  const formatarData = (data) => {
    const d = new Date(data + 'T00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-zinc-900 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">🎓 Aulas Experimentais</h1>
            <p className="text-zinc-400">Cadastre e gerencie aulas experimentais</p>
          </div>
          <button
            onClick={() => setMostrando_formulario(!mostrando_formulario)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            <Plus size={20} />
            Nova Aula Experimental
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
          ❌ {erro}
        </div>
      )}
      {sucesso && (
        <div className="mx-6 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
          ✅ {sucesso}
        </div>
      )}

      {/* Formulário */}
      {mostrando_formulario && (
        <div className="mx-6 mt-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{idSendoEditado ? '✏️ Editar Aula' : '📝 Nova Aula Experimental'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nome do Aluno */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <User size={16} /> Nome do Aluno
                </label>
                <input
                  type="text"
                  name="nome_aluno"
                  value={formData.nome_aluno}
                  onChange={handleMudanca}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Phone size={16} /> Telefone
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleMudanca}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Instrumento */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Music size={16} /> Instrumento
                </label>
                <input
                  type="text"
                  name="instrumento"
                  value={formData.instrumento}
                  onChange={handleMudanca}
                  placeholder="Ex: Guitarra, Piano, Violão..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Data da Aula */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Calendar size={16} /> Data da Aula
                </label>
                <input
                  type="date"
                  name="data_aula"
                  value={formData.data_aula}
                  onChange={handleMudanca}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* Horário da Aula */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                  <Clock size={16} /> Horário da Aula
                </label>
                <input
                  type="time"
                  name="horario_aula"
                  value={formData.horario_aula}
                  onChange={handleMudanca}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={limparEdicao}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all"
              >
                {idSendoEditado ? '💾 Salvar Alterações' : '📅 Agendar Aula Experimental'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Aulas */}
      <div className="p-6">
        {carregando ? (
          <div className="flex justify-center items-center p-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : aulas.length === 0 ? (
          <div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-zinc-400 mb-4">Nenhuma aula experimental cadastrada</p>
            <button
              onClick={() => setMostrando_formulario(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              <Plus size={20} />
              Cadastrar Primeira Aula
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {aulas.map(aula => (
              <div key={aula.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Nome */}
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">ALUNO</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{aula.nome_aluno}</p>
                  </div>

                  {/* Telefone */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">TELEFONE</p>
                    <p className="text-white">{aula.telefone}</p>
                  </div>

                  {/* Instrumento */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">INSTRUMENTO</p>
                    <p className="text-white">{aula.instrumento}</p>
                  </div>

                  {/* Data */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">DATA</p>
                    <p className="text-white text-sm">{formatarData(aula.data_aula)}</p>
                  </div>

                  {/* Horário */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">HORÁRIO</p>
                    <p className="text-white font-mono">{aula.horario_aula}</p>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(aula)}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleExcluir(aula.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

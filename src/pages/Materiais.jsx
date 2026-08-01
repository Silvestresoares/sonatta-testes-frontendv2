import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Search, X, Headphones, FileAudio, FileImage, Download } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [termoBusca, setTermoBusca] = useState('');

  // Form
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resMateriais, resAlunos] = await Promise.all([
        fetch(`${API_URL}/api/materiais`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/alunos`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!resMateriais.ok || !resAlunos.ok) throw new Error('Erro ao carregar dados');

      const dataMateriais = await resMateriais.json();
      let dataAlunos = await resAlunos.json();
      
      // Garante que é um array e filtra apenas alunos ativos
      let listaAlunos = Array.isArray(dataAlunos) ? dataAlunos : (dataAlunos.data || []);
      const alunosAtivos = listaAlunos.filter(a => a.status === 'Ativo');

      setMateriais(dataMateriais);
      setAlunos(alunosAtivos);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 10MB.');
        e.target.value = null;
        setArquivo(null);
        return;
      }
      setArquivo(file);
      if (!nome) {
        setNome(file.name.split('.')[0]); // Sugere o nome do arquivo
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!arquivo || !alunoId || !nome) {
      setErro('Preencha todos os campos obrigatórios (Nome, Aluno e Arquivo).');
      return;
    }

    setEnviando(true);
    setErro('');
    setMensagemSucesso('');

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('aluno_id', alunoId);
    formData.append('arquivo', arquivo);

    try {
      const res = await fetch(`${API_URL}/api/materiais`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Sem Content-Type, o browser define para multipart
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao enviar arquivo.');

      setMensagemSucesso('Material enviado com sucesso!');

      // Limpa formulário
      setNome('');
      setDescricao('');
      setAlunoId('');
      setArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = null;

      carregarDados();

      setTimeout(() => setMensagemSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este material? Ele será apagado do servidor permanentemente.')) return;

    try {
      const res = await fetch(`${API_URL}/api/materiais/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao excluir');

      setMateriais(materiais.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatData = (dataStr) => {
    if (!dataStr) return '';
    const date = new Date(dataStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getFileIcon = (tipo) => {
    if (!tipo) return <FileText size={18} className="text-emerald-400" />;
    if (tipo.includes('audio')) return <Headphones size={18} className="text-purple-400" />;
    if (tipo.includes('image')) return <FileImage size={18} className="text-blue-400" />;
    if (tipo.includes('pdf')) return <FileText size={18} className="text-rose-400" />;
    return <FileText size={18} className="text-emerald-400" />;
  };

  const materiaisFiltrados = materiais.filter(m =>
    m.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    m.aluno_nome?.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (carregando) return <div className="p-6 text-zinc-400">Carregando repositório...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="text-emerald-400" size={32} />
            Repositório de Arquivos
          </h1>
          <p className="text-zinc-400 mt-1">Envie materiais didáticos, partituras e backing tracks para seus alunos.</p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')}><X size={18} /></button>
        </div>
      )}

      {mensagemSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg">
          {mensagemSucesso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Painel de Upload */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="text-emerald-400" size={20} />
              Enviar Novo Material
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Aluno Destino *</label>
                <select
                  value={alunoId}
                  onChange={e => setAlunoId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Arquivo (Máx 10MB) *</label>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf, .jpg, .jpeg, .png, .mp3, .wav, .m4a"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 transition-colors cursor-pointer"
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Formatos suportados: PDF, JPG, PNG, MP3, WAV, M4A.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Nome / Título *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Partitura Für Elise"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Descrição (Opcional)</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Instruções para estudo..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none h-20"
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Fazer Upload'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Arquivos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-2 items-center">
            <Search className="text-zinc-500 ml-2" size={20} />
            <input
              type="text"
              placeholder="Buscar por arquivo ou aluno..."
              value={termoBusca}
              onChange={e => setTermoBusca(e.target.value)}
              className="bg-transparent border-none text-white w-full px-3 py-2 focus:outline-none text-sm placeholder-zinc-500"
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            {materiaisFiltrados.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                Nenhum material encontrado. Envie o primeiro arquivo ao lado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-950/50 text-xs uppercase font-semibold text-zinc-500">
                    <tr>
                      <th className="px-6 py-4">Arquivo</th>
                      <th className="px-6 py-4">Aluno Destino</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {materiaisFiltrados.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white mb-1 flex items-center gap-2">
                            {getFileIcon(m.tipo)}
                            {m.nome}
                          </div>
                          {m.descricao && <div className="text-xs text-zinc-500 truncate max-w-xs">{m.descricao}</div>}
                          {m.tipo && m.tipo.includes('audio') && (
                            <div className="mt-2">
                              <audio 
                                controls 
                                className="h-8 max-w-xs w-full filter drop-shadow-md rounded outline-none" 
                                src={m.caminho_arquivo.startsWith('http') ? m.caminho_arquivo : `${API_URL}/uploads/${m.caminho_arquivo}`}
                              >
                                O seu navegador não suporta áudio.
                              </audio>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-300">
                            {m.aluno_nome}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {formatData(m.data_upload)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={m.caminho_arquivo.startsWith('http') ? m.caminho_arquivo : `${API_URL}/uploads/${m.caminho_arquivo}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:text-sky-300 p-2 rounded transition-all cursor-pointer hover:bg-sky-500/10"
                              title="Baixar/Visualizar"
                            >
                              <Download size={18} />
                            </a>
                            <button
                              onClick={() => handleExcluir(m.id)}
                              className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                              title="Excluir Definitivamente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

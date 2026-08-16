import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { Music, Plus, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';

interface Musica {
  id: number;
  nome_musica: string;
  artista: string;
  status: string;
  link_partitura: string;
  observacoes: string;
}

export default function RepertorioAluno({ alunoId, token }: { alunoId: number, token: string }) {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({ nome_musica: '', artista: '', link_partitura: '', observacoes: '' });
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    carregarRepertorio();
  }, [alunoId]);

  const carregarRepertorio = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`${API_URL}/api/repertorio/aluno/${alunoId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (res.ok) {
        setMusicas(await res.json());
      }
    } catch (err) {
      console.error(err);
      setErro('Falha ao carregar repertório');
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = editandoId !== null;
      const url = isEdit ? `${API_URL}/api/repertorio/${editandoId}` : `${API_URL}/api/repertorio`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
        body: JSON.stringify({ ...form, aluno_id: alunoId })
      });

      if (res.ok) {
        setForm({ nome_musica: '', artista: '', link_partitura: '', observacoes: '' });
        setEditandoId(null);
        carregarRepertorio();
      } else {
        const errorData = await res.json();
        alert('Erro: ' + (errorData.erro || 'Não foi possível salvar.'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar música.');
    }
  };

  const mudarStatus = async (id: number, novoStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/repertorio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) carregarRepertorio();
    } catch (err) {
      console.error(err);
    }
  };

  const excluirMusica = async (id: number) => {
    if (!window.confirm('Excluir esta música?')) return;
    try {
      const res = await fetch(`${API_URL}/api/repertorio/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (res.ok) carregarRepertorio();
    } catch (err) {
      console.error(err);
    }
  };

  if (carregando) return <div className="p-4 text-zinc-400">Carregando repertório...</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSalvar} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
        <h3 className="text-emerald-500 font-bold flex items-center gap-2">
          <Music size={18} /> {editandoId ? 'Editar Música' : 'Nova Música no Repertório'}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase">Música *</label>
            <input required type="text" value={form.nome_musica} onChange={e => setForm({...form, nome_musica: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">Artista</label>
            <input type="text" value={form.artista} onChange={e => setForm({...form, artista: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 uppercase">Link de Referência (YouTube/Drive)</label>
            <input type="url" value={form.link_partitura} onChange={e => setForm({...form, link_partitura: e.target.value})} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm" />
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            {editandoId && <button type="button" onClick={() => {setEditandoId(null); setForm({ nome_musica: '', artista: '', link_partitura: '', observacoes: '' });}} className="px-4 py-2 text-sm text-zinc-400">Cancelar</button>}
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
              <Plus size={16} /> Salvar Música
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-3">
        {musicas.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">Nenhuma música no repertório ainda.</p>
        ) : (
          musicas.map(m => (
            <div key={m.id} className="bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-zinc-200 font-bold">{m.nome_musica} <span className="text-zinc-500 text-sm font-normal">({m.artista || 'Desconhecido'})</span></h4>
                {m.link_partitura && (
                  <a href={m.link_partitura} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline mt-1 block">Ver Referência / Partitura</a>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <select 
                  value={m.status} 
                  onChange={(e) => mudarStatus(m.id, e.target.value)}
                  className={`text-xs font-bold px-2 py-1 border rounded-full outline-none bg-zinc-950 ${
                    m.status === 'Concluído' ? 'text-emerald-400 border-emerald-500/30' : 
                    m.status === 'Praticando' ? 'text-amber-400 border-amber-500/30' : 
                    'text-zinc-400 border-zinc-700'
                  }`}
                >
                  <option value="Iniciando">Iniciando</option>
                  <option value="Praticando">Praticando</option>
                  <option value="Concluído">Concluído</option>
                </select>

                <button onClick={() => { setEditandoId(m.id); setForm({ nome_musica: m.nome_musica, artista: m.artista, link_partitura: m.link_partitura || '', observacoes: m.observacoes || '' }); }} className="text-zinc-500 hover:text-blue-400">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => excluirMusica(m.id)} className="text-zinc-500 hover:text-rose-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

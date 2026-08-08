import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { Star, FileText, Trash2, Edit2, CheckCircle, Save } from 'lucide-react';

interface Avaliacao {
  id: number;
  periodo: string;
  tipo_avaliacao: string;
  nota_tecnica: number;
  nota_leitura: number;
  nota_repertorio: number;
  nota_musicalidade: number;
  comentario_geral: string;
  data_avaliacao: string;
  professor_nome?: string;
}

const StarRating = ({ value, onChange, readonly = false }: { value: number, onChange?: (val: number) => void, readonly?: boolean }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={20}
          className={`cursor-pointer ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'} ${readonly ? 'cursor-default' : ''}`}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  );
};

export default function AvaliacaoAluno({ alunoId, token }: { alunoId: number, token: string }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [exibindoForm, setExibindoForm] = useState(false);
  
  const [form, setForm] = useState({
    periodo: '',
    tipo_avaliacao: 'estrelas',
    nota_tecnica: 0,
    nota_leitura: 0,
    nota_repertorio: 0,
    nota_musicalidade: 0,
    comentario_geral: ''
  });
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    carregarAvaliacoes();
  }, [alunoId]);

  const carregarAvaliacoes = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`${API_URL}/api/avaliacoes/aluno/${alunoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAvaliacoes(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = editandoId !== null;
      const url = isEdit ? `${API_URL}/api/avaliacoes/${editandoId}` : `${API_URL}/api/avaliacoes`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, aluno_id: alunoId })
      });

      if (res.ok) {
        setForm({ periodo: '', tipo_avaliacao: 'estrelas', nota_tecnica: 0, nota_leitura: 0, nota_repertorio: 0, nota_musicalidade: 0, comentario_geral: '' });
        setEditandoId(null);
        setExibindoForm(false);
        carregarAvaliacoes();
      } else {
        const errorData = await res.json();
        alert('Erro: ' + (errorData.erro || 'Não foi possível salvar a avaliação.'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar avaliação.');
    }
  };

  const excluirAvaliacao = async (id: number) => {
    if (!window.confirm('Excluir este boletim?')) return;
    try {
      const res = await fetch(`${API_URL}/api/avaliacoes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) carregarAvaliacoes();
    } catch (err) {
      console.error(err);
    }
  };

  const renderInputNota = (label: string, field: keyof typeof form) => {
    if (form.tipo_avaliacao === 'estrelas') {
      return (
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
          <span className="text-sm text-zinc-300">{label}</span>
          <StarRating value={Number(form[field])} onChange={(val) => setForm({...form, [field]: val})} />
        </div>
      );
    }
    return (
      <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
        <span className="text-sm text-zinc-300">{label} (0-10)</span>
        <input 
          type="number" min="0" max="10" step="0.5" 
          value={form[field]} 
          onChange={(e) => setForm({...form, [field]: e.target.value})} 
          className="w-20 bg-zinc-800 border border-zinc-700 rounded p-1 text-white text-center" 
        />
      </div>
    );
  };

  if (carregando) return <div className="p-4 text-zinc-400">Carregando boletins...</div>;

  return (
    <div className="space-y-6">
      {!exibindoForm && (
        <div className="flex justify-end">
          <button 
            onClick={() => setExibindoForm(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm"
          >
            <FileText size={16} /> Novo Boletim
          </button>
        </div>
      )}

      {exibindoForm && (
        <form onSubmit={handleSalvar} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-5">
          <h3 className="text-sky-400 font-bold flex items-center gap-2">
            <CheckCircle size={18} /> {editandoId ? 'Editar Boletim' : 'Lançar Novo Boletim'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase">Período *</label>
              <input required type="text" placeholder="Ex: 1º Semestre 2026" value={form.periodo} onChange={e => setForm({...form, periodo: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase">Formato</label>
              <select value={form.tipo_avaliacao} onChange={e => setForm({...form, tipo_avaliacao: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm">
                <option value="estrelas">Estrelas (Infantil)</option>
                <option value="notas">Notas 0 a 10 (Adultos)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputNota('Técnica', 'nota_tecnica')}
            {renderInputNota('Leitura', 'nota_leitura')}
            {renderInputNota('Repertório', 'nota_repertorio')}
            {renderInputNota('Musicalidade', 'nota_musicalidade')}
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase">Comentário / Feedback do Professor</label>
            <textarea rows={3} value={form.comentario_geral} onChange={e => setForm({...form, comentario_geral: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => {setExibindoForm(false); setEditandoId(null);}} className="px-4 py-2 text-sm text-zinc-400">Cancelar</button>
            <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
              <Save size={16} /> Salvar Avaliação
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {avaliacoes.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">Nenhum boletim lançado.</p>
        ) : (
          avaliacoes.map(av => (
            <div key={av.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h4 className="text-zinc-200 font-bold text-lg">{av.periodo}</h4>
                  <p className="text-zinc-500 text-xs">Professor(a): {av.professor_nome || 'N/A'}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => {
                    setForm({
                      periodo: av.periodo, tipo_avaliacao: av.tipo_avaliacao || 'estrelas',
                      nota_tecnica: av.nota_tecnica || 0, nota_leitura: av.nota_leitura || 0,
                      nota_repertorio: av.nota_repertorio || 0, nota_musicalidade: av.nota_musicalidade || 0,
                      comentario_geral: av.comentario_geral || ''
                    });
                    setEditandoId(av.id);
                    setExibindoForm(true);
                  }} className="text-zinc-500 hover:text-blue-400"><Edit2 size={16} /></button>
                  <button onClick={() => excluirAvaliacao(av.id)} className="text-zinc-500 hover:text-rose-400"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { l: 'Técnica', v: av.nota_tecnica },
                  { l: 'Leitura', v: av.nota_leitura },
                  { l: 'Repertório', v: av.nota_repertorio },
                  { l: 'Musicalidade', v: av.nota_musicalidade }
                ].map(item => (
                  <div key={item.l} className="bg-zinc-950 p-2 rounded border border-zinc-800 text-center flex flex-col items-center justify-center min-h-[60px]">
                    <span className="text-[10px] text-zinc-500 uppercase">{item.l}</span>
                    <div className="mt-1">
                      {av.tipo_avaliacao === 'estrelas' ? (
                        <div className="scale-75 origin-center"><StarRating value={Number(item.v)} readonly /></div>
                      ) : (
                        <span className="font-bold text-sky-400">{Number(item.v).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {av.comentario_geral && (
                <div className="bg-zinc-950/50 p-3 rounded text-sm text-zinc-300 italic">
                  "{av.comentario_geral}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

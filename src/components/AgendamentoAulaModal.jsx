import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Repeat, RotateCcw, User, Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);
const canalComunicacao = new BroadcastChannel('sonatta_updates');

const TIPO_CONFIG = {
  aula_extra: { label: 'Aula Extra', icon: PlusCircle, color: 'emerald' },
  reagendada: { label: 'Reagendamento', icon: Repeat, color: 'blue' },
  reposicao: { label: 'Reposição', icon: RotateCcw, color: 'red' },
};

export default function AgendamentoAulaModal({ isOpen, onClose, initialData = null, tipoPadrao = 'aula_extra', onSaveSuccess }) {
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [tipoSelecionado, setTipoSelecionado] = useState(tipoPadrao);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [formData, setFormData] = useState({
    aluno_id: '',
    professor_id: '',
    data: '',
    horario: ''
  });
  const [status, setStatus] = useState({ loading: false, error: '', success: false });
  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    if (isOpen) {
      carregarAlunos();
      carregarProfessores();
      if (initialData) {
        setFormData({
          aluno_id: initialData.aluno_id || '',
          professor_id: initialData.professor_id || '',
          data: initialData.data_aula || initialData.data || '',
          horario: initialData.horario || ''
        });
        setTipoSelecionado(initialData.tipo_aula || tipoPadrao);
      } else {
        setFormData({ aluno_id: '', professor_id: '', data: '', horario: '' });
        setTipoSelecionado(tipoPadrao);
      }
      setStatus({ loading: false, error: '', success: false });
    }
  }, [isOpen, initialData, tipoPadrao]);

  // Quando aluno é selecionado, pré-seleciona o professor vinculado a ele
  useEffect(() => {
    if (formData.aluno_id && alunos.length > 0) {
      const aluno = alunos.find(a => String(a.id) === String(formData.aluno_id));
      if (aluno?.professor_id) {
        setFormData(f => ({ ...f, professor_id: String(aluno.professor_id) }));
      }
    }
  }, [formData.aluno_id, alunos]);

  const carregarAlunos = async () => {
    setCarregandoAlunos(true);
    try {
      const resposta = await fetch(`${API_URL}/api/alunos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setAlunos(dados.filter(a => a.status === 'Ativo'));
      }
    } catch (erro) {
      console.error('Erro ao carregar alunos:', erro);
    } finally {
      setCarregandoAlunos(false);
    }
  };

  const carregarProfessores = async () => {
    try {
      const resposta = await fetch(`${API_URL}/api/professores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setProfessores(dados.filter(p => p.status === 'Ativo'));
      }
    } catch (erro) {
      console.error('Erro ao carregar professores:', erro);
    }
  };

  const handleSalvarAgendamento = async (e) => {
    e.preventDefault();
    if (!formData.aluno_id || !formData.data || !formData.horario) {
      return setStatus({ ...status, error: 'Preencha todos os campos obrigatórios!' });
    }

    setStatus({ loading: true, error: '', success: false });

    try {
      const aluno = alunos.find(a => String(a.id) === String(formData.aluno_id));
      if (!aluno) throw new Error('Aluno não encontrado');

      const payload = {
        aluno_id: aluno.id,
        nome_aluno: aluno.nome,
        instrumento: aluno.instrumento || '',
        telefone: aluno.telefone || '',
        data: formData.data,
        horario: formData.horario,
        status: 'agendada',
        tipo_aula: tipoSelecionado,
        professor_id: formData.professor_id ? Number(formData.professor_id) : null,
      };

      // Se for experimental, o backend espera campos levemente diferentes
      if (tipoSelecionado === 'aula_experimental') {
        payload.horario_aula = formData.horario;
        payload.data_aula = formData.data;
      }

      const method = initialData ? 'PUT' : 'POST';
      const rawId = initialData?.aula_id_referencia || initialData?.id || initialData?.aula_id;
      const aulaId = rawId ? String(rawId).replace(/^\D+/g, '') : null;
      const endpoint = tipoSelecionado === 'aula_experimental' ? 'aulas-experimentais' : 'aulas';
      const url = initialData ? `${API_URL}/api/${endpoint}/${aulaId}` : `${API_URL}/api/${endpoint}`;

      const resposta = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (resposta.ok) {
        setStatus({ loading: false, error: '', success: true });
        canalComunicacao.postMessage('atualizar_dados');
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => onClose(), 2000);
      } else {
        const dados = await resposta.json();
        throw new Error(dados.erro || 'Falha ao agendar aula');
      }
    } catch (erro) {
      setStatus({ loading: false, error: erro.message, success: false });
    }
  };

  if (!isOpen) return null;

  const currentConfig = TIPO_CONFIG[tipoSelecionado] || TIPO_CONFIG.aula_extra;
  const modalTitle = `${initialData ? 'Editar' : 'Agendar'} ${currentConfig.label}`;
  const IconComponent = currentConfig.icon;
  
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500' }
  }[currentConfig.color];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${colorClasses.bg} rounded-lg`}>
              <IconComponent className={`w-6 h-6 ${colorClasses.text}`} />
            </div>
            <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSalvarAgendamento} className="p-6 space-y-4">
          {status.error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} /> {status.error}
            </div>
          )}
          
          {status.success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle size={18} /> Agendamento realizado com sucesso!
            </div>
          )}

          {/* Aluno */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
              <User size={14} /> Selecionar Aluno *
            </label>
            <select
              required
              value={formData.aluno_id}
              onChange={e => setFormData({...formData, aluno_id: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
              disabled={carregandoAlunos}
            >
              <option value="">{carregandoAlunos ? 'Carregando alunos...' : '-- Selecione um aluno --'}</option>
              {alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>{aluno.nome} ({aluno.instrumento})</option>
              ))}
            </select>
          </div>

          {/* Professor — pré-selecionado automaticamente pelo vínculo do aluno */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
              <GraduationCap size={14} /> Professor Responsável
            </label>
            <select
              value={formData.professor_id}
              onChange={e => setFormData({...formData, professor_id: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
            >
              <option value="">-- Sem professor vinculado --</option>
              {professores.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome}{p.instrumento_principal ? ` (${p.instrumento_principal})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                <Calendar size={14} /> Data *
              </label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={e => setFormData({...formData, data: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                <Clock size={14} /> Horário *
              </label>
              <input
                type="time"
                required
                value={formData.horario}
                onChange={e => setFormData({...formData, horario: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status.loading || status.success}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {status.loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                initialData ? 'Salvar Alterações' : 'Agendar Aula'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
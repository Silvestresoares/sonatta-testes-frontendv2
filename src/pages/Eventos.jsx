import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { Calendar, Plus, MapPin, Users, Music, Trash2, Edit, X, Check, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalParticipantesAberto, setModalParticipantesAberto] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  
  const ehProfessor = localStorage.getItem('@sonatta:tipo_usuario') === 'professor';

  // Alunos e Repertórios para seleção
  const [alunos, setAlunos] = useState([]);
  const [participantes, setParticipantes] = useState([]);

  const [formData, setFormData] = useState({
    titulo: '',
    data_evento: '',
    horario: '',
    local: '',
    descricao: '',
    capacidade_publico: '',
    status: 'Agendado'
  });
  const [participanteForm, setParticipanteForm] = useState({
    aluno_id: '',
    musica: '',
    instrumento: '',
    ordem_apresentacao: '',
    convidados_esperados: 0
  });

  useEffect(() => {
    carregarEventos();
    carregarAlunos();
  }, []);

  const carregarEventos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/eventos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar');
      const data = await response.json();
      setEventos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const carregarAlunos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alunos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar alunos');
      const data = await response.json();
      const lista = Array.isArray(data) ? data : data.data || [];
      setAlunos(lista.filter(a => a.status === 'Ativo'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSalvarEvento = async (e) => {
    e.preventDefault();
    try {
      const url = eventoSelecionado ? `${API_URL}/api/eventos/${eventoSelecionado.id}` : `${API_URL}/api/eventos`;
      const method = eventoSelecionado ? 'PUT' : 'POST';
      
      const payload = { ...formData, capacidade_publico: formData.capacidade_publico ? parseInt(formData.capacidade_publico) : null };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar');
      
      await carregarEventos();
      setModalAberto(false);
    } catch (err) {
      alert('Erro ao salvar evento: ' + err.message);
    }
  };

  const handleExcluirEvento = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      const response = await fetch(`${API_URL}/api/eventos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!response.ok) throw new Error('Erro ao excluir');
      setEventos(eventos.filter(e => e.id !== id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const abrirModalNovo = () => {
    setEventoSelecionado(null);
    setFormData({ titulo: '', data_evento: '', horario: '', local: '', descricao: '', capacidade_publico: '', status: 'Agendado' });
    setModalAberto(true);
  };

  const abrirModalEditar = (evento) => {
    setEventoSelecionado(evento);
    setFormData({
      titulo: evento.titulo,
      data_evento: evento.data_evento ? evento.data_evento.split('T')[0] : '',
      horario: evento.horario,
      local: evento.local || '',
      descricao: evento.descricao || '',
      capacidade_publico: evento.capacidade_publico || '',
      status: evento.status
    });
    setModalAberto(true);
  };

  const carregarParticipantes = async (eventoId) => {
    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}/participantes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar');
      setParticipantes(await response.json());
    } catch (err) {
      console.error(err);
    }
  };

  const abrirModalParticipantes = (evento) => {
    setEventoSelecionado(evento);
    setParticipantes([]);
    carregarParticipantes(evento.id);
    setParticipanteForm({ aluno_id: '', musica: '', instrumento: '', ordem_apresentacao: '', convidados_esperados: 0 });
    setModalParticipantesAberto(true);
  };

  const handleAdicionarParticipante = async (e) => {
    e.preventDefault();
    if (!participanteForm.aluno_id) return alert('Selecione um aluno');

    try {
      const payload = {
        aluno_id: parseInt(participanteForm.aluno_id),
        musica: participanteForm.musica,
        instrumento: participanteForm.instrumento,
        ordem_apresentacao: participanteForm.ordem_apresentacao ? parseInt(participanteForm.ordem_apresentacao) : 0,
        convidados_esperados: participanteForm.convidados_esperados ? parseInt(participanteForm.convidados_esperados) : 0
      };

      const response = await fetch(`${API_URL}/api/eventos/${eventoSelecionado.id}/participantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Erro ao adicionar');
      
      await carregarParticipantes(eventoSelecionado.id);
      setParticipanteForm({ aluno_id: '', musica: '', instrumento: '', ordem_apresentacao: '', convidados_esperados: 0 });
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  const handleRemoverParticipante = async (participanteId) => {
    if (!window.confirm('Remover aluno do evento?')) return;
    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoSelecionado.id}/participantes/${participanteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (!response.ok) throw new Error('Erro ao remover');
      setParticipantes(participantes.filter(p => p.id !== participanteId));
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  const totalConvidados = participantes.reduce((acc, curr) => acc + (curr.convidados_esperados || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music className="text-emerald-500" />
            Eventos, Audições e Recitais
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Organize apresentações e acompanhe os alunos participantes.</p>
        </div>
        {!ehProfessor && (
          <button
            onClick={abrirModalNovo}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            <Plus size={20} />
            Novo Evento
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : eventos.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <Calendar className="mx-auto text-zinc-600 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum evento agendado</h3>
          <p className="text-zinc-400 mb-6">Comece criando a primeira audição ou masterclass da sua escola.</p>
          {!ehProfessor && (
            <button
              onClick={abrirModalNovo}
              className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Criar Evento
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map(evento => {
            const isCancelado = evento.status === 'Cancelado';
            const isConcluido = evento.status === 'Concluído';
            
            return (
              <div key={evento.id} className={`bg-zinc-900 border ${isCancelado ? 'border-rose-900/50 opacity-70' : isConcluido ? 'border-emerald-900/50' : 'border-zinc-800'} rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col`}>
                <div className={`p-4 border-b ${isCancelado ? 'border-rose-900/30 bg-rose-950/20' : isConcluido ? 'border-emerald-900/30 bg-emerald-950/20' : 'border-zinc-800 bg-zinc-950/30'} flex justify-between items-start`}>
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-lg text-white leading-tight mb-1">{evento.titulo}</h3>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
                      <Calendar size={14} className={isCancelado ? 'text-rose-500' : 'text-emerald-500'} />
                      {evento.data_evento ? format(parseISO(evento.data_evento), "dd 'de' MMMM, yyyy", { locale: ptBR }) : '-'}
                      <span className="text-zinc-600">•</span>
                      {evento.horario}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    isCancelado ? 'bg-rose-500/10 text-rose-400' :
                    isConcluido ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-sky-500/10 text-sky-400'
                  }`}>
                    {evento.status}
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  {evento.local && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm mb-2">
                      <MapPin size={16} className="text-zinc-500 shrink-0" />
                      <span className="truncate">{evento.local}</span>
                    </div>
                  )}
                  {evento.descricao && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mt-2">{evento.descricao}</p>
                  )}
                  <div className="mt-auto pt-6 flex gap-2">
                    <button
                      onClick={() => abrirModalParticipantes(evento)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Users size={16} className="text-fuchsia-400" />
                      Participantes
                    </button>
                    {!ehProfessor && (
                      <button
                        onClick={() => abrirModalEditar(evento)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
                        title="Editar Evento"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE NOVO/EDITAR EVENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {eventoSelecionado ? 'Editar Evento' : 'Novo Evento'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-500 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSalvarEvento} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Título do Evento *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Audição de Inverno 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formData.data_evento}
                    onChange={e => setFormData({...formData, data_evento: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Horário *</label>
                  <input
                    type="time"
                    required
                    value={formData.horario}
                    onChange={e => setFormData({...formData, horario: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Localização</label>
                <input
                  type="text"
                  value={formData.local}
                  onChange={e => setFormData({...formData, local: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Auditório Principal, Teatro Municipal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Capacidade Público</label>
                  <input
                    type="number"
                    value={formData.capacidade_publico}
                    onChange={e => setFormData({...formData, capacidade_publico: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição / Notas</label>
                <textarea
                  value={formData.descricao}
                  onChange={e => setFormData({...formData, descricao: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 h-24 resize-none"
                  placeholder="Instruções para os alunos, detalhes de figurino..."
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                {eventoSelecionado ? (
                  <button
                    type="button"
                    onClick={() => handleExcluirEvento(eventoSelecionado.id)}
                    className="text-rose-500 hover:text-rose-400 font-medium px-4 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    Excluir Evento
                  </button>
                ) : <div/>}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PARTICIPANTES (SETLIST) */}
      {modalParticipantesAberto && eventoSelecionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-fuchsia-500" />
                  Participantes & Setlist
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Evento: <strong className="text-emerald-400">{eventoSelecionado.titulo}</strong>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4 border-r border-zinc-800 pr-4">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Convidados (Aprox.)</p>
                  <p className="text-xl font-mono text-white">{totalConvidados} {eventoSelecionado.capacidade_publico && <span className="text-sm text-zinc-500">/ {eventoSelecionado.capacidade_publico}</span>}</p>
                </div>
                <button onClick={() => setModalParticipantesAberto(false)} className="text-zinc-500 hover:text-white p-2 bg-zinc-800/50 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              {/* Lado Esquerdo: Adicionar Aluno */}
              {!ehProfessor && (
                <div className="lg:w-1/3 space-y-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sticky top-0">
                    <h3 className="font-bold text-white mb-4">Adicionar Aluno</h3>
                    <form onSubmit={handleAdicionarParticipante} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Aluno *</label>
                      <select
                        required
                        value={participanteForm.aluno_id}
                        onChange={e => setParticipanteForm({...participanteForm, aluno_id: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500 text-sm"
                      >
                        <option value="">Selecione um aluno</option>
                        {alunos.map(a => (
                          <option key={a.id} value={a.id}>{a.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Música</label>
                      <input
                        type="text"
                        value={participanteForm.musica}
                        onChange={e => setParticipanteForm({...participanteForm, musica: e.target.value})}
                        placeholder="Ex: Minueto em G Maior"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Instrumento</label>
                      <input
                        type="text"
                        value={participanteForm.instrumento}
                        onChange={e => setParticipanteForm({...participanteForm, instrumento: e.target.value})}
                        placeholder="Ex: Piano"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1" title="Quantidade de convidados esperada">Convidados</label>
                        <input
                          type="number"
                          min="0"
                          value={participanteForm.convidados_esperados}
                          onChange={e => setParticipanteForm({...participanteForm, convidados_esperados: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1" title="Ordem no programa do recital">Ordem</label>
                        <input
                          type="number"
                          min="0"
                          value={participanteForm.ordem_apresentacao}
                          onChange={e => setParticipanteForm({...participanteForm, ordem_apresentacao: e.target.value})}
                          placeholder="Nº"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm mt-2 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Incluir no Evento
                    </button>
                  </form>
                </div>
              </div>
              )}

              {/* Lado Direito: Lista (Setlist) */}
              <div className={ehProfessor ? "w-full mx-auto" : "lg:w-2/3"}>
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Music className="text-zinc-500" size={18} /> Programa do Evento
                </h3>
                
                {participantes.length === 0 ? (
                  <div className="bg-zinc-950/50 border border-zinc-800/50 border-dashed rounded-xl p-8 text-center text-zinc-500">
                    Nenhum aluno confirmado ainda. Adicione os participantes ao lado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participantes.map(p => (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors group">
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-400">
                          {p.ordem_apresentacao > 0 ? p.ordem_apresentacao : '-'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-200">{p.aluno_nome}</h4>
                          <p className="text-sm text-zinc-400 mt-0.5">
                            {p.musica ? <span className="text-fuchsia-400 font-medium">"{p.musica}"</span> : <span className="italic">Sem música definida</span>}
                            {p.instrumento && <span> • {p.instrumento}</span>}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <span className="block text-zinc-500 mb-1">Convidados</span>
                          <span className="font-mono text-zinc-300 font-bold bg-zinc-800 px-2 py-1 rounded">{p.convidados_esperados}</span>
                        </div>
                        {!ehProfessor && (
                          <button
                            onClick={() => handleRemoverParticipante(p.id)}
                            className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all ml-2"
                            title="Remover"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

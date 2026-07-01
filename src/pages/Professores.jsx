import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserPlus, Search, Filter, Download, Printer, X, ChevronDown,
         Phone, Mail, Music, Calendar, DollarSign, Users, Clock,
         CheckCircle, Edit2, Trash2, Eye, Plus, Minus, BookOpen,
         ChevronLeft, ChevronRight } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3001';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);
const canalComunicacao = new BroadcastChannel('sonatta_updates');

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const HORARIOS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});
const STATUS_CORES = {
  Ativo:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Inativo:  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Férias:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Licença:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
};
const STATUS_ICONES = { Ativo: '🟢', Inativo: '🔴', Férias: '🏖️', Licença: '🔵' };
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function Avatar({ url, nome, size = 10 }) {
  const initials = (nome || 'P').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={nome}
        className={`w-${size} h-${size} rounded-full object-cover border-2 border-zinc-700 flex-shrink-0`}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
      {initials}
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <input
        {...props}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm transition-colors"
      />
    </div>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <select
        {...props}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm transition-colors cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

function TextareaField({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <textarea
        {...props}
        rows={3}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm transition-colors resize-none"
      />
    </div>
  );
}

// ─── GRADE DE DISPONIBILIDADE ───────────────────────────────────────────────
function GradeDisponibilidade({ disponibilidade, onChange }) {
  const toggleHorario = (dia, hora) => {
    const atual = disponibilidade[dia] || [];
    const novo = atual.includes(hora) ? atual.filter(h => h !== hora) : [...atual, hora].sort();
    onChange({ ...disponibilidade, [dia]: novo });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1 text-zinc-500 text-left w-14">Hora</th>
            {DIAS_SEMANA.map(d => (
              <th key={d} className="p-1 text-zinc-400 text-center font-medium">{d.substring(0,3)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HORARIOS.map(hora => (
            <tr key={hora} className="border-t border-zinc-800/50">
              <td className="p-1 text-zinc-500">{hora}</td>
              {DIAS_SEMANA.map(dia => {
                const ativo = (disponibilidade[dia] || []).includes(hora);
                return (
                  <td key={dia} className="p-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleHorario(dia, hora)}
                      className={`w-full rounded text-center py-0.5 transition-all ${
                        ativo
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                      }`}
                    >
                      {ativo ? '✓' : '·'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ABA ALUNOS DO PROFESSOR ────────────────────────────────────────────────
function AbaAlunos({ professorId, token }) {
  const [alunos, setAlunos] = useState([]);
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/professores/${professorId}/alunos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/alunos`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (r1.ok) setAlunos(await r1.json());
      if (r2.ok) setTodosAlunos(await r2.json());
    } catch {}
    setCarregando(false);
  };

  useEffect(() => { if (professorId) carregar(); }, [professorId]);

  const vincularAluno = async () => {
    if (!alunoSelecionado) return;
    await fetch(`${API_URL}/api/professores/${professorId}/alunos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ aluno_id: Number(alunoSelecionado) }),
    });
    setAlunoSelecionado('');
    carregar();
  };

  const desvincular = async (alunoId, nome) => {
    if (!window.confirm(`Remover "${nome}" deste professor?`)) return;
    await fetch(`${API_URL}/api/professores/${professorId}/alunos/${alunoId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    carregar();
  };

  const alunosVinculadosIds = alunos.map(a => a.id);
  const alunosDisponiveis = todosAlunos.filter(a => !alunosVinculadosIds.includes(a.id));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={alunoSelecionado}
          onChange={e => setAlunoSelecionado(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="">Selecionar aluno para vincular...</option>
          {alunosDisponiveis.map(a => (
            <option key={a.id} value={a.id}>{a.nome} — {a.instrumento || 'Sem instrumento'}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={vincularAluno}
          disabled={!alunoSelecionado}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
        >
          <Plus size={14} /> Vincular
        </button>
      </div>

      {carregando ? (
        <p className="text-zinc-500 text-sm">Carregando alunos...</p>
      ) : alunos.length === 0 ? (
        <div className="text-center py-8 text-zinc-600">
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum aluno vinculado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alunos.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">{a.nome}</p>
                <p className="text-xs text-zinc-500">
                  {a.instrumento} · {a.dia_aula || '—'} {a.horario ? `às ${a.horario}` : ''} · R$ {Number(a.mensalidade || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${a.status_mensalidade === 'Pago' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>
                  {a.status_mensalidade || 'Pendente'}
                </span>
                <button
                  type="button"
                  onClick={() => desvincular(a.id, a.nome)}
                  className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-all"
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ABA AGENDA ─────────────────────────────────────────────────────────────
function AbaAgenda({ professorId, token }) {
  const hoje = new Date();
  const [agenda, setAgenda] = useState({ aulas_hoje: [], aulas_semana: [], aulas_mes: [], total_mes: 0, mes: hoje.getMonth() + 1, ano: hoje.getFullYear() });
  const [carregando, setCarregando] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1);
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear());

  const carregarAgenda = async () => {
    if (!professorId) return;
    setCarregando(true);
    try {
      const r = await fetch(`${API_URL}/api/professores/${professorId}/agenda?mes=${mesFiltro}&ano=${anoFiltro}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        if (d) setAgenda(d);
      }
    } catch {}
    setCarregando(false);
  };

  useEffect(() => {
    carregarAgenda();
  }, [professorId, mesFiltro, anoFiltro]);

  const mesAnterior = () => {
    if (mesFiltro === 1) {
      setMesFiltro(12);
      setAnoFiltro(v => v - 1);
    } else {
      setMesFiltro(v => v - 1);
    }
  };

  const mesSeguinte = () => {
    if (mesFiltro === 12) {
      setMesFiltro(1);
      setAnoFiltro(v => v + 1);
    } else {
      setMesFiltro(v => v + 1);
    }
  };

  const fmt = (d) => {
    if (!d) return '—';
    const s = typeof d === 'string' ? d.substring(0, 10) : '';
    const [ano, mes, dia] = s.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (carregando) return <p className="text-zinc-500 text-sm">Carregando agenda...</p>;

  const renderAulas = (lista, titulo) => (
    <div>
      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2">{titulo}</h4>
      {lista.length === 0 ? (
        <p className="text-zinc-600 text-sm">Nenhuma aula.</p>
      ) : (
        <div className="space-y-2">
          {lista.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-zinc-800/40 rounded-lg px-3 py-2 border border-zinc-700/30">
              <span className="text-lg">{a.status === 'realizada' ? '✅' : a.status === 'cancelada' ? '❌' : '📅'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">{a.nome_aluno}</p>
                <p className="text-xs text-zinc-500">{a.instrumento} · {fmt(a.data_aula)} às {a.horario}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
        <button type="button" onClick={mesAnterior} className="p-2 rounded-lg hover:bg-zinc-700/40 text-zinc-300 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Período</div>
          <div className="text-sm font-semibold text-white">{MESES[mesFiltro - 1]} {anoFiltro}</div>
        </div>
        <button type="button" onClick={mesSeguinte} className="p-2 rounded-lg hover:bg-zinc-700/40 text-zinc-300 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 text-center">
        <span className="text-xs text-zinc-500">Total de aulas no mês: </span>
        <span className="font-bold text-emerald-400">{agenda.total_mes}</span>
      </div>
      {renderAulas(agenda.aulas_hoje, '📍 Aulas de Hoje')}
      {renderAulas(agenda.aulas_mes || agenda.aulas_semana, '📆 Todas as Aulas do Mês')}
    </div>
  );
}

// ─── ABA FINANCEIRO ──────────────────────────────────────────────────────────
function AbaFinanceiro({ professorId, token }) {
  const hoje = new Date();
  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1);
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [expandirAlunos, setExpandirAlunos] = useState(false);
  const [pagarModal, setPagarModal] = useState(false);
  const [formPagamento, setFormPagamento] = useState({ forma_pagamento: 'Pix', valor: '', observacao: '' });
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const r = await fetch(
        `${API_URL}/api/professores/${professorId}/financeiro?mes=${mesFiltro}&ano=${anoFiltro}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.ok) setDados(await r.json());
    } catch {}
    setCarregando(false);
  };

  const registrarPagamento = async () => {
    if (!formPagamento.forma_pagamento) return alert('Forma de pagamento é obrigatória.');
    setSalvandoPagamento(true);
    try {
      const r = await fetch(
        `${API_URL}/api/professores/${professorId}/repasse/pagar`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            mes: mesFiltro,
            ano: anoFiltro,
            forma_pagamento: formPagamento.forma_pagamento,
            observacao: formPagamento.observacao,
            valor: Number(formPagamento.valor) || dados?.total_a_pagar || 0,
          }),
        }
      );
      if (r.ok) {
        setPagarModal(false);
        setFormPagamento({ forma_pagamento: 'Pix', valor: '', observacao: '' });
        await carregar();
      } else {
        const err = await r.json();
        alert(`Erro: ${err.erro || 'Erro desconhecido'}`);
      }
    } catch {
      alert('Erro de conexão com o servidor.');
    }
    setSalvandoPagamento(false);
  };

  useEffect(() => {
    if (professorId) {
      setPagarModal(false);
      carregar();
    }
  }, [professorId, mesFiltro, anoFiltro]);

  const anos = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i);
  const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Filtro de período */}
      <div className="flex gap-2">
        <select
          value={mesFiltro}
          onChange={e => setMesFiltro(Number(e.target.value))}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={anoFiltro}
          onChange={e => setAnoFiltro(Number(e.target.value))}
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {carregando ? (
        <p className="text-zinc-500 text-sm">Calculando...</p>
      ) : dados ? (
        <div className="space-y-4">

          {/* Cabeçalho: Modelo + Total a Pagar */}
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">
                Modelo: <span className="font-bold text-emerald-400 uppercase">{dados.tipo_remuneracao}</span>
              </span>
              <span className="text-xs text-zinc-500">{MESES[mesFiltro - 1]} / {anoFiltro}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <span className="text-xs text-zinc-500">Total a Pagar (Mês)</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">{fmt(dados.total_a_pagar)}</span>
            </div>
            {dados.tipo_remuneracao === 'comissao' && (
              <div className="text-[10px] text-zinc-600 text-right">
                Baseado nos pagamentos de mensalidades já realizados (status Pago).
              </div>
            )}
            {dados.tipo_remuneracao === 'horista' && (
              <div className="text-[10px] text-zinc-600 text-right">
                {dados.total_aulas} aulas válidas × {fmt(dados.valor_hora)}/aula
              </div>
            )}
            {dados.tipo_remuneracao === 'mensalista' && (
              <div className="text-[10px] text-zinc-600 text-right">
                Valor fixo mensal — independente de aulas realizadas.
              </div>
            )}

            {/* Status do repasse consolidado */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800/40">
              <span className="text-xs text-zinc-400 font-medium">Status do Repasse</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  dados.repasse_status === 'pago'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : dados.repasse_status === 'parcial'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/30'
                }`}>
                  {dados.repasse_status === 'pago' ? '✅ Pago' : dados.repasse_status === 'parcial' ? '🟠 Parcial' : '🟡 Pendente'}
                </span>
              </div>
            </div>

            {/* Detalhes do Pagamento se houver */}
            {dados.pagamento_detalhes && (
              <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-950/40 p-2 rounded border border-zinc-800/40">
                <p>📅 Pago em: <span className="font-mono text-zinc-200">{new Date(dados.pagamento_detalhes.data).toLocaleDateString('pt-BR')}</span></p>
                <p>💳 Forma: <span className="font-medium text-zinc-200">{dados.pagamento_detalhes.forma}</span></p>
                {dados.pagamento_detalhes.observacao && (
                  <p>📝 Obs: <span className="text-zinc-300 italic">{dados.pagamento_detalhes.observacao}</span></p>
                )}
              </div>
            )}

            {/* Botão / Formulário de Pagamento de Repasse */}
            {dados.repasse_status !== 'pago' && (
              <div className="mt-1">
                {!pagarModal ? (
                  <button
                    type="button"
                    onClick={() => setPagarModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
                  >
                    💰 Registrar Pagamento
                  </button>
                ) : (
                  <div className="bg-zinc-950/70 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Registrar Pagamento</p>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Forma de Pagamento</label>
                      <select
                        value={formPagamento.forma_pagamento}
                        onChange={e => setFormPagamento(f => ({ ...f, forma_pagamento: e.target.value }))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 mt-1 text-sm text-white outline-none focus:border-emerald-500"
                      >
                        <option>Pix</option>
                        <option>Dinheiro</option>
                        <option>Transferência</option>
                        <option>Boleto</option>
                        <option>Cartão</option>
                      </select>
                    </div>
                    {(dados.tipo_remuneracao === 'horista' || dados.tipo_remuneracao === 'mensalista') && (
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={String(Number(dados.total_a_pagar || 0).toFixed(2))}
                          value={formPagamento.valor}
                          onChange={e => setFormPagamento(f => ({ ...f, valor: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 mt-1 text-sm text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Observação (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: Pago via app..."
                        value={formPagamento.observacao}
                        onChange={e => setFormPagamento(f => ({ ...f, observacao: e.target.value }))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 mt-1 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPagarModal(false)}
                        className="flex-1 text-zinc-500 hover:text-white text-xs py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={registrarPagamento}
                        disabled={salvandoPagamento}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-all"
                      >
                        {salvandoPagamento ? 'Registrando...' : 'Confirmar Pagamento'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Comissão: Resumo Previsto x Recebido */}
          {dados.tipo_remuneracao === 'comissao' && (
            <div className="grid grid-cols-2 gap-3">
              {/* Previsto */}
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-700/30">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">📋 Previsto</p>
                  <p className="text-base font-bold text-zinc-100 font-mono mt-0.5">{fmt(dados.total_previsto_professor)}</p>
                  <p className="text-[10px] text-zinc-600">de {fmt(dados.total_previsto)} total</p>
                </div>
                <div className="px-3 py-1.5 flex justify-between text-[10px]">
                  <span className="text-zinc-500">Escola fica</span>
                  <span className="text-blue-400 font-mono">{fmt(dados.total_previsto_escola)}</span>
                </div>
              </div>
              {/* Recebido */}
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-700/30">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">✅ Recebido</p>
                  <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">{fmt(dados.total_recebido_professor)}</p>
                  <p className="text-[10px] text-zinc-600">de {fmt(dados.total_recebido)} pago</p>
                </div>
                <div className="px-3 py-1.5 flex justify-between text-[10px]">
                  <span className="text-zinc-500">Escola recebeu</span>
                  <span className="text-blue-400 font-mono">{fmt(dados.total_recebido_escola)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Horista: resumo de horas */}
          {dados.tipo_remuneracao === 'horista' && (
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500">Aulas válidas no período</p>
                <p className="text-2xl font-bold text-amber-400 font-mono">{dados.total_aulas}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Valor por aula</p>
                <p className="text-base font-bold text-zinc-200 font-mono">{fmt(dados.valor_hora)}</p>
              </div>
            </div>
          )}

          {/* Mensalista: card informativo */}
          {dados.tipo_remuneracao === 'mensalista' && (
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-zinc-400">👥 Alunos Vinculados</p>
                <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-400">{dados.alunos_mensalista?.length || 0}</span>
              </div>
              {dados.alunos_mensalista?.length > 0 ? (
                <div className="space-y-1">
                  {dados.alunos_mensalista.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300">{a.nome}</span>
                        {a.instrumento && <span className="text-zinc-600 text-[10px]">({a.instrumento})</span>}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                        a.status_mensalidade === 'Pago'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>{a.status_mensalidade || 'Pendente'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">Nenhum aluno vinculado.</p>
              )}
            </div>
          )}

          {/* Detalhe por aluno (Comissão e Horista) */}
          {((dados.tipo_remuneracao === 'comissao' && dados.alunos?.length > 0) || 
            (dados.tipo_remuneracao === 'horista' && dados.detalhe_horas_aluno?.length > 0)) && (
            <div>
              <button
                type="button"
                onClick={() => setExpandirAlunos(v => !v)}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <span>{expandirAlunos ? '▾' : '▸'}</span>
                {expandirAlunos ? 'Ocultar' : 'Ver'} detalhes por aluno
              </button>

              {expandirAlunos && (
                <div className="mt-2 space-y-2">
                  {/* Lista de Alunos (Comissão) */}
                  {dados.tipo_remuneracao === 'comissao' && dados.alunos?.map(a => (
                    <div key={a.id} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-200">{a.nome}</span>
                        <div className="flex items-center gap-2">
                          {a.proporcional && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                              {a.aulas_esse_mes} aula(s) — proporcional
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            a.status_repasse === 'pago'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : a.status_mensalidade === 'Pago'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700/30'
                          }`}>
                            {a.status_repasse === 'pago' ? 'Pago' : a.status_mensalidade === 'Pago' ? 'A Repassar' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-zinc-500">
                        <div>
                          <p>Valor/aula</p>
                          <p className="text-zinc-300 font-mono">{fmt(a.valor_por_aula)}</p>
                        </div>
                        <div>
                          <p>Prof ({dados.porcentagem_professor}%)</p>
                          <p className="text-emerald-400 font-mono">{fmt(a.previsto_professor)}</p>
                        </div>
                        <div>
                          <p>Escola ({dados.porcentagem_escola}%)</p>
                          <p className="text-blue-400 font-mono">{fmt(a.previsto_escola)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Lista de Alunos (Horista) */}
                  {dados.tipo_remuneracao === 'horista' && dados.detalhe_horas_aluno?.map(aluno => (
                    <div key={aluno.aluno_id || aluno.aluno_nome} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-200">{aluno.aluno_nome}</span>
                          {aluno.instrumento && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full border border-zinc-700">
                              {aluno.instrumento}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-800/50 rounded p-2">
                          <div className="text-zinc-500 mb-1">Aulas Válidas</div>
                          <div className="font-mono text-zinc-300">{aluno.quantidade_aulas}</div>
                        </div>
                        <div className="bg-zinc-800/50 rounded p-2 text-right">
                          <div className="text-zinc-500 mb-1">Subtotal</div>
                          <div className="font-mono font-bold text-amber-400">
                            {fmt(Number(aluno.quantidade_aulas) * Number(dados.valor_hora))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}

// ─── MODAL PRINCIPAL (CADASTRO / EDIÇÃO) ────────────────────────────────────
function ModalProfessor({ professor, onClose, onSalvo, token, todosAlunos }) {
  const editando = !!professor?.id;
  const [aba, setAba] = useState('pessoal');
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState('');
  const [simMensalidade, setSimMensalidade] = useState(220);
  const [simAulasProporcional, setSimAulasProporcional] = useState(2);

  const [form, setForm] = useState({
    nome: '', foto_url: '', cpf: '', rg: '', data_nascimento: '',
    telefone: '', whatsapp: '', email: '',
    endereco: '', cidade: '', estado: '', cep: '',
    instrumento_principal: '', outros_instrumentos: '',
    especialidade: '', formacao: '',
    disponibilidade: {},
    tipo_remuneracao: 'comissao',
    valor_hora: '', valor_mensal: '', porcentagem_professor: '',
    data_contratacao: '', observacoes: '',
    status: 'Ativo',
  });

  useEffect(() => {
    if (professor) {
      setForm({
        nome: professor.nome || '',
        foto_url: professor.foto_url || '',
        cpf: professor.cpf || '',
        rg: professor.rg || '',
        data_nascimento: professor.data_nascimento ? professor.data_nascimento.toString().substring(0, 10) : '',
        telefone: professor.telefone || '',
        whatsapp: professor.whatsapp || '',
        email: professor.email || '',
        endereco: professor.endereco || '',
        cidade: professor.cidade || '',
        estado: professor.estado || '',
        cep: professor.cep || '',
        instrumento_principal: professor.instrumento_principal || '',
        outros_instrumentos: professor.outros_instrumentos || '',
        especialidade: professor.especialidade || '',
        formacao: professor.formacao || '',
        disponibilidade: professor.disponibilidade
          ? (typeof professor.disponibilidade === 'string'
              ? JSON.parse(professor.disponibilidade)
              : professor.disponibilidade)
          : {},
        tipo_remuneracao: professor.tipo_remuneracao || 'comissao',
        valor_hora: professor.valor_hora !== undefined ? professor.valor_hora : '',
        valor_mensal: professor.valor_mensal !== undefined ? professor.valor_mensal : '',
        porcentagem_professor: professor.porcentagem_professor !== undefined ? professor.porcentagem_professor : '',
        data_contratacao: professor.data_contratacao ? professor.data_contratacao.toString().substring(0, 10) : '',
        observacoes: professor.observacoes || '',
        status: professor.status || 'Ativo',
      });
    }
  }, [professor]);

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  const salvar = async (e) => {
    e.preventDefault();
    setErroFormulario('');
    if (!form.nome.trim()) {
      setErroFormulario('Nome é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      const url = editando
        ? `${API_URL}/api/professores/${professor.id}`
        : `${API_URL}/api/professores`;
      const metodo = editando ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          valor_hora: Number(form.valor_hora) || 0,
          valor_mensal: Number(form.valor_mensal) || 0,
          porcentagem_professor: Number(form.porcentagem_professor) || 0,
        }),
      });
      if (r.ok) {
        canalComunicacao.postMessage('atualizar_dados');
        onSalvo();
      } else {
        const err = await r.json().catch(() => ({}));
        setErroFormulario(err.erro || 'Erro desconhecido.');
      }
    } catch (err) {
      setErroFormulario('Erro de conexão com o servidor.');
    }
    setSalvando(false);
  };

  const abas = [
    { id: 'pessoal', label: 'Dados Pessoais', icon: '👤' },
    { id: 'profissional', label: 'Profissional', icon: '🎓' },
    { id: 'disponibilidade', label: 'Disponibilidade', icon: '📅' },
    ...(editando ? [
      { id: 'alunos', label: 'Alunos', icon: '👥' },
      { id: 'agenda', label: 'Agenda', icon: '📆' },
      { id: 'financeiro', label: 'Financeiro', icon: '💰' },
    ] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar url={form.foto_url} nome={form.nome} size={10} />
            <div>
              <h2 className="text-base font-bold text-white">
                {editando ? `✏️ Editar — ${professor.nome}` : '✨ Novo Professor'}
              </h2>
              <p className="text-xs text-zinc-500">Preencha os dados do professor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 border-b border-zinc-800 overflow-x-auto flex-shrink-0">
          {abas.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all ${
                aba === a.id
                  ? 'bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={salvar} className="flex-1 overflow-y-auto">
        {erroFormulario && (
          <div className="mx-5 mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {erroFormulario}
          </div>
        )}
          <div className="p-5 space-y-4">

            {/* ABA: DADOS PESSOAIS */}
            {aba === 'pessoal' && (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <InputField label="Nome Completo *" value={form.nome} onChange={e => set('nome', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
                  <InputField label="RG" value={form.rg} onChange={e => set('rg', e.target.value)} />
                  <InputField label="Data de Nascimento" type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
                  <InputField label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  <InputField label="Telefone" placeholder="(00) 00000-0000" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
                  <InputField label="WhatsApp" placeholder="(00) 00000-0000" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <InputField label="Endereço" placeholder="Rua, número, complemento" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <InputField label="Cidade" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                  </div>
                  <InputField label="Estado" placeholder="SP" maxLength={2} value={form.estado} onChange={e => set('estado', e.target.value.toUpperCase())} />
                  <InputField label="CEP" placeholder="00000-000" value={form.cep} onChange={e => set('cep', e.target.value)} />
                </div>
              </>
            )}

            {/* ABA: PROFISSIONAL */}
            {aba === 'profissional' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Instrumento Principal" placeholder="Ex: Piano, Violão..." value={form.instrumento_principal} onChange={e => set('instrumento_principal', e.target.value)} />
                  <InputField label="Outros Instrumentos" placeholder="Ex: Teclado, Canto..." value={form.outros_instrumentos} onChange={e => set('outros_instrumentos', e.target.value)} />
                  <InputField label="Especialidade" placeholder="Ex: MPB, Clássico, Jazz..." value={form.especialidade} onChange={e => set('especialidade', e.target.value)} />
                  <InputField label="Formação" placeholder="Ex: Bacharelado em Música..." value={form.formacao} onChange={e => set('formacao', e.target.value)} />
                  <InputField label="Data de Contratação" type="date" value={form.data_contratacao} onChange={e => set('data_contratacao', e.target.value)} />
                  <SelectField label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="Ativo">🟢 Ativo</option>
                    <option value="Inativo">🔴 Inativo</option>
                    <option value="Férias">🏖️ Férias</option>
                    <option value="Licença">🔵 Licença</option>
                  </SelectField>
                  <SelectField label="Modelo de Remuneração" value={form.tipo_remuneracao} onChange={e => set('tipo_remuneracao', e.target.value)}>
                    <option value="comissao">Comissão (%)</option>
                    <option value="horista">Horista (Por Aula)</option>
                    <option value="mensalista">Mensalista (Valor Fixo)</option>
                  </SelectField>
                  {form.tipo_remuneracao === 'horista' && (
                    <InputField label="Valor por Hora (R$)" type="number" step="0.01" min="0" placeholder="0.00" value={form.valor_hora} onChange={e => set('valor_hora', e.target.value)} />
                  )}
                  {form.tipo_remuneracao === 'mensalista' && (
                    <InputField label="Valor Mensal (R$)" type="number" step="0.01" min="0" placeholder="0.00" value={form.valor_mensal} onChange={e => set('valor_mensal', e.target.value)} />
                  )}
                </div>

                {/* Bloco de repasse financeiro */}
                {form.tipo_remuneracao === 'comissao' && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">💰 Repasse Financeiro & Simulador</p>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Base: 4 Aulas/Mês</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Repasse ao Professor (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="Ex: 50"
                        value={form.porcentagem_professor}
                        onChange={e => set('porcentagem_professor', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 mt-1 outline-none focus:border-emerald-500 text-white text-sm transition-colors"
                      />
                    </div>
                    <div className="text-xs space-y-1 pb-2">
                      {Number(form.porcentagem_professor) > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-zinc-400">Professor: <span className="text-emerald-400 font-bold">{Number(form.porcentagem_professor)}%</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-zinc-400">Escola: <span className="text-blue-400 font-bold">{100 - Number(form.porcentagem_professor)}%</span></span>
                          </div>
                        </>
                      ) : (
                        <span className="text-zinc-600 italic">Defina o percentual ao lado</span>
                      )}
                    </div>
                  </div>

                  {Number(form.porcentagem_professor) > 0 && (
                    <div className="pt-3 border-t border-zinc-800 space-y-3">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Simular Split por Aluno</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Mensalidade Cheia (R$)</label>
                          <input
                            type="number"
                            min="0"
                            value={simMensalidade}
                            onChange={e => setSimMensalidade(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 mt-1 outline-none text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Aulas no mês de Entrada</label>
                          <select
                            value={simAulasProporcional}
                            onChange={e => setSimAulasProporcional(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 mt-1 outline-none text-white text-xs cursor-pointer"
                          >
                            <option value={1}>1 aula (Proporcional)</option>
                            <option value={2}>2 aulas (Proporcional)</option>
                            <option value={3}>3 aulas (Proporcional)</option>
                            <option value={4}>4 aulas (Mês Cheio)</option>
                          </select>
                        </div>
                      </div>

                      {/* Resultados da simulação */}
                      {simMensalidade > 0 && (
                        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-zinc-400 text-[10px] pb-1 border-b border-zinc-800/50">
                            <span>Valor por aula unitária:</span>
                            <span className="font-mono text-zinc-200">R$ {(simMensalidade / 4).toFixed(2)}</span>
                          </div>

                          {/* Caso 1: Mês Cheio */}
                          <div>
                            <p className="font-semibold text-zinc-300 text-[10px] mb-1">Cenário A: Mês Completo (4 aulas = R$ {Number(simMensalidade).toFixed(2)})</p>
                            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5">
                                <span className="text-zinc-500 block">Professor recebe</span>
                                <span className="font-bold text-emerald-400 font-mono">R$ {(simMensalidade * Number(form.porcentagem_professor) / 100).toFixed(2)}</span>
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1.5">
                                <span className="text-zinc-500 block">Escola fica</span>
                                <span className="font-bold text-blue-400 font-mono">R$ {(simMensalidade * (100 - Number(form.porcentagem_professor)) / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Caso 2: Proporcional Escolhido */}
                          <div>
                            <p className="font-semibold text-zinc-300 text-[10px] mb-1">
                              Cenário B: Mês de Entrada Proporcional ({simAulasProporcional} aula{simAulasProporcional !== 1 ? 's' : ''} = R$ {((simMensalidade / 4) * simAulasProporcional).toFixed(2)})
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded p-1.5">
                                <span className="text-zinc-500 block">Professor recebe</span>
                                <span className="font-bold text-emerald-400 font-mono">R$ {(((simMensalidade / 4) * simAulasProporcional) * Number(form.porcentagem_professor) / 100).toFixed(2)}</span>
                              </div>
                              <div className="bg-blue-500/15 border border-blue-500/30 rounded p-1.5">
                                <span className="text-zinc-500 block">Escola fica</span>
                                <span className="font-bold text-blue-400 font-mono">R$ {(((simMensalidade / 4) * simAulasProporcional) * (100 - Number(form.porcentagem_professor)) / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}

                <TextareaField label="Observações" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Anotações internas sobre o professor..." />
              </>
            )}

            {/* ABA: DISPONIBILIDADE */}
            {aba === 'disponibilidade' && (
              <div>
                <p className="text-xs text-zinc-500 mb-3">Clique nos horários para marcar a disponibilidade do professor.</p>
                <GradeDisponibilidade
                  disponibilidade={form.disponibilidade}
                  onChange={d => set('disponibilidade', d)}
                />
              </div>
            )}

            {/* ABA: ALUNOS (apenas edição) */}
            {aba === 'alunos' && editando && (
              <AbaAlunos professorId={professor.id} token={token} />
            )}

            {/* ABA: AGENDA (apenas edição) */}
            {aba === 'agenda' && editando && (
              <AbaAgenda professorId={professor.id} token={token} />
            )}

            {/* ABA: FINANCEIRO (apenas edição) */}
            {aba === 'financeiro' && editando && (
              <AbaFinanceiro professorId={professor.id} token={token} />
            )}
          </div>

          {/* Footer com botões */}
          {['pessoal', 'profissional', 'disponibilidade'].includes(aba) && (
            <div className="p-5 border-t border-zinc-800 flex justify-between items-center flex-shrink-0">
              <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white px-4 py-2 text-sm transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg transition-all text-sm"
              >
                {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Professor'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── MODAL DE VISUALIZAÇÃO / FICHA ──────────────────────────────────────────
function ModalVisualizacao({ professor, onClose, onEditar }) {
  const disp = useMemo(() => {
    if (!professor.disponibilidade) return {};
    return typeof professor.disponibilidade === 'string'
      ? JSON.parse(professor.disponibilidade)
      : professor.disponibilidade;
  }, [professor]);

  const fmt = (d) => {
    if (!d) return '—';
    const s = typeof d === 'string' ? d.substring(0, 10) : '';
    const [ano, mes, dia] = s.split('-');
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : '—';
  };

  const imprimir = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div id="ficha-professor" className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar url={professor.foto_url} nome={professor.nome} size={12} />
            <div>
              <h2 className="text-lg font-bold text-white">{professor.nome}</h2>
              <p className="text-sm text-emerald-400">{professor.instrumento_principal || 'Instrumento não informado'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={imprimir} className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-all" title="Imprimir ficha">
              <Printer size={16} />
            </button>
            <button onClick={onEditar} className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/10 transition-all" title="Editar">
              <Edit2 size={16} />
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_CORES[professor.status] || STATUS_CORES.Ativo}`}>
              {STATUS_ICONES[professor.status]} {professor.status}
            </span>
            <span className="text-xs text-zinc-500">· {professor.quantidade_alunos || 0} aluno(s)</span>
          </div>

          {/* Dados Pessoais */}
          <section>
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Dados Pessoais</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['CPF', professor.cpf], ['RG', professor.rg],
                ['Nascimento', fmt(professor.data_nascimento)],
                ['Contratação', fmt(professor.data_contratacao)],
                ['Telefone', professor.telefone], ['WhatsApp', professor.whatsapp],
                ['E-mail', professor.email], ['Cidade/Estado', `${professor.cidade || ''} ${professor.estado ? `- ${professor.estado}` : ''}`.trim()],
              ].map(([k, v]) => v ? (
                <div key={k}>
                  <p className="text-zinc-500 text-xs">{k}</p>
                  <p className="text-zinc-200">{v}</p>
                </div>
              ) : null)}
            </div>
          </section>

          {/* Profissional */}
          <section>
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Dados Profissionais</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Instrumento Principal', professor.instrumento_principal],
                ['Outros Instrumentos', professor.outros_instrumentos],
                ['Especialidade', professor.especialidade],
                ['Formação', professor.formacao],
                ['Valor por Hora', professor.valor_hora ? `R$ ${Number(professor.valor_hora).toFixed(2)}` : null],
                ['Valor Mensal', professor.valor_mensal ? `R$ ${Number(professor.valor_mensal).toFixed(2)}` : null],
              ].map(([k, v]) => v ? (
                <div key={k}>
                  <p className="text-zinc-500 text-xs">{k}</p>
                  <p className="text-zinc-200">{v}</p>
                </div>
              ) : null)}
            </div>
          </section>

          {/* Disponibilidade */}
          {Object.keys(disp).some(d => disp[d]?.length > 0) && (
            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Disponibilidade Semanal</h3>
              <div className="grid grid-cols-2 gap-2">
                {DIAS_SEMANA.filter(d => disp[d]?.length > 0).map(dia => (
                  <div key={dia} className="bg-zinc-800/40 rounded-lg p-2 border border-zinc-700/30">
                    <p className="text-xs font-medium text-emerald-400 mb-1">{dia}</p>
                    <p className="text-xs text-zinc-400">{disp[dia].join(', ')}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {professor.observacoes && (
            <section>
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-2">Observações</h3>
              <p className="text-sm text-zinc-400 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">{professor.observacoes}</p>
            </section>
          )}
        </div>
      </div>

      {/* Estilos de Impressão */}
      <style>{`
        @media print {
          body > *:not(#ficha-professor) { display: none !important; }
          #ficha-professor {
            position: fixed; inset: 0; max-height: none;
            background: white !important; color: black !important;
            border: none !important; border-radius: 0 !important;
          }
          #ficha-professor * { color: black !important; background: white !important; border-color: #ccc !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState('nome');
  const [modalAberto, setModalAberto] = useState(false);
  const [profSelecionado, setProfSelecionado] = useState(null);
  const [modalVisualizacao, setModalVisualizacao] = useState(false);

  const token = localStorage.getItem('@sonatta:token');

  const carregar = async () => {
    setCarregando(true);
    try {
      const r = await fetch(`${API_URL}/api/professores`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setProfessores(await r.json());
    } catch {}
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
    const ouvir = (e) => { if (e.data === 'atualizar_dados') carregar(); };
    canalComunicacao.addEventListener('message', ouvir);
    return () => canalComunicacao.removeEventListener('message', ouvir);
  }, []);

  const excluir = async (prof) => {
    if (!window.confirm(`Tem certeza que deseja excluir o professor "${prof.nome}"?`)) return;

    try {
      const r = await fetch(`${API_URL}/api/professores/${prof.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(data.erro || 'Não foi possível excluir o professor.');
        return;
      }
      carregar();
      canalComunicacao.postMessage('atualizar_dados');
      alert('Professor excluído com sucesso.');
    } catch {
      alert('Erro de conexão ao excluir o professor.');
    }
  };

  const abrirNovo = () => { setProfSelecionado(null); setModalAberto(true); };
  const abrirEdicao = (p) => { setProfSelecionado(p); setModalAberto(true); setModalVisualizacao(false); };
  const abrirVisualizacao = (p) => { setProfSelecionado(p); setModalVisualizacao(true); };

  const profFiltrados = useMemo(() => {
    let lista = professores.filter(p => {
      const buscaOk = !busca || p.nome?.toLowerCase().includes(busca.toLowerCase())
        || p.instrumento_principal?.toLowerCase().includes(busca.toLowerCase())
        || p.telefone?.includes(busca)
        || p.email?.toLowerCase().includes(busca.toLowerCase());
      const statusOk = filtroStatus === 'Todos' || p.status === filtroStatus;
      return buscaOk && statusOk;
    });

    lista.sort((a, b) => {
      if (ordenacao === 'nome') return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
      if (ordenacao === 'instrumento') return (a.instrumento_principal || '').localeCompare(b.instrumento_principal || '', 'pt-BR');
      if (ordenacao === 'alunos') return (Number(b.quantidade_alunos) || 0) - (Number(a.quantidade_alunos) || 0);
      if (ordenacao === 'receita') return (Number(b.valor_mensal) || 0) - (Number(a.valor_mensal) || 0);
      return 0;
    });
    return lista;
  }, [professores, busca, filtroStatus, ordenacao]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: professores.length,
    ativos: professores.filter(p => p.status === 'Ativo').length,
    ferias: professores.filter(p => p.status === 'Férias').length,
    licenca: professores.filter(p => p.status === 'Licença').length,
    totalAlunos: professores.reduce((acc, p) => acc + (Number(p.quantidade_alunos) || 0), 0),
  }), [professores]);

  // Exportação CSV
  const exportarCSV = () => {
    const cabecalho = ['Nome', 'Instrumento', 'Telefone', 'Email', 'Status', 'Alunos', 'Valor/Hora', 'Valor Mensal'];
    const linhas = profFiltrados.map(p => [
      p.nome, p.instrumento_principal, p.telefone, p.email, p.status,
      p.quantidade_alunos || 0, p.valor_hora || 0, p.valor_mensal || 0
    ]);
    const csv = [cabecalho, ...linhas].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'professores.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-950 text-white overflow-y-auto min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Professores</h1>
          <p className="text-sm text-zinc-500 mt-1">Cadastre, gerencie e acompanhe o quadro de professores.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-sm"
            title="Exportar CSV"
          >
            <Download size={15} /> CSV
          </button>
          <button
            onClick={abrirNovo}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            <UserPlus size={16} /> Novo Professor
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', valor: stats.total, cor: 'text-zinc-100', icon: '👨🏫' },
          { label: 'Ativos', valor: stats.ativos, cor: 'text-emerald-400', icon: '🟢' },
          { label: 'Férias', valor: stats.ferias, cor: 'text-amber-400', icon: '🏖️' },
          { label: 'Total de Alunos', valor: stats.totalAlunos, cor: 'text-blue-400', icon: '👥' },
        ].map(({ label, valor, cor, icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{icon}</span>
              <span className="text-xs font-semibold text-zinc-500 uppercase">{label}</span>
            </div>
            <span className={`text-3xl font-bold ${cor}`}>{valor}</span>
          </div>
        ))}
      </div>

      {/* Filtros e busca */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, instrumento, telefone ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Todos', 'Ativo', 'Inativo', 'Férias', 'Licença'].map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filtroStatus === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
          <select
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="nome">Ordenar: Nome</option>
            <option value="instrumento">Ordenar: Instrumento</option>
            <option value="alunos">Ordenar: Mais alunos</option>
            <option value="receita">Ordenar: Maior receita</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-900/50 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="p-4">Professor</th>
                <th className="p-4">Instrumento</th>
                <th className="p-4">Contato</th>
                <th className="p-4 text-center">Alunos</th>
                <th className="p-4">Valor/Hora</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {carregando ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Carregando professores...</td></tr>
              ) : profFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-zinc-600">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">👨🏫</span>
                      <p className="text-sm">Nenhum professor encontrado.</p>
                      <button onClick={abrirNovo} className="text-emerald-400 text-xs hover:underline mt-1">Cadastrar o primeiro professor</button>
                    </div>
                  </td>
                </tr>
              ) : profFiltrados.map(prof => (
                <tr key={prof.id} className="hover:bg-zinc-800/40 transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar url={prof.foto_url} nome={prof.nome} size={9} />
                      <span className="font-medium text-zinc-200">{prof.nome}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400">{prof.instrumento_principal || '—'}</td>
                  <td className="p-4">
                    <div className="text-xs space-y-0.5">
                      {prof.telefone && <p className="text-zinc-400">📞 {prof.telefone}</p>}
                      {prof.email && <p className="text-zinc-500 truncate max-w-[160px]">✉ {prof.email}</p>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                      {prof.quantidade_alunos || 0}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300 text-sm">
                    {prof.valor_hora ? `R$ ${Number(prof.valor_hora).toFixed(2)}` : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CORES[prof.status] || STATUS_CORES.Ativo}`}>
                      {STATUS_ICONES[prof.status]} {prof.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => abrirVisualizacao(prof)}
                        className="text-emerald-400 hover:text-emerald-300 p-2 rounded transition-all cursor-pointer hover:bg-emerald-500/10"
                        title="Visualizar ficha"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => abrirEdicao(prof)}
                        className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => excluir(prof)}
                        className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {modalAberto && (
        <ModalProfessor
          professor={profSelecionado}
          token={token}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar(); }}
        />
      )}
      {modalVisualizacao && profSelecionado && (
        <ModalVisualizacao
          professor={profSelecionado}
          token={token}
          onClose={() => setModalVisualizacao(false)}
          onEditar={() => abrirEdicao(profSelecionado)}
        />
      )}
    </div>
  );
}

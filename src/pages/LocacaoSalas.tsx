import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Phone, MapPin, Search, Edit2, Trash2, CheckCircle2, XCircle, DollarSign, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../utils/api';

export default function LocacaoSalas() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('@sonatta:token');

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');

  const [formData, setFormData] = useState({
    sala_id: '',
    cliente_nome: '',
    cliente_telefone: '',
    data_locacao: '',
    hora_inicio: '',
    hora_fim: '',
    valor_total: '',
    status_pagamento: 'pendente',
    observacoes: ''
  });

  const { data: locacoes = [], isLoading } = useQuery({
    queryKey: ['locacoesSalas'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/locacoes`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar locações');
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 10000
  });

  const { data: salas = [] } = useQuery({
    queryKey: ['salas'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/salas`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar salas');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.dados || []);
    },
    enabled: !!token
  });

  const mutacaoSalvar = useMutation({
    mutationFn: async (dados: typeof formData) => {
      const url = idSendoEditado ? `${API_URL}/api/locacoes/${idSendoEditado}` : `${API_URL}/api/locacoes`;
      const metodo = idSendoEditado ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      return res.json();
    },
    onSuccess: () => {
      setSucesso('Locação salva com sucesso!');
      limparEdicao();
      queryClient.invalidateQueries({ queryKey: ['locacoesSalas'] });
    },
    onError: () => setErro('Erro ao salvar locação.')
  });

  const mutacaoExcluir = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/locacoes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao excluir');
    },
    onSuccess: () => {
      setSucesso('Locação excluída!');
      queryClient.invalidateQueries({ queryKey: ['locacoesSalas'] });
    },
    onError: () => setErro('Erro ao excluir locação.')
  });

  const mutacaoPagamento = useMutation({
    mutationFn: async ({ id, status_pagamento }: { id: number, status_pagamento: string }) => {
      const res = await fetch(`${API_URL}/api/locacoes/${id}/pagamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status_pagamento })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locacoesSalas'] }),
    onError: () => setErro('Erro ao atualizar status de pagamento.')
  });

  useEffect(() => {
    if (erro || sucesso) {
      const timer = setTimeout(() => {
        setErro('');
        setSucesso('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [erro, sucesso]);

  const handleMudanca = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'cliente_telefone') {
      value = value.replace(/\D/g, '');
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
      value = value.slice(0, 15);
    }
    setFormData({ ...formData, [name]: value } as typeof formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutacaoSalvar.mutate(formData);
  };

  const handleEditar = (loc: any) => {
    setIdSendoEditado(loc.id);
    setFormData({
      sala_id: loc.sala_id,
      cliente_nome: loc.cliente_nome,
      cliente_telefone: loc.cliente_telefone,
      data_locacao: loc.data_locacao ? loc.data_locacao.split('T')[0] : '',
      hora_inicio: loc.hora_inicio ? loc.hora_inicio.substring(0, 5) : '',
      hora_fim: loc.hora_fim ? loc.hora_fim.substring(0, 5) : '',
      valor_total: loc.valor_total,
      status_pagamento: loc.status_pagamento,
      observacoes: loc.observacoes || ''
    });
    setMostrandoFormulario(true);
  };

  const limparEdicao = () => {
    setIdSendoEditado(null);
    setFormData({ sala_id: '', cliente_nome: '', cliente_telefone: '', data_locacao: '', hora_inicio: '', hora_fim: '', valor_total: '', status_pagamento: 'pendente', observacoes: '' });
    setMostrandoFormulario(false);
  };

  const formatarData = (data: string) => {
    if (!data) return '';
    const d = new Date(data + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number | string) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const locacoesFiltradas = locacoes.filter((l: any) => {
    const termo = busca.toLowerCase();
    return termo === '' || 
           (l.cliente_nome || '').toLowerCase().includes(termo) || 
           (l.sala_nome || '').toLowerCase().includes(termo);
  });

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white flex flex-col">
      <div className="bg-white dark:bg-gradient-to-r dark:from-zinc-900 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-800 p-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">🏢 Locação de Salas</h1>
            <p className="text-zinc-400">Gerencie aluguéis de salas e ensaios</p>
          </div>
          <button onClick={() => setMostrandoFormulario(!mostrandoFormulario)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
            <Plus size={20} /> Nova Locação
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou sala..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {(erro || sucesso) && (
        <div className="px-6 pt-4 flex-shrink-0">
          {erro && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-center gap-2"><XCircle size={18} /> {erro}</div>}
          {sucesso && <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2"><CheckCircle2 size={18} /> {sucesso}</div>}
        </div>
      )}

      {mostrandoFormulario && (
        <div className="mx-6 mt-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            {idSendoEditado ? <Edit2 size={24} /> : <Plus size={24} />} 
            {idSendoEditado ? 'Editar Locação' : 'Nova Locação'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><User size={16} /> Nome do Cliente *</label>
                <input type="text" name="cliente_nome" value={formData.cliente_nome} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Phone size={16} /> Telefone *</label>
                <input type="tel" name="cliente_telefone" value={formData.cliente_telefone} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><MapPin size={16} /> Sala *</label>
                <select name="sala_id" value={formData.sala_id} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none">
                  <option value="">Selecione...</option>
                  {salas.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Calendar size={16} /> Data *</label>
                <input type="date" name="data_locacao" value={formData.data_locacao} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Clock size={16} /> Início *</label>
                <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Clock size={16} /> Fim *</label>
                <input type="time" name="hora_fim" value={formData.hora_fim} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><DollarSign size={16} /> Valor Total (R$) *</label>
                <input type="number" step="0.01" name="valor_total" value={formData.valor_total} onChange={handleMudanca} required className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><CheckCircle2 size={16} /> Status do Pagamento</label>
                <select name="status_pagamento" value={formData.status_pagamento} onChange={handleMudanca} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={limparEdicao} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-lg">Cancelar</button>
              <button type="submit" disabled={mutacaoSalvar.isPending} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">{idSendoEditado ? 'Salvar Edição' : 'Criar Locação'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="text-zinc-500">Carregando locações...</div>
        ) : locacoesFiltradas.length === 0 ? (
          <div className="text-center p-8 text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">Nenhuma locação encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {locacoesFiltradas.map((loc: any) => (
              <div key={loc.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:border-emerald-500/50 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">{loc.cliente_nome}</h3>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      {formatarMoeda(loc.valor_total)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(loc)} className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors bg-zinc-100 dark:bg-zinc-800 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => { if(window.confirm('Tem certeza?')) mutacaoExcluir.mutate(loc.id) }} className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors bg-zinc-100 dark:bg-zinc-800 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPin size={14} className="text-zinc-400" /> {loc.sala_nome}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Calendar size={14} className="text-zinc-400" /> {formatarData(loc.data_locacao)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Clock size={14} className="text-zinc-400" /> {loc.hora_inicio.substring(0,5)} às {loc.hora_fim.substring(0,5)}
                  </div>
                  {loc.cliente_telefone && (
                    <a href={`https://wa.me/55${loc.cliente_telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${loc.cliente_nome.split(' ')[0]}, tudo bem? Referente à locação da sala...`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline w-fit">
                      <MessageCircle size={14} /> {loc.cliente_telefone}
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Status</span>
                  <select
                    value={loc.status_pagamento}
                    onChange={(e) => mutacaoPagamento.mutate({ id: loc.id, status_pagamento: e.target.value })}
                    className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer border ${loc.status_pagamento === 'pago' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : loc.status_pagamento === 'cancelado' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}
                  >
                    <option value="pendente">PENDENTE</option>
                    <option value="pago">PAGO</option>
                    <option value="cancelado">CANCELADO</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

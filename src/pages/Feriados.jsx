import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function Feriados() {
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ data_feriado: '', descricao: '' });
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarFeriados();
  }, []);

  const carregarFeriados = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feriados`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar');
      const data = await response.json();
      setFeriados(data);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar feriados.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeriado = async (e) => {
    e.preventDefault();
    setErro('');
    if (!formData.data_feriado || !formData.descricao) {
      setErro('Preencha a data e a descrição.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/feriados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao salvar');

      setFeriados([...feriados, data].sort((a, b) => new Date(a.data_feriado) - new Date(b.data_feriado)));
      setFormData({ data_feriado: '', descricao: '' });
    } catch (err) {
      setErro(err.message || 'Erro ao salvar feriado.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este feriado?')) return;
    try {
      const response = await fetch(`${API_URL}/api/feriados/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao remover');

      setFeriados(feriados.filter(f => f.id !== id));
    } catch {
      setErro('Erro ao remover feriado.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <Calendar className="mr-3 text-brand-primary" size={28} />
          Feriados e Recessos
        </h1>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Cadastre aqui os dias em que a escola não funcionará. 
              O sistema irá alertar caso você tente marcar aulas para essas datas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <Plus size={20} className="mr-2 text-brand-primary" />
            Novo Feriado
          </h2>
          
          {erro && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {erro}
            </div>
          )}

          <form onSubmit={handleAddFeriado} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <input
                type="date"
                required
                className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.data_feriado}
                onChange={e => setFormData({...formData, data_feriado: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Natal"
                className="w-full border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors font-medium"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Feriados Cadastrados</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Carregando...</div>
          ) : feriados.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Nenhum feriado cadastrado.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {feriados.map(feriado => (
                <div key={feriado.id} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex justify-between items-center transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{feriado.descricao}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(feriado.data_feriado), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(feriado.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover feriado"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

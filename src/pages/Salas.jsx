import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { MapPin, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function Salas() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nome: '', capacidade: 1, recursos: '' });
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarSalas();
  }, []);

  const carregarSalas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/salas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar');
      const data = await response.json();
      setSalas(data);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar salas.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSala = async (e) => {
    e.preventDefault();
    setErro('');
    if (!formData.nome) {
      setErro('Preencha o nome da sala.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/salas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify({
          ...formData,
          capacidade: Number(formData.capacidade)
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Erro ao salvar');

      setSalas([...salas, { ...formData, id: data.id, capacidade: Number(formData.capacidade) }]);
      setFormData({ nome: '', capacidade: 1, recursos: '' });
    } catch (err) {
      setErro(err.message || 'Erro ao salvar sala.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta sala? (As aulas agendadas nela não serão deletadas, apenas perderão o vínculo físico)')) return;
    try {
      const response = await fetch(`${API_URL}/api/salas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao remover');

      setSalas(salas.filter(s => s.id !== id));
    } catch {
      setErro('Erro ao remover sala.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <MapPin className="mr-3 text-brand-primary" size={28} />
          Salas Físicas
        </h1>
      </div>

      <div className="bg-zinc-900 border-l-4 border-emerald-500 p-4 mb-6 rounded shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-zinc-300">
              Cadastre aqui as salas físicas da sua escola. 
              Ao agendar uma aula, o sistema alertará caso você tente agendar duas turmas na mesma sala no mesmo horário.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário de Nova Sala */}
        <div className="md:col-span-1">
          <div className="bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 text-white">Nova Sala</h2>
            
            {erro && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
                {erro}
              </div>
            )}

            <form onSubmit={handleAddSala} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nome / Identificação</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sala 01 - Piano"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Capacidade (Alunos)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.capacidade}
                  onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Recursos (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Ar condicionado, Bateria, Amplificador"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.recursos}
                  onChange={(e) => setFormData({...formData, recursos: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Adicionar Sala
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Salas */}
        <div className="md:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-sm overflow-hidden border border-zinc-800">
            {loading ? (
              <div className="p-8 text-center text-zinc-400">Carregando salas...</div>
            ) : salas.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">Nenhuma sala cadastrada.</div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Sala</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Capacidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Recursos</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {salas.map((sala) => (
                    <tr key={sala.id} className="hover:bg-zinc-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {sala.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                        {sala.capacidade} aluno(s)
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        {sala.recursos || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(sala.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

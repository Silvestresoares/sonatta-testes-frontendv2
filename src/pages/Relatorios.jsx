import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { AlertTriangle, TrendingDown, Users } from 'lucide-react';

export default function Relatorios() {
  const [riscoEvasao, setRiscoEvasao] = useState([]);
  const [inadimplencia, setInadimplencia] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` };
      
      const [resEvasao, resInad] = await Promise.all([
        fetch(`${API_URL}/api/relatorios/risco-evasao`, { headers }),
        fetch(`${API_URL}/api/relatorios/inadimplencia`, { headers })
      ]);

      if (resEvasao.ok) setRiscoEvasao(await resEvasao.json());
      if (resInad.ok) setInadimplencia(await resInad.json());
    } catch (err) {
      console.error('Erro ao carregar relatórios', err);
    } finally {
      setCarregando(false);
    }
  };

  const enviarWhatsApp = (telefone, nome) => {
    if (!telefone) return;
    const tel = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá, falando da escola de música. Percebemos que o(a) ${nome} tem faltado recentemente. Está tudo bem? Podemos ajudar com reposições?`);
    window.open(`https://wa.me/55${tel}?text=${mensagem}`, '_blank');
  };

  if (carregando) {
    return <div className="p-6 text-center text-gray-500">Carregando relatórios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingDown className="text-brand-primary" size={32} />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inteligência & Relatórios</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bloco 1: Alunos em Risco de Evasão */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden h-fit">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-4 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
            <AlertTriangle className="text-rose-500" size={24} />
            <div>
              <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400">Risco de Evasão (Churn)</h2>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">Alunos com faltas consecutivas ou sem aulas agendadas</p>
            </div>
          </div>
          
          <div className="p-4">
            {riscoEvasao.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-300 dark:text-zinc-700 mb-2" size={40} />
                <p className="text-gray-500 dark:text-gray-400">Excelente! Nenhum aluno em risco detectado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {riscoEvasao.map((aluno, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{aluno.nome}</p>
                      <p className="text-sm text-rose-500 font-medium mt-1">{aluno.motivo}</p>
                    </div>
                    {aluno.telefone && (
                      <button 
                        onClick={() => enviarWhatsApp(aluno.telefone, aluno.nome)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Chamar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bloco 2: Inadimplência e Projeção Financeira */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Projeção Financeira & Inadimplência</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhamento dos últimos 6 meses</p>
          </div>
          
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inadimplencia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInadimplente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  formatter={(value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" name="Recebido" dataKey="total_pago" stroke="#10b981" fillOpacity={1} fill="url(#colorPago)" strokeWidth={2} />
                <Area type="monotone" name="Inadimplente" dataKey="total_inadimplente" stroke="#f43f5e" fillOpacity={1} fill="url(#colorInadimplente)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

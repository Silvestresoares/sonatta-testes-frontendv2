import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, FileText, ExternalLink, Calendar, DollarSign } from 'lucide-react';

export default function MinhaAssinatura() {
  const [assinaturaData, setAssinaturaData] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const _envApi = import.meta.env.VITE_API_URL;
  const _defaultLocal = 'http://localhost:3005';
  const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('@sonatta:token');
      
      // Carregar os dados da escola (para pegar informações do plano)
      const resEscola = await fetch(`${API_URL}/api/escola`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataEscola = await resEscola.json();
      
      if (resEscola.ok) {
        setAssinaturaData({
          plano: dataEscola.plano,
          valorPorAluno: dataEscola.valor_por_aluno,
          vencimento: dataEscola.data_vencimento_assinatura,
          ativa: dataEscola.ativa
        });
      }

      // Carregar o histórico de faturas
      const resFaturas = await fetch(`${API_URL}/api/escola/faturas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataFaturas = await resFaturas.json();
      
      if (resFaturas.ok) {
        setFaturas(dataFaturas);
      } else {
        setErro(dataFaturas.erro || 'Erro ao carregar faturas.');
      }
    } catch (e) { // eslint-disable-line no-unused-vars
      setErro('Erro de conexão ao carregar dados da assinatura.');
    } finally {
      setLoading(false);
    }
  };

  const statusCor = (status) => {
    switch (status) {
      case 'Pago': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pendente': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Atrasado': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <CreditCard className="text-emerald-500" />
          Minha Assinatura
        </h1>
        <p className="text-zinc-400">
          Gerencie seu plano atual e visualize o histórico de cobranças da sua escola.
        </p>
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {erro}
        </div>
      )}

      {/* Cartões de Resumo */}
      {assinaturaData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h3 className="font-medium">Plano Atual</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{assinaturaData.plano || 'Padrão'}</p>
            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${assinaturaData.ativa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {assinaturaData.ativa ? 'Conta Ativa' : 'Conta Suspensa'}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <DollarSign size={20} className="text-blue-500" />
              <h3 className="font-medium">Valor por Aluno</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              R$ {Number(assinaturaData.valorPorAluno || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-zinc-500">Cobrado mensalmente por aluno ativo</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Calendar size={20} className="text-orange-500" />
              <h3 className="font-medium">Próximo Vencimento</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {assinaturaData.vencimento ? new Date(assinaturaData.vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não definido'}
            </p>
            <p className="text-sm text-zinc-500">Data de expiração da assinatura</p>
          </div>
        </div>
      )}

      {/* Histórico de Faturas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-8">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={20} className="text-emerald-500" />
            Histórico de Faturas
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50">
                <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Vencimento</th>
                <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Valor</th>
                <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {faturas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-zinc-500">
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              ) : (
                faturas.map((fatura) => (
                  <tr key={fatura.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-zinc-300">
                      {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="p-4 font-medium text-white">
                      R$ {Number(fatura.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusCor(fatura.status)}`}>
                        {fatura.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {fatura.asaas_invoice_url ? (
                        <a 
                          href={fatura.asaas_invoice_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                            fatura.status === 'Pendente' || fatura.status === 'Atrasado' 
                              ? 'text-emerald-400 hover:text-emerald-300' 
                              : 'text-zinc-400 hover:text-zinc-300'
                          }`}
                        >
                          {fatura.status === 'Pendente' || fatura.status === 'Atrasado' ? 'Pagar agora' : 'Ver Fatura'}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-sm">Sem link</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

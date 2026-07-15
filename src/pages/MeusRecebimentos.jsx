import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Clock as ClockIcon } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function MeusRecebimentos({ professorId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  const token = localStorage.getItem('@sonatta:token');

  const carregarFinanceiro = async () => {
    if (!professorId) return;
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch(`${API_URL}/api/professores/${professorId}/financeiro?mes=${mesAtual}&ano=${anoAtual}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resposta.ok) throw new Error('Erro ao carregar recebimentos');
      const json = await resposta.json();
      setDados(json);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarFinanceiro();
  }, [professorId, mesAtual, anoAtual]);

  const mesAnterior = () => {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual(a => a - 1);
    } else {
      setMesAtual(m => m - 1);
    }
  };

  const mesSeguinte = () => {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual(a => a + 1);
    } else {
      setMesAtual(m => m + 1);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
  };

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400 text-sm">Carregando recebimentos...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ {erro}</p>
          <button onClick={carregarFinanceiro} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm text-white transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const tipoLabel = {
    'comissao': 'Comissão',
    'horista': 'Horista',
    'mensalista': 'Mensalista'
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 Meus Recebimentos</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Tipo de remuneração: <span className="text-emerald-400 font-medium">{tipoLabel[dados?.tipo_remuneracao] || dados?.tipo_remuneracao}</span>
          </p>
        </div>
        <button onClick={carregarFinanceiro} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Navegador de mês */}
      <div className="flex items-center justify-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <button onClick={mesAnterior} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-bold text-lg min-w-[200px] text-center">
          {MESES[mesAtual - 1]} {anoAtual}
        </span>
        <button onClick={mesSeguinte} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Total a Receber</p>
          <p className="text-2xl font-bold text-emerald-400">{formatarMoeda(dados?.total_a_pagar)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Alunos Vinculados</p>
          <p className="text-2xl font-bold text-blue-400">{dados?.total_alunos || 0}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status do Repasse</p>
          <div className="flex items-center gap-2 mt-1">
            {dados?.repasse_status === 'pago' ? (
              <>
                <CheckCircle size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold text-lg">Pago</span>
              </>
            ) : dados?.repasse_status === 'parcial' ? (
              <>
                <ClockIcon size={20} className="text-amber-400" />
                <span className="text-amber-400 font-bold text-lg">Parcial</span>
              </>
            ) : (
              <>
                <ClockIcon size={20} className="text-zinc-400" />
                <span className="text-zinc-400 font-bold text-lg">Pendente</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detalhes de pagamento se já foi pago */}
      {dados?.pagamento_detalhes && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <h3 className="text-sm font-bold text-emerald-400 mb-2">✅ Detalhes do Pagamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Data:</span>
              <span className="text-white ml-2">{dados.pagamento_detalhes.data || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Forma:</span>
              <span className="text-white ml-2">{dados.pagamento_detalhes.forma || '-'}</span>
            </div>
            {dados.pagamento_detalhes.observacao && (
              <div>
                <span className="text-zinc-500">Obs:</span>
                <span className="text-white ml-2">{dados.pagamento_detalhes.observacao}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info específica para Horista */}
      {dados?.tipo_remuneracao === 'horista' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-400" />
            Detalhamento por Hora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-zinc-950 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Valor/Hora</p>
              <p className="text-lg font-bold text-white">{formatarMoeda(dados.valor_hora)}</p>
            </div>
            <div className="bg-zinc-950 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Aulas Dadas</p>
              <p className="text-lg font-bold text-white">{dados.total_aulas}</p>
            </div>
            <div className="bg-zinc-950 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Total por Hora</p>
              <p className="text-lg font-bold text-emerald-400">{formatarMoeda(dados.total_por_hora)}</p>
            </div>
          </div>

          {dados?.detalhe_horas_aluno?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 mt-4">Aulas por Aluno</h3>
              {dados.detalhe_horas_aluno.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm font-medium">{item.aluno_nome}</p>
                    <p className="text-zinc-500 text-xs">{item.instrumento || ''}</p>
                  </div>
                  <span className="text-emerald-400 font-bold">{item.quantidade_aulas} aulas</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info para Comissão */}
      {dados?.tipo_remuneracao === 'comissao' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Users size={20} className="text-emerald-400" />
            Detalhamento por Aluno
          </h2>
          <p className="text-zinc-500 text-xs mb-4">Sua comissão: {dados.porcentagem_professor}% da mensalidade</p>

          {dados?.alunos?.length > 0 ? (
            <div className="space-y-2">
              {dados.alunos.map((aluno, i) => (
                <div key={aluno.id || i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{aluno.nome}</p>
                    <p className="text-zinc-500 text-xs">{aluno.instrumento || ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-emerald-400 font-bold text-sm">{formatarMoeda(aluno.previsto_professor)}</p>
                    <p className="text-zinc-600 text-xs">de {formatarMoeda(aluno.mensalidade)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-4">Nenhum aluno vinculado neste período.</p>
          )}
        </div>
      )}

      {/* Info para Mensalista */}
      {dados?.tipo_remuneracao === 'mensalista' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-400" />
            Valor Mensal Fixo
          </h2>
          <div className="bg-zinc-950 rounded-lg p-4 text-center">
            <p className="text-zinc-500 text-sm">Seu salário fixo mensal</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{formatarMoeda(dados.valor_mensal)}</p>
          </div>

          {dados?.alunos_mensalista?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400">Alunos sob sua responsabilidade</h3>
              {dados.alunos_mensalista.map((a, i) => (
                <div key={a.id || i} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm">{a.nome}</p>
                    <p className="text-zinc-500 text-xs">{a.instrumento || ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status_mensalidade === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{a.status_mensalidade}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

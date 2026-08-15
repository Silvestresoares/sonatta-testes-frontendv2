import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, FileText, ExternalLink, Calendar, DollarSign } from 'lucide-react';

import { API_URL } from '../utils/api';
export default function MinhaAssinatura() {
  const [assinaturaData, setAssinaturaData] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [mostrarTodosPlanos, setMostrarTodosPlanos] = useState(false);
  const [modalDadosAbertos, setModalDadosAbertos] = useState(false);
  const [dadosEscolaForm, setDadosEscolaForm] = useState({ 
    documento: '', telefone_comercial: '', cep: '', rua_numero: '', bairro: '', cidade: '', estado: '' 
  });
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [planoPendente, setPlanoPendente] = useState(null);


  const assinarPlano = async (planoNome, valor, limite_desejado) => {
    setProcessando(true);
    try {
      const token = localStorage.getItem('@sonatta:token');
      const res = await fetch(`${API_URL}/api/escola/assinar-plano`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plano_nome: planoNome, valor, limite_desejado })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('@sonatta:plano', `Plano ${planoNome}`);
        alert('Plano selecionado com sucesso! Você será redirecionado para o pagamento da primeira mensalidade.');
        if (data.url) {
          window.location.href = data.url;
        } else {
          window.location.reload();
        }
      } else {
        if (data.redirect_to_config) {
          setPlanoPendente({ planoNome, valor, limite_desejado });
          setModalDadosAbertos(true);
        } else {
          alert(data.erro || 'Erro ao selecionar o plano.');
        }
      }
    } catch (e) {
      console.error('Erro ao assinar plano:', e);
      alert('Erro de conexão ao tentar assinar o plano.');
    } finally {
      setProcessando(false);
    }
  };

  const buscarCep = async (cepBuscado) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setDadosEscolaForm(prev => ({
          ...prev,
          rua_numero: data.logradouro ? `${data.logradouro}, ` : '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e);
    }
  };

  const salvarDadosEscola = async (e) => {
    e.preventDefault();
    setSalvandoDados(true);
    try {
      const payload = {
        documento: dadosEscolaForm.documento,
        telefone_comercial: dadosEscolaForm.telefone_comercial,
        cep: dadosEscolaForm.cep,
        cidade: dadosEscolaForm.cidade,
        estado: dadosEscolaForm.estado,
        endereco: `${dadosEscolaForm.rua_numero}, ${dadosEscolaForm.bairro}`
      };
      
      const token = localStorage.getItem('@sonatta:token');
      const res = await fetch(`${API_URL}/api/escola`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModalDadosAbertos(false);
        if (planoPendente) {
          assinarPlano(planoPendente.planoNome, planoPendente.valor, planoPendente.limite_desejado);
          setPlanoPendente(null);
        }
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao salvar dados da escola.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar os dados.');
    } finally {
      setSalvandoDados(false);
    }
  };

  useEffect(() => {
    carregarDados();
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
    } catch {
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
              <h3 className="font-medium">Valor da Mensalidade</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              R$ {Number(assinaturaData.plano_detalhes?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-zinc-500">
              {assinaturaData.plano_detalhes?.atual || 0} / {assinaturaData.plano_detalhes?.limite === null ? '∞' : (assinaturaData.plano_detalhes?.limite || 0)} Alunos
            </p>
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

      {/* Seleção de Plano se estiver em Trial */}
      {assinaturaData?.plano === 'Trial 10 dias' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-8 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Selecione seu Plano Definitivo</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Você está atualmente no período de teste grátis. A sua escola possui <strong>{assinaturaData.plano_detalhes?.atual || 0}</strong> alunos ativos no momento. Assine o plano ideal para a sua quantidade de alunos para garantir o acesso ininterrupto.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { limite: 25, valor: 79.90 },
              { limite: 50, valor: 119.90 },
              { limite: 100, valor: 179.90 },
              { limite: 150, valor: 229.90 },
              { limite: 200, valor: 279.90 },
              { limite: 300, valor: 359.90 },
              { limite: 400, valor: 429.90 },
              { limite: 500, valor: 489.90 },
              { limite: 600, valor: 539.90 },
              { limite: 700, valor: 589.90 },
              { limite: 800, valor: 639.90 },
              { limite: 900, valor: 689.90 },
              { limite: 1000, valor: 739.90 }
            ].filter(plan => mostrarTodosPlanos || plan.limite <= 100)
            .map(({ limite, valor }) => {
              
              const isRecommended = assinaturaData.plano_detalhes?.limite === limite;
              const isLocked = (assinaturaData.plano_detalhes?.atual || 0) > limite;
              
              return (
                <button 
                  key={limite}
                  onClick={() => assinarPlano(`Pacote ${limite} Alunos`, valor, limite)}
                  disabled={processando || isLocked}
                  className={`flex flex-col items-start p-6 bg-zinc-950 border ${isRecommended ? 'border-emerald-500' : 'border-zinc-800'} ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400'} rounded-xl transition-all text-left w-full relative overflow-hidden`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-zinc-950 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                      RECOMENDADO
                    </div>
                  )}
                  <div className="flex justify-between w-full items-center mb-2">
                    <div className="text-emerald-400 font-bold text-xl">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs text-zinc-500 font-normal">/mês</span></div>
                  </div>
                  <div className="text-white font-bold text-lg mb-1">Pacote {limite} Alunos</div>
                  <div className="text-xs text-zinc-400">Até {limite} alunos ativos</div>
                  {isLocked && <div className="text-xs text-red-400 mt-2">Você já possui mais de {limite} alunos ativos.</div>}
                </button>
              );
            })}
          </div>
          {!mostrarTodosPlanos && (
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setMostrarTodosPlanos(true)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Ver mais pacotes (até 1000 alunos)
              </button>
            </div>
          )}
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
          <table role="table" aria-label="Tabela de dados" className="w-full text-left border-collapse">
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

      {/* Modal de Dados Cadastrais */}
      {modalDadosAbertos && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Completar Cadastro</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Para gerar sua cobrança no sistema de pagamentos, precisamos que preencha os dados abaixo.
            </p>
            <form onSubmit={salvarDadosEscola} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">CPF ou CNPJ</label>
                <input 
                  type="text" 
                  required
                  maxLength={18}
                  value={dadosEscolaForm.documento}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 11) {
                      val = val.replace(/(\d{3})(\d)/, '$1.$2');
                      val = val.replace(/(\d{3})(\d)/, '$1.$2');
                      val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    } else {
                      val = val.replace(/^(\d{2})(\d)/, '$1.$2');
                      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                      val = val.replace(/\.(\d{3})(\d)/, '.$1/$2');
                      val = val.replace(/(\d{4})(\d)/, '$1-$2');
                    }
                    setDadosEscolaForm({...dadosEscolaForm, documento: val});
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Celular / WhatsApp</label>
                <input 
                  type="text" 
                  required
                  maxLength={15}
                  value={dadosEscolaForm.telefone_comercial}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    val = val.replace(/^(\d{2})(\d)/g, '($1) $2');
                    val = val.replace(/(\d)(\d{4})$/, '$1-$2');
                    setDadosEscolaForm({...dadosEscolaForm, telefone_comercial: val});
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">CEP</label>
                <input 
                  type="text" 
                  required
                  maxLength={9}
                  value={dadosEscolaForm.cep}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
                    setDadosEscolaForm({...dadosEscolaForm, cep: val});
                    if (val.replace(/\D/g, '').length === 8) {
                      buscarCep(val);
                    }
                  }}
                  onBlur={(e) => buscarCep(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="00000-000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Rua e Número</label>
                  <input 
                    type="text" 
                    required
                    value={dadosEscolaForm.rua_numero}
                    onChange={e => setDadosEscolaForm({...dadosEscolaForm, rua_numero: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Av Brasil, 100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Bairro</label>
                  <input 
                    type="text" 
                    required
                    value={dadosEscolaForm.bairro}
                    onChange={e => setDadosEscolaForm({...dadosEscolaForm, bairro: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Centro"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    required
                    value={dadosEscolaForm.cidade}
                    onChange={e => setDadosEscolaForm({...dadosEscolaForm, cidade: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Estado</label>
                  <input 
                    type="text" 
                    required
                    maxLength={2}
                    value={dadosEscolaForm.estado}
                    onChange={e => setDadosEscolaForm({...dadosEscolaForm, estado: e.target.value.toUpperCase()})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="SP"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setModalDadosAbertos(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={salvandoDados}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg transition-colors font-bold disabled:opacity-50"
                >
                  {salvandoDados ? 'Salvando...' : 'Salvar e Assinar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

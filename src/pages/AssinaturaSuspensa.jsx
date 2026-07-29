import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, CreditCard } from 'lucide-react';

export default function AssinaturaSuspensa() {
  const [faturaPendente, setFaturaPendente] = useState(null);
  const [escolaData, setEscolaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mostrarTodosPlanos, setMostrarTodosPlanos] = useState(false);
  const [modalDadosAbertos, setModalDadosAbertos] = useState(false);
  const [dadosEscolaForm, setDadosEscolaForm] = useState({ 
    documento: '', telefone_comercial: '', cep: '', rua_numero: '', bairro: '', cidade: '', estado: '' 
  });
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [planoPendente, setPlanoPendente] = useState(null);
  const plano = typeof window !== 'undefined' ? localStorage.getItem('@sonatta:plano') : 'Trial 10 dias';

  const _envApi = import.meta.env.VITE_API_URL;
  const _defaultLocal = 'http://localhost:3005';
  const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

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
    carregarFatura();
  }, []);

  const carregarFatura = async () => {
    try {
      const token = localStorage.getItem('@sonatta:token');
      const res = await fetch(`${API_URL}/api/escola/faturas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Procura a primeira fatura Pendente ou Atrasada
        const pendente = data.find(f => f.status === 'Pendente' || f.status === 'Atrasado');
        if (pendente) {
          setFaturaPendente(pendente);
        } else {
          setFaturaPendente(null);
        }
      }
      
      const resEscola = await fetch(`${API_URL}/api/escola`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resEscola.ok) {
        const escolaJson = await resEscola.json();
        setEscolaData(escolaJson);
      }
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarConta = async () => {
    if (!window.confirm('Tem certeza absoluta que deseja desistir do sistema? Isso cancelará sua conta, paralisará todas as cobranças de assinatura no Asaas e desativará seu acesso irreversivelmente.')) {
      return;
    }

    try {
      const token = localStorage.getItem('@sonatta:token');
      const res = await fetch(`${API_URL}/api/escola/cancelar-assinatura`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Assinatura cancelada com sucesso. Obrigado por testar o Sonatta!');
        handleLogout();
      } else {
        const data = await res.json();
        alert(data.erro || 'Erro ao cancelar conta.');
      }
    } catch (e) {
      console.error('Erro ao cancelar assinatura:', e);
      alert('Erro interno ao tentar cancelar.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@sonatta:token');
    localStorage.removeItem('@sonatta:tipo_usuario');
    localStorage.removeItem('@sonatta:professor_id');
    localStorage.removeItem('@sonatta:usuario_nome');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={32} className="text-rose-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Suspenso</h1>
        
        <p className="text-zinc-400 mb-6 text-sm">
          A assinatura da sua escola encontra-se pendente ou expirada. Para continuar utilizando o sistema, por favor, regularize o pagamento.
        </p>

        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        ) : faturaPendente && faturaPendente.asaas_invoice_url ? (
          <div className="bg-zinc-950 w-full p-6 rounded-xl border border-zinc-800 mb-6 text-left">
            <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Regularize sua Assinatura
            </h3>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400 text-sm">Valor da Fatura:</span>
              <span className="text-white font-bold">R$ {Number(faturaPendente.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-zinc-400 text-sm">Vencimento:</span>
              <span className="text-zinc-300">{new Date(faturaPendente.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
            </div>

            <a 
              href={faturaPendente.asaas_invoice_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg transition-colors"
            >
              Pagar Assinatura <ExternalLink size={16} />
            </a>
          </div>
        ) : (
          <div className="bg-zinc-950 w-full p-4 rounded-xl border border-zinc-800 mb-6">
            {plano === 'Trial 10 dias' ? (
              <>
                <h3 className="text-emerald-400 font-semibold mb-2">Selecione seu Plano</h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Seu período de teste terminou. A sua escola possui <strong>{escolaData?.plano_detalhes?.atual || 0}</strong> alunos ativos. Assine o plano ideal para continuar usando o Sonatta.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    
                    const isRecommended = escolaData?.plano_detalhes?.limite === limite;
                    const isLocked = (escolaData?.plano_detalhes?.atual || 0) > limite;
                    
                    return (
                      <button 
                        key={limite}
                        onClick={() => assinarPlano(`Pacote ${limite} Alunos`, valor, limite)}
                        disabled={processando || isLocked}
                        className={`flex flex-col items-start p-4 bg-zinc-900 border ${isRecommended ? 'border-emerald-500' : 'border-zinc-700'} ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400'} rounded-lg transition-colors text-left w-full relative overflow-hidden`}
                      >
                        {isRecommended && (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-zinc-950 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                            SUGERIDO
                          </div>
                        )}
                        <div className="text-white font-bold">Pacote {limite} Alunos</div>
                        <div className="text-xs text-zinc-400 mb-2">Até {limite} ativos</div>
                        <div className="text-emerald-400 font-bold mt-auto">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs font-normal">/mês</span></div>
                      </button>
                    );
                  })}
                </div>
                {!mostrarTodosPlanos && (
                  <div className="mt-4 flex justify-center">
                    <button 
                      onClick={() => setMostrarTodosPlanos(true)}
                      className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver mais pacotes (até 1000 alunos)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-emerald-400 font-semibold mb-2">Renove sua Assinatura</h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Entre em contato com o suporte da Sonatta para realizar o pagamento e liberar seu acesso.
                </p>
                <a 
                  href="https://wa.me/5527996335293"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg transition-colors"
                >
                  Falar com Suporte <ExternalLink size={16} />
                </a>
              </>
            )}
          </div>
        )}          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors mb-4"
          >
            Já realizei o pagamento (Atualizar)
          </button>
          
          <button 
            onClick={handleCancelarConta}
            className="text-zinc-500 hover:text-red-400 text-xs mt-2 underline transition-colors"
          >
            Não desejo contratar o sistema (Cancelar Conta)
          </button>

          <button 
            onClick={handleLogout}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Sair do sistema
          </button>
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

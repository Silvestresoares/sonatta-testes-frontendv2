import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, MapPin, Phone, Mail, Link, AlertCircle, Wallet, DollarSign, CheckCircle, Upload, Calendar } from 'lucide-react';


import { API_URL } from '../utils/api';
import WhatsAppConfig from '../components/WhatsAppConfig';

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  
  const [asaasConfigurado, setAsaasConfigurado] = useState(false);
  const [saldoAsaas, setSaldoAsaas] = useState(null);
  const [carregandoSaldo, setCarregandoSaldo] = useState(false);
  const [ativandoAsaas, setAtivandoAsaas] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    nome_escola: '',
    documento: '',
    escola_email: '',
    telefone_comercial: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    website: '',
    logo_url: '',
    data_nascimento: '',
    cor_primaria: '#3B82F6',
    cor_secundaria: '#1E40AF',
    admin_nome: '',
    admin_email: '',
    chave_pix: '',
    titular_pix: '',
    cidade_pix: '',
    exige_assinatura_contrato: false,
    texto_contrato_padrao: '',
    config_pagar_5_semana: false,
    config_descontar_falta_prof: false,
    config_pagamento_substituto: 'valor_normal_professor',
    config_valor_fixo_substituto: '',
    dia_vencimento_mensalidade: 10
  });

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    carregarDadosEscola();
  }, []);

  const carregarDadosEscola = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/escola`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData({
          nome_escola: data.nome_escola || '',
          documento: data.documento || '',
          escola_email: data.escola_email || '',
          telefone_comercial: data.telefone_comercial || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          cep: data.cep || '',
          website: data.website || '',
          logo_url: data.logo_url || '',
          data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '',
          cor_primaria: data.cor_primaria || '#3B82F6',
          cor_secundaria: data.cor_secundaria || '#1E40AF',
          admin_nome: data.admin_nome || '',
          admin_email: data.admin_email || '',
          chave_pix: data.chave_pix || '',
          titular_pix: data.titular_pix || '',
          cidade_pix: data.cidade_pix || '',
          exige_assinatura_contrato: !!data.exige_assinatura_contrato,
          texto_contrato_padrao: data.texto_contrato_padrao || '',
          config_pagar_5_semana: !!data.config_pagar_5_semana,
          config_descontar_falta_prof: !!data.config_descontar_falta_prof,
          config_pagamento_substituto: data.config_pagamento_substituto || 'valor_normal_professor',
          config_valor_fixo_substituto: data.config_valor_fixo_substituto || '',
          dia_vencimento_mensalidade: data.dia_vencimento_mensalidade || 10
        });

        if (data.asaas_api_key) {
          setAsaasConfigurado(true);
          carregarSaldoAsaas();
        }
      } else {
        const err = await res.json();
        setErro(err.erro || 'Erro ao carregar dados da escola.');
      }
    } catch {
      setErro('Erro de conexão ao buscar dados da escola.');
    } finally {
      setLoading(false);
    }
  };

  const carregarSaldoAsaas = async () => {
    try {
      setCarregandoSaldo(true);
      const res = await fetch(`${API_URL}/api/escola/saldo-asaas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSaldoAsaas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar saldo asaas:', err);
    } finally {
      setCarregandoSaldo(false);
    }
  };

  const handleAtivarAsaas = async () => {
    // Validação básica antes de enviar
    if (!formData.documento || !formData.endereco || !formData.cep || !formData.telefone_comercial || !formData.escola_email || !formData.nome_escola || !formData.data_nascimento) {
      setErro('Para ativar o Asaas, preencha todos os dados da Escola (Nome, CNPJ/CPF, Data de Nascimento, E-mail, Telefone, Endereço e CEP) e salve as configurações primeiro.');
      window.scrollTo(0, 0);
      return;
    }

    if (!window.confirm('Deseja criar a subconta financeira no Asaas usando os dados informados? Essa ação criará a sua carteira digital para recebimentos.')) return;

    setAtivandoAsaas(true);
    setErro('');
    try {
      const payload = {
        cpfCnpj: formData.documento,
        telefone_comercial: formData.telefone_comercial,
        celular: formData.telefone_comercial,
        numero: 'S/N', // Ideal seria ter um campo número separado
        bairro: formData.cidade, // Simplificação
        data_nascimento: formData.data_nascimento
      };

      const res = await fetch(`${API_URL}/api/escola/onboarding-asaas`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        setSucesso(data.mensagem);
        setAsaasConfigurado(true);
        carregarSaldoAsaas();
        window.scrollTo(0, 0);
      } else {
        setErro(data.erro || 'Erro ao ativar Asaas.');
        window.scrollTo(0, 0);
      }
    } catch {
      setErro('Erro de conexão ao ativar Asaas.');
      window.scrollTo(0, 0);
    } finally {
      setAtivandoAsaas(false);
    }
  };

  const buscarCep = async (cepBuscado) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro ? `${data.logradouro}, ` : '',
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado
        }));
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFazendoUpload(true);
    setErro('');
    const formDataUpload = new FormData();
    formDataUpload.append('logo', file);
    
    try {
      const res = await fetch(`${API_URL}/api/escola/upload-logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, logo_url: data.url }));
        setSucesso('Logo enviada com sucesso! Lembre-se de "Salvar Alterações".');
        setTimeout(() => setSucesso(''), 4000);
      } else {
        setErro(data.erro || 'Erro ao enviar logo.');
        window.scrollTo(0,0);
      }
    } catch {
      setErro('Erro de conexão ao enviar logo.');
      window.scrollTo(0,0);
    } finally {
      setFazendoUpload(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const res = await fetch(`${API_URL}/api/escola`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSucesso(data.mensagem || 'Configurações salvas com sucesso!');
        setTimeout(() => setSucesso(''), 3000);
      } else {
        setErro(data.erro || 'Erro ao salvar configurações.');
      }
    } catch {
      setErro('Erro de conexão ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <p className="text-zinc-400">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950">
      <header className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações da Escola</h1>
            <p className="text-zinc-400 text-sm">Atualize os dados e informações públicas da sua escola</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={salvando}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-semibold rounded-lg transition-colors"
        >
          <Save size={20} />
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {erro && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} />
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg flex items-center gap-3">
              <Save size={20} />
              {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Perfil do Administrador */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                Dados do Administrador (Acesso)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Seu Nome</label>
                  <input
                    type="text"
                    name="admin_nome"
                    value={formData.admin_nome}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Mail size={16}/> Seu E-mail de Login</label>
                  <input
                    type="email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">Este é o e-mail que você usa para acessar o sistema.</p>
                </div>
              </div>
            </div>

            {/* Integração Asaas */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Wallet size={20} className="text-emerald-500" />
                Integração Financeira (Asaas)
              </h2>
              
              {asaasConfigurado ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle size={20} />
                    Sua escola já está integrada e pronta para emitir cobranças!
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                      <div className="text-sm text-zinc-400 mb-1">Saldo Disponível</div>
                      <div className="text-2xl font-bold text-white">
                        {carregandoSaldo || !saldoAsaas ? 'Carregando...' : `R$ ${saldoAsaas.balance.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-sm">
                    Ative a integração com o Asaas para emitir boletos, Pix e mensalidades recorrentes no cartão de crédito automaticamente. O dinheiro cai direto na sua conta digital.
                  </p>
                  <button
                    type="button"
                    onClick={handleAtivarAsaas}
                    disabled={ativandoAsaas}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500 hover:text-zinc-950 disabled:opacity-50 font-medium rounded-lg transition-colors"
                  >
                    <DollarSign size={20} />
                    {ativandoAsaas ? 'Configurando Conta...' : 'Ativar Recebimentos Asaas'}
                  </button>
                  <p className="text-xs text-zinc-500 mt-2">
                    * Certifique-se de que os dados da escola (CNPJ/CPF, Endereço e Telefone) abaixo estejam corretos antes de ativar.
                  </p>
                </div>
              )}
            </div>

            {/* Configurações de Mensalidades */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Calendar size={20} className="text-emerald-500" />
                Configurações de Mensalidades
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Dia Padrão de Vencimento</label>
                  <select
                    name="dia_vencimento_mensalidade"
                    value={formData.dia_vencimento_mensalidade}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(dia => (
                      <option key={dia} value={dia}>Dia {dia}</option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-1">Este dia será usado como padrão ao gerar as mensalidades mensais e primeiras faturas.</p>
                </div>
              </div>
            </div>

            {/* Integração Pix Direto */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-500" />
                Integração Pix Direto (Estático)
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                Ofereça o pagamento via Pix direto para a sua conta. Ao contrário do Asaas, essa modalidade não possui taxas, mas exige que você dê baixa manualmente no sistema quando receber o comprovante.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Chave Pix (CPF, CNPJ, Celular, E-mail ou Aleatória)</label>
                  <input
                    type="text"
                    name="chave_pix"
                    value={formData.chave_pix}
                    onChange={handleChange}
                    placeholder="Ex: 12.345.678/0001-90"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nome do Titular da Conta (Exato como no banco)</label>
                  <input
                    type="text"
                    name="titular_pix"
                    value={formData.titular_pix}
                    onChange={handleChange}
                    placeholder="Ex: Escola de Música Sonatta LTDA"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Cidade da Conta</label>
                  <input
                    type="text"
                    name="cidade_pix"
                    value={formData.cidade_pix}
                    onChange={handleChange}
                    placeholder="Ex: Sao Paulo"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Configuração de Contratos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <AlertCircle size={20} className="text-emerald-500" />
                Contratos e Matrículas (Assinatura Eletrônica)
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="exige_assinatura_contrato"
                    checked={formData.exige_assinatura_contrato}
                    onChange={(e) => setFormData(prev => ({ ...prev, exige_assinatura_contrato: e.target.checked }))}
                    className="w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-950"
                  />
                  <div>
                    <span className="text-sm font-medium text-white block">Exigir Assinatura de Contrato no Portal</span>
                    <span className="text-xs text-zinc-400">Se ativo, alunos ou responsáveis sem contrato assinado verão uma tela de bloqueio exigindo o aceite digital do termo abaixo.</span>
                  </div>
                </label>
                
                {formData.exige_assinatura_contrato && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2 mt-4">Texto do Contrato / Termo de Matrícula (Padrão)</label>
                    <textarea
                      name="texto_contrato_padrao"
                      value={formData.texto_contrato_padrao}
                      onChange={handleChange}
                      placeholder="Ex: Pelo presente instrumento, o ALUNO concorda com as normas da escola..."
                      rows={6}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors custom-scrollbar"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Este texto será exibido para aceite com o registro de IP, Data, Hora e CPF do assinante.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informações Básicas da Escola */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2">Dados da Escola</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nome da Escola</label>
                  <input
                    type="text"
                    name="nome_escola"
                    value={formData.nome_escola}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    name="documento"
                    maxLength={18}
                    value={formData.documento}
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
                      setFormData(prev => ({ ...prev, documento: val }));
                    }}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Data de Nascimento (Obrigatório p/ CPF)</label>
                  <input
                    type="date"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Mail size={16}/> E-mail Público da Escola</label>
                  <input
                    type="email"
                    name="escola_email"
                    value={formData.escola_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Phone size={16}/> Telefone / WhatsApp</label>
                  <input
                    type="text"
                    name="telefone_comercial"
                    maxLength={15}
                    value={formData.telefone_comercial}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      val = val.replace(/^(\d{2})(\d)/g, '($1) $2');
                      val = val.replace(/(\d)(\d{4})$/, '$1-$2');
                      setFormData(prev => ({ ...prev, telefone_comercial: val }));
                    }}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Link size={16}/> Website ou Link (Instagram)</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <MapPin size={20} className="text-zinc-400"/>
                Localização
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Rua, Número, Bairro"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">CEP</label>
                  <input
                    type="text"
                    name="cep"
                    maxLength={9}
                    value={formData.cep}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
                      setFormData(prev => ({ ...prev, cep: val }));
                      if (val.replace(/\D/g, '').length === 8) {
                        buscarCep(val);
                      }
                    }}
                    onBlur={(e) => buscarCep(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Identidade Visual */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2">Identidade Visual</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-1"><Link size={16}/> Logo da Escola (Link / URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      placeholder="https://exemplo.com/minha-logo.png"
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fazendoUpload}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors border border-zinc-700"
                    >
                      <Upload size={18} />
                      {fazendoUpload ? 'Enviando...' : 'Upload'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleUploadLogo} 
                      className="hidden" 
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Cole o link público da imagem da sua logo. Recomendamos imagens com fundo transparente (PNG).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Cor Primária</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="cor_primaria"
                      value={formData.cor_primaria}
                      onChange={handleChange}
                      className="h-10 w-10 rounded border border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="cor_primaria"
                      value={formData.cor_primaria}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="cor_secundaria"
                      value={formData.cor_secundaria}
                      onChange={handleChange}
                      className="h-10 w-10 rounded border border-zinc-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="cor_secundaria"
                      value={formData.cor_secundaria}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações de Professores */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2">Gestão de Professores</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      name="config_pagar_5_semana"
                      checked={formData.config_pagar_5_semana}
                      onChange={(e) => setFormData(prev => ({ ...prev, config_pagar_5_semana: e.target.checked }))}
                      className="w-4 h-4 text-emerald-500 bg-zinc-950 border-zinc-700 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">Meses com 5 Semanas (Remuneração Extra)</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Se marcado, quando o mês tiver 5 aulas daquele aluno, o professor (horista/comissão) recebe o valor proporcional à 5ª aula. Se desmarcado, ele recebe o valor limite de 4 aulas (valor base da mensalidade).</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      name="config_descontar_falta_prof"
                      checked={formData.config_descontar_falta_prof}
                      onChange={(e) => setFormData(prev => ({ ...prev, config_descontar_falta_prof: e.target.checked }))}
                      className="w-4 h-4 text-emerald-500 bg-zinc-950 border-zinc-700 rounded focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">Descontar "Falta do Professor" Automaticamente</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Se marcado, aulas marcadas como "Falta do Professor" sem reposição serão deduzidas do extrato (horista e comissão).</span>
                  </div>
                </label>

                <div className="pt-2 border-t border-zinc-800">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Como pagar o Professor Substituto?</label>
                  <select
                    name="config_pagamento_substituto"
                    value={formData.config_pagamento_substituto}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors mb-3"
                  >
                    <option value="valor_normal_professor">Repassar o valor da aula do titular para o substituto (Proporcional)</option>
                    <option value="valor_hora_substituto">Pagar o valor hora padrão cadastrado no perfil do professor substituto</option>
                    <option value="valor_fixo">Pagar um valor fixo por substituição para qualquer professor</option>
                  </select>

                  {formData.config_pagamento_substituto === 'valor_fixo' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Valor Fixo da Substituição (R$)</label>
                      <input
                        type="number"
                        name="config_valor_fixo_substituto"
                        value={formData.config_valor_fixo_substituto}
                        onChange={handleChange}
                        className="w-full md:w-1/3 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Ex: 50.00"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Integração Híbrida do WhatsApp */}
            <WhatsAppConfig token={token} />

          </form>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Shield, FileText, Settings, Users, Plus, CheckCircle, XCircle, RefreshCw, Lock, Save, AlertCircle, Search } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function SuperAdminContratos() {
  const [subAba, setSubAba] = useState<'config' | 'versoes' | 'auditoria'>('config');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // 1. Configurações Globais
  const [config, setConfig] = useState<any>({
    razao_social_fornecedora: '',
    nome_fantasia_fornecedora: '',
    cnpj_fornecedora: '',
    endereco_fornecedora: '',
    email_fornecedora: '',
    dpo_email_fornecedora: '',
    responsavel_legal_fornecedora: '',
    sla_meta_percentual: 99.0,
    tolerancia_inadimplencia_dias: 3,
    prazo_minimo_padrao_meses: 1,
    prazo_aviso_previo_cancelamento_dias: 30,
    retencao_dados_pos_cancelamento_dias: 60,
    rpo_horas_estimado: 24,
    rto_horas_estimado: 48,
    foro_comarca: 'São Paulo / SP',
  });

  // 2. Versões de Documentos
  const [versoes, setVersoes] = useState<any[]>([]);
  const [modalNovaVersao, setModalNovaVersao] = useState(false);
  const [novaVersao, setNovaVersao] = useState({
    tipoDocumento: 'contrato_saas',
    versao: 'v1.1',
    titulo: '',
    conteudoMarkdown: '',
    resumoAlteracoes: '',
    exigeAceiteObrigatorio: true,
  });

  // 3. Auditoria de Aceites
  const [auditoria, setAuditoria] = useState<{ total: number; aceites: any[] }>({ total: 0, aceites: [] });
  const [filtroEscola, setFiltroEscola] = useState('');

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    carregarConfiguracoes();
    carregarVersoes();
    carregarAuditoria();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saas-contratos/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) setConfig(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar configs do SaaS:', err);
    }
  };

  const carregarVersoes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saas-contratos/versoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVersoes(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar versões:', err);
    }
  };

  const carregarAuditoria = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saas-contratos/auditoria-aceites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditoria(data.data || { total: 0, aceites: [] });
      }
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const res = await fetch(`${API_URL}/api/saas-contratos/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.erro || 'Falha ao salvar configurações.');

      setMensagem({ tipo: 'sucesso', texto: 'Configurações e parâmetros do SaaS salvos com sucesso!' });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublicarVersao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaVersao.titulo || !novaVersao.conteudoMarkdown || !novaVersao.versao) {
      alert('Preencha título, versão e conteúdo.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/saas-contratos/versoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(novaVersao),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.erro || 'Falha ao publicar versão.');

      alert('Nova versão publicada com sucesso!');
      setModalNovaVersao(false);
      carregarVersoes();
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar versão.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlternarStatusVersao = async (id: number, statusAtual: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/saas-contratos/versoes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ativo: !statusAtual }),
      });

      if (res.ok) {
        carregarVersoes();
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const aceitesFiltrados = auditoria.aceites.filter((a) =>
    a.nome_escola?.toLowerCase().includes(filtroEscola.toLowerCase()) ||
    a.tipo_documento?.toLowerCase().includes(filtroEscola.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Sub-abas de Navegação */}
      <div className="flex border-b border-zinc-800 gap-3 pb-3">
        <button
          onClick={() => setSubAba('config')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
            subAba === 'config'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Settings size={15} />
          Parâmetros Institucionais & SLA
        </button>

        <button
          onClick={() => setSubAba('versoes')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
            subAba === 'versoes'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <FileText size={15} />
          Gerenciador de Versões Jurídicas ({versoes.length})
        </button>

        <button
          onClick={() => setSubAba('auditoria')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
            subAba === 'auditoria'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Users size={15} />
          Trilha de Auditoria de Aceites ({auditoria.total})
        </button>
      </div>

      {mensagem.texto && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          <AlertCircle size={18} />
          {mensagem.texto}
        </div>
      )}

      {/* 1. ABA DE CONFIGURAÇÕES INSTITUCIONAIS */}
      {subAba === 'config' && (
        <form onSubmit={handleSalvarConfig} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-emerald-400" size={20} />
              Dados da Empresa Licenciante (Fornecedora do SaaS)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Estes dados serão injetados dinamicamente em todos os Contratos, DPAs e SLAs gerados pelo sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium">Razão Social</label>
              <input
                type="text"
                value={config.razao_social_fornecedora}
                onChange={(e) => setConfig({ ...config, razao_social_fornecedora: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Nome Fantasia</label>
              <input
                type="text"
                value={config.nome_fantasia_fornecedora}
                onChange={(e) => setConfig({ ...config, nome_fantasia_fornecedora: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">CNPJ da Fornecedora</label>
              <input
                type="text"
                value={config.cnpj_fornecedora}
                onChange={(e) => setConfig({ ...config, cnpj_fornecedora: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">E-mail de Contato Comercial</label>
              <input
                type="email"
                value={config.email_fornecedora}
                onChange={(e) => setConfig({ ...config, email_fornecedora: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">E-mail do Encarregado de Dados (DPO / LGPD)</label>
              <input
                type="email"
                value={config.dpo_email_fornecedora}
                onChange={(e) => setConfig({ ...config, dpo_email_fornecedora: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Foro / Comarca Eleita</label>
              <input
                type="text"
                value={config.foro_comarca}
                onChange={(e) => setConfig({ ...config, foro_comarca: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-zinc-400 font-medium">Endereço Completo</label>
              <input
                type="text"
                value={config.endereco_fornecedora}
                onChange={(e) => setConfig({ ...config, endereco_fornecedora: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <hr className="border-zinc-800" />

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="text-purple-400" size={18} />
              Parâmetros Operacionais, SLA e Retenção de Dados
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Políticas técnicas vinculantes estipuladas no contrato com as escolas contratantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium">Meta de SLA (%)</label>
              <input
                type="number"
                step="0.1"
                min="90"
                max="99.9"
                value={config.sla_meta_percentual}
                onChange={(e) => setConfig({ ...config, sla_meta_percentual: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Tolerância Inadimplência (Dias)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={config.tolerancia_inadimplencia_dias}
                onChange={(e) => setConfig({ ...config, tolerancia_inadimplencia_dias: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Aviso Prévio Cancelamento (Dias)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={config.prazo_aviso_previo_cancelamento_dias}
                onChange={(e) => setConfig({ ...config, prazo_aviso_previo_cancelamento_dias: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Retenção de Dados Pós-Cancelamento (Dias)</label>
              <input
                type="number"
                min="15"
                max="365"
                value={config.retencao_dados_pos_cancelamento_dias}
                onChange={(e) => setConfig({ ...config, retencao_dados_pos_cancelamento_dias: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">RPO Estimado (Horas de Backup)</label>
              <input
                type="number"
                min="1"
                max="72"
                value={config.rpo_horas_estimado}
                onChange={(e) => setConfig({ ...config, rpo_horas_estimado: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">RTO Estimado (Horas de Restauração)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={config.rto_horas_estimado}
                onChange={(e) => setConfig({ ...config, rto_horas_estimado: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Save size={16} />
              {loading ? 'Salvando...' : 'Salvar Parâmetros Institucionais'}
            </button>
          </div>
        </form>
      )}

      {/* 2. ABA DE GERENCIAMENTO DE VERSÕES */}
      {subAba === 'versoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Versões dos Documentos Jurídicos</h3>
              <p className="text-xs text-zinc-400">Contratos, DPAs e SLAs com integridade criptográfica SHA-256.</p>
            </div>

            <button
              onClick={() => setModalNovaVersao(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl transition flex items-center gap-2"
            >
              <Plus size={15} />
              Publicar Nova Versão
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {versoes.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {v.tipo_documento}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {v.versao}
                    </span>
                    {v.ativo ? (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <XCircle size={12} /> Inativo
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white">{v.titulo}</h4>
                  {v.resumo_alteracoes && (
                    <p className="text-xs text-zinc-400">{v.resumo_alteracoes}</p>
                  )}
                  <p className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <Lock size={10} className="text-emerald-400" />
                    Hash SHA-256: {v.hash_conteudo_sha256}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAlternarStatusVersao(v.id, v.ativo)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      v.ativo
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                    }`}
                  >
                    {v.ativo ? 'Desativar' : 'Ativar Versão'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ABA DE TRILHA DE AUDITORIA DE ACEITES */}
      {subAba === 'auditoria' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Trilha de Auditoria de Aceites</h3>
              <p className="text-xs text-zinc-400">Registros probatórios de aceites eletrônicos realizados por todas as escolas.</p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por escola..."
                value={filtroEscola}
                onChange={(e) => setFiltroEscola(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">Escola / Contratante</th>
                    <th className="p-3.5">Documento</th>
                    <th className="p-3.5">Versão</th>
                    <th className="p-3.5">Data/Hora Aceite</th>
                    <th className="p-3.5">IP & User Agent</th>
                    <th className="p-3.5">Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {aceitesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        Nenhum registro de aceite localizado.
                      </td>
                    </tr>
                  ) : (
                    aceitesFiltrados.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-white">{item.nome_escola}</p>
                          <p className="text-[11px] text-zinc-500">{item.usuario_nome}</p>
                        </td>
                        <td className="p-3.5 uppercase font-semibold text-zinc-300">
                          {item.tipo_documento}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                            {item.versao}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                          {new Date(item.aceito_em).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-zinc-400 max-w-[200px] truncate" title={item.user_agent}>
                          {item.ip_address}
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-zinc-400" title={item.documento_hash_sha256}>
                          {item.documento_hash_sha256?.substring(0, 16)}...
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PUBLICAÇÃO DE NOVA VERSÃO */}
      {modalNovaVersao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Publicar Nova Versão Jurídica</h3>
              <button onClick={() => setModalNovaVersao(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePublicarVersao} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-medium">Tipo de Documento</label>
                  <select
                    value={novaVersao.tipoDocumento}
                    onChange={(e) => setNovaVersao({ ...novaVersao, tipoDocumento: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none"
                  >
                    <option value="contrato_saas">Contrato SaaS & Termos de Uso</option>
                    <option value="dpa">Anexo I: DPA (Tratamento de Dados / LGPD)</option>
                    <option value="sla">Anexo II: SLA (Nível de Serviço)</option>
                    <option value="politica_retencao">Anexo III: Política de Retenção</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium">Identificador de Versão</label>
                  <input
                    type="text"
                    placeholder="ex: v1.1 ou v2.0"
                    value={novaVersao.versao}
                    onChange={(e) => setNovaVersao({ ...novaVersao, versao: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Título do Documento</label>
                <input
                  type="text"
                  value={novaVersao.titulo}
                  onChange={(e) => setNovaVersao({ ...novaVersao, titulo: e.target.value })}
                  placeholder="ex: Contrato de Licença de Uso de Software como Serviço (SaaS)"
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Resumo das Alterações (Changelog Jurídico)</label>
                <input
                  type="text"
                  value={novaVersao.resumoAlteracoes}
                  onChange={(e) => setNovaVersao({ ...novaVersao, resumoAlteracoes: e.target.value })}
                  placeholder="ex: Atualização da cláusula de retenção e adequação de SLA"
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Conteúdo em Markdown (Suporta tags dinâmicas como {'{{ESCOLA_NOME}}'})</label>
                <textarea
                  rows={12}
                  value={novaVersao.conteudoMarkdown}
                  onChange={(e) => setNovaVersao({ ...novaVersao, conteudoMarkdown: e.target.value })}
                  placeholder="# Título do Contrato..."
                  className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 outline-none resize-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaVersao.exigeAceiteObrigatorio}
                  onChange={(e) => setNovaVersao({ ...novaVersao, exigeAceiteObrigatorio: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500"
                />
                <span className="text-xs text-zinc-300">
                  Exigir novo aceite eletrônico obrigatório de todos os clientes no próximo acesso
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalNovaVersao(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl"
                >
                  {loading ? 'Publicando...' : 'Publicar e Gerar Hash SHA-256'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

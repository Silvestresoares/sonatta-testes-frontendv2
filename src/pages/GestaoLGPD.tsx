import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Search, AlertTriangle, CheckCircle, FileText, UserCheck, RefreshCw, Lock } from 'lucide-react';
import { API_URL } from '../utils/api';

/**
 * Painel Administrativo de Gestão e Conformidade LGPD (Lei 13.709/2018).
 * Permite atender direitos dos titulares:
 * - Art. 18, II e V: Acesso e Portabilidade dos dados (Exportação estruturada).
 * - Art. 16, I: Eliminação e Anonimização de dados desnecessários mantendo histórico legal.
 */
export default function GestaoLGPD() {
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [dossie, setDossie] = useState<any>(null);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Estados do Modal de Anonimização
  const [modalAnonimizarAberto, setModalAnonimizarAberto] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [confirmacaoTexto, setConfirmacaoTexto] = useState('');
  const [anonimizando, setAnonimizando] = useState(false);

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    carregarHistoricoSolicitacoes();
  }, []);

  const carregarHistoricoSolicitacoes = async () => {
    setCarregandoHistorico(true);
    try {
      const res = await fetch(`${API_URL}/api/lgpd/solicitacoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSolicitacoes(data || []);
      }
    } catch (e) {
      console.error('Erro ao carregar histórico LGPD:', e);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo.trim()) return;

    setCarregando(true);
    setErro('');
    setSucesso('');
    setDossie(null);

    try {
      const res = await fetch(`${API_URL}/api/lgpd/exportar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ termo: termo.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.erro || 'Titular não localizado.');
      }

      setDossie(data.data || data);
      setSucesso('Dossiê do titular localizado com sucesso.');
      carregarHistoricoSolicitacoes();
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar titular.');
    } finally {
      setCarregando(false);
    }
  };

  const handleBaixarJson = () => {
    if (!dossie) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dossie, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const nomeArquivo = `dossie_lgpd_${(dossie.titular?.nome || 'titular').replace(/\s+/g, '_').toLowerCase()}.json`;
    downloadAnchor.setAttribute('download', nomeArquivo);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAnonimizar = async () => {
    if (confirmacaoTexto !== 'ANONIMIZAR') {
      alert('Digite exatamente a palavra "ANONIMIZAR" para confirmar a desidentificação irreversível.');
      return;
    }

    setAnonimizando(true);
    setErro('');
    try {
      const res = await fetch(`${API_URL}/api/lgpd/anonimizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          termo: termo.trim(),
          justificativa: justificativa.trim() || 'Exercício formal de direito do titular (Art. 18 LGPD)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.erro || 'Falha ao processar anonimização.');
      }

      setModalAnonimizarAberto(false);
      setDossie(null);
      setTermo('');
      setJustificativa('');
      setConfirmacaoTexto('');
      setSucesso(data.message || 'Titular anonimizado com sucesso.');
      carregarHistoricoSolicitacoes();
    } catch (err: any) {
      setErro(err.message || 'Erro ao anonimizar titular.');
    } finally {
      setAnonimizando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Painel de Privacidade & LGPD
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Atendimento aos Direitos do Titular (Art. 18 da Lei 13.709/2018): Portabilidade e Anonimização Segura.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {erro && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{erro}</span>
        </div>
      )}
      {sucesso && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <span>{sucesso}</span>
        </div>
      )}

      {/* Busca de Titular */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
          <Search size={20} className="text-emerald-500" />
          Localizar Titular de Dados
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Digite o CPF ou E-mail do Aluno, Responsável ou Professor para consultar seu dossiê completo ou executar anonimização.
        </p>

        <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Digite CPF ou E-mail (ex: 123.456.789-00 ou joao@email.com)"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={carregando || !termo.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {carregando ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
            Consultar Dossiê
          </button>
        </form>
      </div>

      {/* Resultado / Dossiê do Titular */}
      {dossie && dossie.titular && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-4">
            <div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full uppercase">
                {dossie.tipoTitular}
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
                {dossie.titular.nome}
              </h2>
              <p className="text-sm text-zinc-500">
                CPF: {dossie.titular.cpf || 'Não informado'} | E-mail: {dossie.titular.email || 'Não informado'} | Telefone: {dossie.titular.telefone || 'Não informado'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBaixarJson}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors text-sm shadow-sm"
              >
                <Download size={18} />
                Baixar Dossiê (JSON)
              </button>
              <button
                onClick={() => setModalAnonimizarAberto(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors text-sm shadow-sm"
              >
                <Trash2 size={18} />
                Anonimizar / Excluir
              </button>
            </div>
          </div>

          {/* Grid de Resumo dos Dados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-2 mb-2">
                <FileText size={16} className="text-emerald-500" />
                Histórico Financeiro
              </h3>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {dossie.historicoFinanceiro?.length || 0}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Registros de mensalidades/cobranças mantidos conforme Art. 16 LGPD.</p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-2 mb-2">
                <UserCheck size={16} className="text-blue-500" />
                Histórico Acadêmico
              </h3>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {dossie.historicoPedagogico?.length || dossie.vinculos?.turmas?.length || 0}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Aulas registradas, presenças e turmas vinculadas.</p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-2 mb-2">
                <Lock size={16} className="text-amber-500" />
                Consentimentos & Termos
              </h3>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {dossie.consentimentos?.length || 0}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Aceites de políticas e termos de uso com registro de data/IP.</p>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Solicitações LGPD */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={20} className="text-emerald-500" />
          Trilha de Auditoria de Solicitações LGPD
        </h2>

        {carregandoHistorico ? (
          <div className="py-8 text-center text-zinc-500">Carregando histórico...</div>
        ) : solicitacoes.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">Nenhuma solicitação LGPD registrada até o momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400">
                <tr>
                  <th className="pb-3 font-semibold">Data/Hora</th>
                  <th className="pb-3 font-semibold">Titular</th>
                  <th className="pb-3 font-semibold">Tipo</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Executado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {solicitacoes.map((item) => (
                  <tr key={item.id} className="text-zinc-700 dark:text-zinc-300">
                    <td className="py-3">{new Date(item.data_solicitacao).toLocaleString('pt-BR')}</td>
                    <td className="py-3 font-medium">{item.solicitante_nome}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        item.tipo_solicitacao === 'anonimizacao'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {item.tipo_solicitacao.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400">{item.executado_por_nome || 'Sistema'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Anonimização */}
      {modalAnonimizarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-red-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold">Anonimização Irreversível (LGPD)</h3>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Esta ação irá desidentificar permanentemente os dados de contato (Nome, E-mail, Telefone, CPF, Endereço e Senhas) do titular <strong>{dossie?.titular?.nome}</strong>.
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
              <strong>Nota Legal (Art. 16, I da LGPD):</strong> Os registros contábeis e financeiros serão preservados de forma desidentificada para cumprimento de obrigações tributárias e fiscais.
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Justificativa da Solicitação:
              </label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Ex: Titular solicitou exclusão por e-mail no dia..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Digite <strong>ANONIMIZAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={confirmacaoTexto}
                onChange={(e) => setConfirmacaoTexto(e.target.value)}
                placeholder="ANONIMIZAR"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalAnonimizarAberto(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAnonimizar}
                disabled={confirmacaoTexto !== 'ANONIMIZAR' || anonimizando}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                {anonimizando ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Confirmar Anonimização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

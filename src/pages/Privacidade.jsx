import React, { useState } from 'react';
import { Shield, Lock, FileText, CheckCircle2, Send, Globe, Server, ArrowLeft, Mail, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';

/**
 * Página Pública de Política de Privacidade e Canal de Atendimento do DPO (LGPD - Lei 13.709/2018).
 * Apresenta transparência ativa e permite que qualquer titular exerça seus direitos.
 */
export default function Privacidade() {
  const navigate = useNavigate();

  // Estados do Formulário de Contato DPO
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [tipoSolicitacao, setTipoSolicitacao] = useState('acesso_portabilidade');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmitDPO = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setEnviando(true);
    setErro('');
    setSucesso('');

    try {
      const res = await fetch(`${API_URL}/api/lgpd/contato-dpo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          cpf: cpf.trim() || null,
          tipoSolicitacao,
          mensagem: mensagem.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.erro || 'Falha ao enviar solicitação.');
      }

      setSucesso(data.message || 'Sua solicitação foi protocolada com sucesso. Nosso Encarregado entrará em contato em até 15 dias úteis.');
      setNome('');
      setEmail('');
      setCpf('');
      setMensagem('');
    } catch (err) {
      setErro(err.message || 'Erro de conexão ao enviar formulário.');
    } finally {
      setEnviando(false);
    }
  };

  const handleVoltar = () => {
    const currentPath = window.location.pathname;
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          redirecionarPadrao();
        }
      }, 100);
    } else {
      redirecionarPadrao();
    }
  };

  const redirecionarPadrao = () => {
    const portalToken = localStorage.getItem('@sonatta:portal_token');
    if (portalToken) {
      navigate('/portal/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Barra de Navegação */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield size={24} />
            </div>
            <div>
              <span className="font-bold text-lg text-white">Sonatta</span>
              <span className="text-xs text-zinc-400 block -mt-1">Central de Privacidade & LGPD</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVoltar}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Banner de Apresentação */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase">
            <Lock size={14} /> Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Política de Privacidade & Proteção de Dados
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Esta política descreve de forma transparente quais dados pessoais coletamos, para quais finalidades reais eles são utilizados, com quais parceiros são compartilhados e como você pode exercer seus direitos fundamentais.
          </p>
          <p className="text-xs text-zinc-500">Última atualização: Versão 1.0 (Agosto de 2026)</p>
        </section>

        {/* Artigos da Política */}
        <section className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* Seção 1 */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
              Quais Dados Pessoais Coletamos e Como Utilizamos
            </h2>
            <p>
              O sistema <strong>Sonatta</strong> coleta exclusivamente os dados estritamente necessários para a operação das escolas de música e atendimento das obrigações contratuais e fiscais:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
              <li><strong className="text-zinc-200">Alunos:</strong> Nome completo, CPF, e-mail, telefone/WhatsApp, endereço residencial (necessário para emissão de boleto bancário registrado), data de nascimento (para validação de maioridade legal), instrumento musical e registros de presença/aulas.</li>
              <li><strong className="text-zinc-200">Responsáveis Legais e Financeiros:</strong> Nome, CPF, e-mail, telefone e endereço para emissão de cobranças de dependentes menores e acesso ao Portal do Responsável.</li>
              <li><strong className="text-zinc-200">Professores:</strong> Nome, CPF, e-mail, telefone, endereço e dados bancários/PIX para confecção da folha de repasse e pagamento de comissões.</li>
              <li><strong className="text-zinc-200">Leads e Aulas Experimentais:</strong> Nome e telefone/WhatsApp informados pelo próprio titular para agendamento de aula demonstrativa.</li>
            </ul>
          </div>

          {/* Seção 2 */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
              Bases Legais para o Tratamento (Art. 7º da LGPD)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <h3 className="font-semibold text-emerald-400 text-sm mb-1">Execução de Contrato (Art. 7º, V)</h3>
                <p className="text-xs text-zinc-400">Prestação de serviços educacionais de música, controle de turmas, agendamento de aulas e cobrança de mensalidades.</p>
              </div>
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <h3 className="font-semibold text-blue-400 text-sm mb-1">Obrigação Legal (Art. 7º, II)</h3>
                <p className="text-xs text-zinc-400">Guarda de registros fiscais e contábeis de faturamento pelo prazo legal de 5 anos (Art. 173 do Código Tributário Nacional).</p>
              </div>
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <h3 className="font-semibold text-amber-400 text-sm mb-1">Consentimento (Art. 7º, I)</h3>
                <p className="text-xs text-zinc-400">Envio de comunicações pedagógicas e confirmação de aulas experimentais solicitadas pelo próprio usuário.</p>
              </div>
            </div>
          </div>

          {/* Seção 3 */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
              Compartilhamento com Terceiros & Transferência Internacional (Art. 33)
            </h2>
            <p>Para o funcionamento seguro da infraestrutura, os dados são compartilhados estritamente com os seguintes operadores:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse mt-2">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2.5">Operador / Serviço</th>
                    <th className="py-2.5">Finalidade</th>
                    <th className="py-2.5">País</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Asaas Gestão Financeira S.A.</td>
                    <td className="py-2.5">Emissão de boletos bancários, PIX e webhooks de liquidação.</td>
                    <td className="py-2.5 text-emerald-400">Brasil 🇧🇷</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Cloudinary Inc.</td>
                    <td className="py-2.5">Armazenamento em nuvem criptografado de anexos e partituras.</td>
                    <td className="py-2.5 text-amber-400">EUA / UE 🌐</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Google LLC (Google Calendar API)</td>
                    <td className="py-2.5">Sincronização de agendas de aula em formato .ics.</td>
                    <td className="py-2.5 text-amber-400">EUA 🇺🇸</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Web Push Services (Google FCM / Apple APNs)</td>
                    <td className="py-2.5">Entrega de notificações push criptografadas no navegador/PWA.</td>
                    <td className="py-2.5 text-amber-400">EUA 🇺🇸</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Meta Platforms (WhatsApp API)</td>
                    <td className="py-2.5">Envio de confirmações de presença e avisos transacionais.</td>
                    <td className="py-2.5 text-amber-400">EUA / Global 🌐</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção 4 */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
              Seus Direitos como Titular de Dados (Art. 18 da LGPD)
            </h2>
            <p>Você possui o direito de solicitar a qualquer momento:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Acesso e Portabilidade:</strong> Obter cópia completa e estruturada (JSON) de todos os seus dados.</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Correção:</strong> Atualizar dados incompletos, inexatos ou desatualizados.</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Anonimização / Eliminação:</strong> Desidentificar irreversivelmente dados pessoais desnecessários.</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Revogação do Consentimento:</strong> Retirar autorização para contatos ou notificações.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Formulário do Canal do DPO */}
        <section className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-emerald-500/30 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Mail size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Canal de Atendimento do DPO</h2>
              <p className="text-sm text-zinc-400">
                Envie sua requisição formal de direitos diretamente ao Encarregado de Proteção de Dados.
              </p>
            </div>
          </div>

          {erro && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={18} />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-3 text-sm">
              <CheckCircle2 size={18} />
              <span>{sucesso}</span>
            </div>
          )}

          <form onSubmit={handleSubmitDPO} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">E-mail para Resposta *</label>
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">CPF (Opcional para localização)</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Tipo de Solicitação *</label>
                <select
                  value={tipoSolicitacao}
                  onChange={(e) => setTipoSolicitacao(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm cursor-pointer"
                >
                  <option value="acesso_portabilidade">📥 Acesso / Portabilidade dos Dados (Dossiê)</option>
                  <option value="retificacao">✏️ Correção / Retificação de Informações</option>
                  <option value="anonimizacao">🗑️ Eliminação / Anonimização de Dados</option>
                  <option value="revogacao">🚫 Revogação de Consentimento de Notificações</option>
                  <option value="duvida">❓ Dúvida sobre Tratamento de Dados</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Mensagem ou Detalhes da Solicitação *</label>
              <textarea
                required
                rows={4}
                placeholder="Descreva detalhadamente sua solicitação para a equipe de proteção de dados..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 text-sm"
              >
                {enviando ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                Protocolar Solicitação ao DPO
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-600">
        <p>Sonatta Gestão de Escolas de Música &copy; {new Date().getFullYear()} - Todos os direitos reservados.</p>
        <p className="mt-1 text-zinc-500">Conformidade e Governança com a Lei nº 13.709/2018 (LGPD).</p>
      </footer>
    </div>
  );
}

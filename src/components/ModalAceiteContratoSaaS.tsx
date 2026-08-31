import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle2, Lock, Download, AlertTriangle, ExternalLink } from 'lucide-react';
import { API_URL } from '../utils/api';
import { jsPDF } from 'jspdf';
import { renderMarkdownContrato } from '../utils/markdownRenderer';

interface DocumentoPendencia {
  id: number;
  tipo_documento: string;
  versao: string;
  titulo: string;
  conteudo_markdown: string;
  hash_conteudo_sha256: string;
  resumo_alteracoes?: string;
}

interface ModalAceiteContratoSaaSProps {
  isOpen: boolean;
  pendencias: DocumentoPendencia[];
  onAceiteConcluido: () => void;
}

export default function ModalAceiteContratoSaaS({
  isOpen,
  pendencias,
  onAceiteConcluido,
}: ModalAceiteContratoSaaSProps) {
  const [documentoAtivoIndex, setDocumentoAtivoIndex] = useState(0);
  const [documentosAceitosIds, setDocumentosAceitosIds] = useState<number[]>([]);
  const [concordouTermos, setConcordouTermos] = useState(false);
  const [declarouPoderes, setDeclarouPoderes] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoFeedback, setSucessoFeedback] = useState('');
  const [contratoPersonalizado, setContratoPersonalizado] = useState<any>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [todosAceitosConcluidos, setTodosAceitosConcluidos] = useState(false);

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    if (isOpen && token) {
      carregarContratoPersonalizado();
    }
  }, [isOpen, token]);

  const carregarContratoPersonalizado = async () => {
    try {
      setCarregandoDados(true);
      const res = await fetch(`${API_URL}/api/saas-contratos/meu-contrato`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContratoPersonalizado(data.data || data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do contrato:', err);
    } finally {
      setCarregandoDados(false);
    }
  };

  if (!isOpen || pendencias.length === 0) return null;

  const docAtual = pendencias[documentoAtivoIndex] || pendencias[0];

  // Busca o texto personalizado caso disponível no backend
  const docPersonalizado = contratoPersonalizado?.documentos?.find(
    (d: any) => d.id === docAtual.id || d.tipo_documento === docAtual.tipo_documento
  );
  const textoExibicao = docPersonalizado?.conteudo_personalizado || docAtual.conteudo_markdown;

  const handleAceitar = async () => {
    if (!concordouTermos || !declarouPoderes) {
      setErro('É obrigatório marcar as duas declarações formais de aceite para prosseguir.');
      return;
    }

    setProcessando(true);
    setErro('');
    setSucessoFeedback('');

    try {
      // Aceita o documento atual
      const res = await fetch(`${API_URL}/api/saas-contratos/aceitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentoVersaoId: docAtual.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.erro || 'Falha ao registrar aceite eletrônico.');
      }

      // Adiciona aos aceitos
      setDocumentosAceitosIds((prev) => [...prev, docAtual.id]);

      // Se houver mais documentos pendentes, avança para o próximo com feedback
      if (documentoAtivoIndex < pendencias.length - 1) {
        const proximoIndex = documentoAtivoIndex + 1;
        setSucessoFeedback(`✅ "${docAtual.titulo.split('—')[0].trim()}" assinado com sucesso! Avançando para o documento ${proximoIndex + 1} de ${pendencias.length}...`);
        
        setTimeout(() => {
          setDocumentoAtivoIndex(proximoIndex);
          setConcordouTermos(false);
          setDeclarouPoderes(false);
          setSucessoFeedback('');
        }, 1200);
      } else {
        // Concluiu todos os aceites
        setTodosAceitosConcluidos(true);
      }
    } catch (err: any) {
      console.error('[ACEITE] Erro ao registrar aceite:', err);
      setErro(err.message || 'Erro de comunicação ao registrar aceite.');
    } finally {
      setProcessando(false);
    }
  };

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text(docAtual.titulo, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Versão: ${docAtual.versao} | Integridade SHA-256: ${docAtual.hash_conteudo_sha256}`, 14, 28);
      doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 38, 196, 38);

      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);

      const splitText = doc.splitTextToSize(textoExibicao.replace(/#/g, '').replace(/\*\*/g, ''), 180);
      doc.text(splitText, 14, 46);

      doc.save(`Contrato_SaaS_Sonatta_${docAtual.tipo_documento}_${docAtual.versao}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o arquivo PDF.');
    }
  };

  // Tela de Conclusão de Todos os Documentos
  if (todosAceitosConcluidos) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-8 text-center shadow-2xl shadow-emerald-950/60 space-y-6">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
            <CheckCircle2 size={44} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Contrato & Termos Formalizados!</h2>
            <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
              Todos os <strong className="text-emerald-400">{pendencias.length} documentos jurídicos</strong> foram aceitos e registrados com sucesso na trilha de auditoria eletrônica.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Lock size={14} />
              <span>Assinatura Digital Válida & Auditada</span>
            </div>
            <p>• Carimbo de data/hora registrado com IP do representante legal.</p>
            <p>• Cópia arquivada disponível para download a qualquer momento no menu <strong>Contrato & Termos SaaS</strong>.</p>
          </div>

          <button
            onClick={onAceiteConcluido}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base transition shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            Acessar o Painel Sonatta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aceite Eletrônico Obrigatório
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  Etapa {documentoAtivoIndex + 1} de {pendencias.length}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {docAtual.titulo}
              </h2>
            </div>
          </div>

          <button
            onClick={handleExportarPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition cursor-pointer"
            title="Baixar via em PDF"
          >
            <Download size={14} />
            Baixar PDF
          </button>
        </div>

        {/* Stepper / Abas dos Documentos Pendentes */}
        {pendencias.length > 1 && (
          <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 gap-2 pt-2 overflow-x-auto">
            {pendencias.map((doc, idx) => {
              const estaAceito = documentosAceitosIds.includes(doc.id);
              const eAtivo = documentoAtivoIndex === idx;

              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    setDocumentoAtivoIndex(idx);
                    setConcordouTermos(false);
                    setDeclarouPoderes(false);
                    setErro('');
                    setSucessoFeedback('');
                  }}
                  className={`px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                    eAtivo
                      ? 'border-emerald-500 text-emerald-400 bg-zinc-800/60 font-semibold'
                      : estaAceito
                      ? 'border-transparent text-emerald-400/80 hover:text-emerald-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {estaAceito ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <FileText size={14} className="shrink-0" />
                  )}
                  {doc.titulo.split('—')[0].trim()} ({doc.versao})
                  {estaAceito && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">Assinado</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback Temporário de Sucesso */}
        {sucessoFeedback && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-200 px-6 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            {sucessoFeedback}
          </div>
        )}

        {/* Informações de Integridade e Snapshot */}
        <div className="px-6 py-2 bg-zinc-950/40 border-b border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-mono">
            <Lock size={12} className="text-emerald-400" />
            <span>SHA-256: <strong className="text-zinc-300">{docAtual.hash_conteudo_sha256.substring(0, 24)}...</strong></span>
          </div>
          <div>
            <span>Versão vigência: <strong className="text-zinc-200">{docAtual.versao}</strong></span>
          </div>
        </div>

        {/* Corpo do Documento (Scroll) */}
        <div className="flex-1 p-6 overflow-y-auto bg-zinc-950/80 text-zinc-200 text-sm leading-relaxed space-y-4 select-text">
          {carregandoDados ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              Carregando minuta contratual parametrizada...
            </div>
          ) : (
            <div className="font-sans text-zinc-300 space-y-2">
              {renderMarkdownContrato(textoExibicao)}
            </div>
          )}
        </div>

        {/* Rodapé e Declarações de Aceite */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/90 flex flex-col gap-4">
          {erro && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-in shake">
              <AlertTriangle size={16} className="shrink-0" />
              {erro}
            </div>
          )}

          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={concordouTermos}
                onChange={(e) => setConcordouTermos(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 group-hover:text-white transition">
                Declaro que <strong>li integralmente e concordo sem reservas</strong> com este documento ({docAtual.titulo}).
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={declarouPoderes}
                onChange={(e) => setDeclarouPoderes(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 group-hover:text-white transition">
                Declaro, sob as penas da lei, possuir <strong>poderes de representação legal e administrativa</strong> da instituição contratante para firmar este aceite.
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Assinatura eletrônica auditada com registro de IP, data/hora e hash de integridade.</span>
            </div>

            <button
              onClick={handleAceitar}
              disabled={processando || !concordouTermos || !declarouPoderes}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                concordouTermos && declarouPoderes && !processando
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/50 cursor-pointer active:scale-98'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              {processando ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Registrando Assinatura...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {documentoAtivoIndex < pendencias.length - 1
                    ? `Assinar Documento (${documentoAtivoIndex + 1} de ${pendencias.length})`
                    : 'Finalizar Aceite e Liberar Sistema'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

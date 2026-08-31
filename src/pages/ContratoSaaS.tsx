import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle, Download, Lock, Calendar, Building, User, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { API_URL } from '../utils/api';
import { jsPDF } from 'jspdf';
import { renderMarkdownContrato } from '../utils/markdownRenderer';

export default function ContratoSaaS() {
  const [contrato, setContrato] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState(0);

  const token = localStorage.getItem('@sonatta:token');

  useEffect(() => {
    carregarContrato();
  }, []);

  const carregarContrato = async () => {
    try {
      setCarregando(true);
      setErro('');
      const res = await fetch(`${API_URL}/api/saas-contratos/meu-contrato`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar contrato da escola.');
      }

      const data = await res.json();
      setContrato(data.data || data);
    } catch (err: any) {
      console.error('Erro ao buscar contrato:', err);
      setErro(err.message || 'Não foi possível carregar os termos contratuais.');
    } finally {
      setCarregando(false);
    }
  };

  const handleExportarPDF = () => {
    if (!contrato || !contrato.documentos || contrato.documentos.length === 0) return;

    try {
      const doc = new jsPDF();
      const docAtual = contrato.documentos[abaAtiva] || contrato.documentos[0];
      const escola = contrato.escola || {};
      const config = contrato.configuracaoFornecedora || {};
      const aceite = docAtual.dados_aceite || {};

      // Cabeçalho
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('SONATTA — GESTÃO PARA ESCOLAS DE MÚSICA', 14, 14);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${docAtual.titulo} (${docAtual.versao})`, 14, 22);
      doc.text(`Hash SHA-256: ${docAtual.hash_conteudo_sha256.substring(0, 32)}...`, 14, 28);

      // Dados das Partes
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('1. DADOS DE IDENTIFICAÇÃO E CONTRATAÇÃO', 14, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Licenciante: ${config.razao_social_fornecedora || 'Sonatta'} (CNPJ: ${config.cnpj_fornecedora || '00.000.000/0001-00'})`, 14, 48);
      doc.text(`Licenciada: ${escola.nome || 'Escola'} (CNPJ/CPF: ${escola.documento || 'Não informado'})`, 14, 54);
      doc.text(`Plano: ${escola.plano || 'SaaS'} | Alunos Ativos: ${escola.qtdAlunosAtivos || 0}`, 14, 60);
      
      if (aceite.aceito_em) {
        doc.setTextColor(16, 185, 129);
        doc.text(`Assinatura Eletrônica Registrada em: ${new Date(aceite.aceito_em).toLocaleString('pt-BR')} | IP: ${aceite.ip_address || '0.0.0.0'}`, 14, 66);
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 70, 196, 70);

      // Texto do Documento
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const textoLimpo = (docAtual.conteudo_personalizado || docAtual.conteudo_markdown)
        .replace(/#/g, '')
        .replace(/\*\*/g, '')
        .replace(/---/g, '');

      const splitText = doc.splitTextToSize(textoLimpo, 180);
      doc.text(splitText, 14, 78);

      doc.save(`Contrato_Sonatta_${(escola.nome || 'Escola').replace(/\s+/g, '_')}_${docAtual.tipo_documento}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF.');
    }
  };

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Carregando documentação contratual do SaaS...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex-1 p-8 bg-zinc-950 text-white flex items-center justify-center">
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-lg text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold">Erro ao Carregar Contrato</h3>
          <p className="text-sm text-zinc-400">{erro}</p>
          <button
            onClick={carregarContrato}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const docs = contrato?.documentos || [];
  const docAtual = docs[abaAtiva] || docs[0];
  const config = contrato?.configuracaoFornecedora || {};
  const escola = contrato?.escola || {};
  const aceite = docAtual?.dados_aceite;

  return (
    <div className="flex-1 p-6 md:p-8 bg-zinc-950 text-zinc-100 overflow-y-auto space-y-6">
      
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Shield size={22} />
            </div>
            <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SaaS B2B Legal Framework
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">
            Contrato SaaS & Termos de Uso
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Instrumento jurídico de licença de software, nível de serviço (SLA) e acordo de tratamento de dados (LGPD).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={carregarContrato}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition"
            title="Atualizar dados"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={handleExportarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Download size={16} />
            Exportar em PDF
          </button>
        </div>
      </div>

      {/* Cards de Status e Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Status do Contrato</span>
            <CheckCircle size={15} className="text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white">
            {docAtual?.aceito ? 'Ativo & Assinado' : 'Pendente de Aceite'}
          </p>
          <p className="text-xs text-zinc-500">
            {docAtual?.aceito ? 'Aceite eletrônico válido' : 'Requer validação formal'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Instituição Contratante</span>
            <Building size={15} className="text-blue-400" />
          </div>
          <p className="text-base font-bold text-white truncate">
            {escola.nome || 'Escola'}
          </p>
          <p className="text-xs text-zinc-500">
            Doc: {escola.documento || 'Não informado'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Plano & SLA</span>
            <Shield size={15} className="text-purple-400" />
          </div>
          <p className="text-base font-bold text-white">
            {escola.plano || 'SaaS'} ({config.sla_meta_percentual}% SLA)
          </p>
          <p className="text-xs text-zinc-500">
            {escola.qtdAlunosAtivos || 0} alunos ativos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Integridade SHA-256</span>
            <Lock size={15} className="text-amber-400" />
          </div>
          <p className="text-xs font-mono text-zinc-300 truncate" title={docAtual?.hash_conteudo_sha256}>
            {docAtual?.hash_conteudo_sha256?.substring(0, 18)}...
          </p>
          <p className="text-xs text-zinc-500">
            Versão {docAtual?.versao}
          </p>
        </div>
      </div>

      {/* Selo de Assinatura Eletrônica */}
      {docAtual?.aceito && aceite && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">
                Assinatura Eletrônica Formalizada & Auditada
              </h4>
              <p className="text-xs text-emerald-400/80">
                Aceito em {new Date(aceite.aceito_em).toLocaleString('pt-BR')} pelo representante IP: <strong className="text-white font-mono">{aceite.ip_address}</strong>
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            Hash Certificado: <span className="text-emerald-400">{docAtual.hash_conteudo_sha256.substring(0, 20)}...</span>
          </div>
        </div>
      )}

      {/* Navegação entre Documentos */}
      <div className="border-b border-zinc-800 bg-zinc-900/40 rounded-t-2xl px-6 pt-3 flex gap-3 overflow-x-auto">
        {docs.map((doc: any, index: number) => (
          <button
            key={doc.id}
            onClick={() => setAbaAtiva(index)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              abaAtiva === index
                ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText size={15} />
            {doc.titulo}
            {doc.aceito && (
              <CheckCircle size={13} className="text-emerald-400 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Visualizador do Documento Formatado */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-b-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 text-xs text-zinc-400">
          <div>
            <span>Documento: <strong className="text-white">{docAtual?.titulo}</strong></span>
            <span className="mx-2">•</span>
            <span>Versão: <strong className="text-zinc-300">{docAtual?.versao}</strong></span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
            Publicado em: {new Date(docAtual?.publicado_em).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="text-sm text-zinc-300 leading-relaxed font-sans select-text space-y-3 bg-zinc-950/40 p-6 rounded-xl border border-zinc-800/40">
          {renderMarkdownContrato(docAtual?.conteudo_personalizado || docAtual?.conteudo_markdown)}
        </div>
      </div>

    </div>
  );
}

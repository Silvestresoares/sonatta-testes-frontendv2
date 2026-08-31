import React from 'react';

/**
 * Função auxiliar que formata trechos de texto em negrito delimitados por **texto**
 */
function formatarNegrito(texto: string): React.ReactNode {
  if (!texto) return '';
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    return parte;
  });
}

/**
 * Renderizador leve de Markdown para exibição elegante e legível de contratos e termos jurídicos.
 * Converte tags (#, ##, ###, **, ---, -) em elementos visuais estilizados, sem exibir símbolos brutos.
 */
export function renderMarkdownContrato(conteudo: string): React.ReactNode {
  if (!conteudo) return null;

  const linhas = conteudo.split('\n');
  const elementos: React.ReactNode[] = [];

  linhas.forEach((linha, index) => {
    const trimmed = linha.trim();

    // Divisória horizontal (---)
    if (trimmed === '---') {
      elementos.push(<hr key={`hr-${index}`} className="my-4 border-zinc-800" />);
      return;
    }

    // Título Principal (# Título)
    if (trimmed.startsWith('# ')) {
      elementos.push(
        <h1 key={`h1-${index}`} className="text-xl font-bold text-white mt-6 mb-3 tracking-tight border-b border-zinc-800 pb-2">
          {formatarNegrito(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      return;
    }

    // Cláusula / Seção Principal (## 1. IDENTIFICAÇÃO...)
    if (trimmed.startsWith('## ')) {
      elementos.push(
        <h2 key={`h2-${index}`} className="text-base font-bold text-emerald-400 mt-5 mb-2 uppercase tracking-wide">
          {formatarNegrito(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }

    // Subcláusula / Subseção (### 1.1 ...)
    if (trimmed.startsWith('### ')) {
      elementos.push(
        <h3 key={`h3-${index}`} className="text-sm font-semibold text-zinc-200 mt-3 mb-1">
          {formatarNegrito(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }

    // Item de Lista (- ...)
    if (trimmed.startsWith('- ')) {
      elementos.push(
        <li key={`li-${index}`} className="ml-4 list-disc text-zinc-300 text-sm my-1 pl-1 leading-relaxed">
          {formatarNegrito(trimmed.replace(/^-\s+/, ''))}
        </li>
      );
      return;
    }

    // Espaçamento para linhas em branco
    if (!trimmed) {
      elementos.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }

    // Parágrafo comum
    elementos.push(
      <p key={`p-${index}`} className="text-sm text-zinc-300 leading-relaxed my-1.5">
        {formatarNegrito(linha)}
      </p>
    );
  });

  return <div className="space-y-1">{elementos}</div>;
}

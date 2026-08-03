import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporta dados para um arquivo CSV (compatível com Excel)
 * @param {Array} dados Array de objetos contendo os dados
 * @param {Array} colunas Array de objetos { header: 'Título', key: 'chave_no_dado' }
 * @param {String} nomeArquivo Nome do arquivo sem extensão
 */
export const exportarParaCSV = (dados, colunas, nomeArquivo) => {
  if (!dados || !dados.length) {
    alert("Não há dados para exportar.");
    return;
  }

  // Monta o cabeçalho
  const titulos = colunas.map(col => `"${col.header}"`).join(';');
  
  // Monta as linhas
  const linhas = dados.map(item => {
    return colunas.map(col => {
      let valor = item[col.key] || '';
      // Se for string, escapa as aspas
      if (typeof valor === 'string') {
        valor = valor.replace(/"/g, '""');
      }
      return `"${valor}"`;
    }).join(';');
  });

  // Junta tudo
  const csvContent = [titulos, ...linhas].join('\n');
  
  // Cria o Blob (BOM \uFEFF para o Excel reconhecer UTF-8 corretamente)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Baixa o arquivo
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Exporta dados para um arquivo PDF usando jsPDF e autotable
 * @param {Array} dados Array de objetos contendo os dados
 * @param {Array} colunas Array de objetos { header: 'Título', key: 'chave_no_dado' }
 * @param {String} titulo Título impresso no topo do PDF
 * @param {String} nomeArquivo Nome do arquivo sem extensão
 */
export const exportarParaPDF = (dados, colunas, titulo, nomeArquivo) => {
  if (!dados || !dados.length) {
    alert("Não há dados para exportar.");
    return;
  }

  const doc = new jsPDF('landscape'); // Orientação paisagem para caber mais colunas
  
  // Título
  doc.setFontSize(18);
  doc.text(titulo, 14, 22);
  
  // Data de geração
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);

  // Mapeia colunas e dados para o autotable
  const head = [colunas.map(col => col.header)];
  const body = dados.map(item => colunas.map(col => item[col.key] || ''));

  // Desenha a tabela
  doc.autoTable({
    startY: 36,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // Salva o PDF
  doc.save(`${nomeArquivo}.pdf`);
};

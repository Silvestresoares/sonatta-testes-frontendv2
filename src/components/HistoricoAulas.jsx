import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Edit2, Download, Printer, Search, Calendar } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3001';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function HistoricoAulas({ aluno_id }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [buscaAnotacoes, setBuscaAnotacoes] = useState('');
  const [ordenacao, setOrdenacao] = useState('desc'); // desc ou asc
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  // Modal de detalhes
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  const carregarRegistros = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token || !aluno_id) return;

    setCarregando(true);
    setErro('');

    try {
      let url = `${API_URL}/api/registros-aula/aluno/${aluno_id}`;
      
      // Adicionar filtros à URL
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      if (statusFiltro) params.append('status_presenca', statusFiltro);
      if (buscaAnotacoes) params.append('buscar_anotacoes', buscaAnotacoes);

      if (params.toString()) {
        url = `${API_URL}/api/registros-aula/filtro/search?aluno_id=${aluno_id}&${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar registros');

      const data = await response.json();
      let registrosOrdenados = data.dados || [];
      
      // Aplicar ordenação
      registrosOrdenados.sort((a, b) => {
        const dataA = new Date(a.data_aula);
        const dataB = new Date(b.data_aula);
        return ordenacao === 'desc' ? dataB - dataA : dataA - dataB;
      });

      setRegistros(registrosOrdenados);
    } catch (erro) {
      console.error('Erro ao carregar registros:', erro);
      setErro('Erro ao carregar histórico de aulas');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRegistros();
  }, [aluno_id, dataInicio, dataFim, statusFiltro, buscaAnotacoes, ordenacao]);

  const handleExcluir = async (registroId) => {
    if (!confirm('Deseja excluir este registro? Esta ação não pode ser desfeita.')) return;

    const token = localStorage.getItem('@sonatta:token');
    
    try {
      const response = await fetch(`${API_URL}/api/registros-aula/${registroId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      setRegistros(prev => prev.filter(r => r.id !== registroId));
      alert('Registro excluído com sucesso!');
    } catch (erro) {
      console.error('Erro:', erro);
      alert('Erro ao excluir registro');
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataCompleta = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Paginação
  const registrosFiltrados = registros;
  const totalPaginas = Math.ceil(registrosFiltrados.length / ITENS_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const registrosPagina = registrosFiltrados.slice(indiceInicio, indiceInicio + ITENS_POR_PAGINA);

  const handleExportarPDF = () => {
    // Simples export para PDF (pode ser expandido com biblioteca como jsPDF)
    let conteudo = `HISTÓRICO DE AULAS\n\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    registrosFiltrados.forEach(r => {
      conteudo += `
Data: ${formatarData(r.data_aula)}
Presença: ${r.status_presenca === 'presente' ? '✓ Presente' : '✗ Ausente'}
Conteúdo: ${r.conteudo_trabalhado || 'N/A'}
Tarefas: ${r.tarefas_casa || 'N/A'}
Anotações: ${r.anotacoes || 'N/A'}
---
`;
    });

    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(conteudo);
    link.download = `historico_aulas_${aluno_id}.txt`;
    link.click();
  };

  const handleImprimir = () => {
    const janela = window.open('', '', 'width=800,height=600');
    let html = `
      <html>
        <head>
          <title>Histórico de Aulas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Histórico de Aulas</h1>
            <p>Data de impressão: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Presença</th>
                <th>Conteúdo</th>
                <th>Tarefas</th>
                <th>Anotações</th>
              </tr>
            </thead>
            <tbody>
    `;

    registrosFiltrados.forEach(r => {
      html += `
        <tr>
          <td>${formatarData(r.data_aula)}</td>
          <td>${r.status_presenca === 'presente' ? '✓ Presente' : '✗ Ausente'}</td>
          <td>${r.conteudo_trabalhado || '-'}</td>
          <td>${r.tarefas_casa || '-'}</td>
          <td>${r.anotacoes || '-'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `;

    janela.document.write(html);
    janela.document.close();
  };

  if (carregando && registros.length === 0) {
    return (
      <div className="p-6 bg-zinc-900 rounded-lg text-center">
        <div className="inline-block p-3 bg-orange-500/10 rounded-lg mb-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-zinc-400">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Filtros e Busca</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data Inicial</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPaginaAtual(1); }}
              className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-600 rounded text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data Final</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPaginaAtual(1); }}
              className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-600 rounded text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Presença</label>
            <select
              value={statusFiltro}
              onChange={(e) => { setStatusFiltro(e.target.value); setPaginaAtual(1); }}
              className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-600 rounded text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ordenação</label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-600 rounded text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="desc">Mais Recentes</option>
              <option value="asc">Mais Antigos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Buscar em Anotações</label>
            <input
              type="text"
              placeholder="Palavra-chave..."
              value={buscaAnotacoes}
              onChange={(e) => { setBuscaAnotacoes(e.target.value); setPaginaAtual(1); }}
              className="w-full px-2 py-1.5 text-sm bg-zinc-900 border border-zinc-600 rounded text-white placeholder-zinc-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleExportarPDF}
            disabled={registros.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={handleImprimir}
            disabled={registros.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Tabela */}
      {erro ? (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
          {erro}
        </div>
      ) : registros.length === 0 ? (
        <div className="p-6 bg-zinc-800 border border-zinc-700 rounded-lg text-center">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400">Nenhum registro de aula encontrado</p>
        </div>
      ) : (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-900/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Presença</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Conteúdo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Anotações</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {registrosPagina.map(registro => (
                    <tr key={registro.id} className="hover:bg-zinc-700/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{formatarData(registro.data_aula)}</div>
                        <div className="text-xs text-zinc-400">{formatarDataCompleta(registro.data_aula)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          registro.status_presenca === 'presente'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {registro.status_presenca === 'presente' ? '✓' : '✗'} 
                          {registro.status_presenca === 'presente' ? 'Presente' : 'Ausente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300 max-w-xs truncate">
                        {registro.conteudo_trabalhado || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300 max-w-xs truncate">
                        {registro.anotacoes || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRegistroSelecionado(registro)}
                            className="p-1.5 hover:bg-blue-500/20 rounded transition text-blue-400"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluir(registro.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ← Anterior
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                  <button
                    key={numero}
                    onClick={() => setPaginaAtual(numero)}
                    className={`w-8 h-8 rounded text-sm transition ${
                      paginaAtual === numero
                        ? 'bg-orange-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {numero}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Próximo →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalhes */}
      {registroSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-lg w-full border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Detalhes do Registro</h3>
              <button
                onClick={() => setRegistroSelecionado(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-400 font-medium">Data</p>
                <p className="text-white">{formatarDataCompleta(registroSelecionado.data_aula)}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Presença</p>
                <p className="text-white">
                  {registroSelecionado.status_presenca === 'presente' ? '✓ Presente' : '✗ Ausente'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Conteúdo Trabalhado</p>
                <p className="text-white whitespace-pre-wrap">{registroSelecionado.conteudo_trabalhado || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Tarefas para Casa</p>
                <p className="text-white whitespace-pre-wrap">{registroSelecionado.tarefas_casa || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Anotações</p>
                <p className="text-white whitespace-pre-wrap">{registroSelecionado.anotacoes || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-medium">Observações</p>
                <p className="text-white whitespace-pre-wrap">{registroSelecionado.observacoes || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-medium text-xs">Registrado em</p>
                <p className="text-zinc-500 text-xs">{formatarData(registroSelecionado.data_criacao)}</p>
              </div>
            </div>

            <button
              onClick={() => setRegistroSelecionado(null)}
              className="w-full mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

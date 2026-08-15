import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { ShoppingCart, Package, Plus, Search, Trash2, Edit, CheckCircle, X } from 'lucide-react';

export default function Lojinha() {
  const [activeTab, setActiveTab] = useState('pdv'); // pdv, estoque
  const [produtos, setProdutos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  // PDV States
  const [carrinho, setCarrinho] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [statusPagamento, setStatusPagamento] = useState('Pago');
  const [searchTerm, setSearchTerm] = useState('');

  // Estoque States
  const [modalProduto, setModalProduto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [formProduto, setFormProduto] = useState({
    nome: '', descricao: '', preco: '', quantidade_estoque: '', categoria: 'Acessórios'
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resProd, resAlunos] = await Promise.all([
        fetch(`${API_URL}/api/lojinha/produtos`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` } }),
        fetch(`${API_URL}/api/alunos`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` } })
      ]);
      if (resProd.ok) setProdutos(await resProd.json());
      if (resAlunos.ok) setAlunos(await resAlunos.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- PDV Funções ---
  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.produto_id === produto.id);
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.quantidade_estoque) {
        alert('Estoque insuficiente!');
        return;
      }
      setCarrinho(carrinho.map(item =>
        item.produto_id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      if (produto.quantidade_estoque <= 0) {
        alert('Produto sem estoque!');
        return;
      }
      setCarrinho([...carrinho, { produto_id: produto.id, nome: produto.nome, preco_unitario: Number(produto.preco), quantidade: 1 }]);
    }
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.produto_id !== produtoId));
  };

  const alterarQuantidade = (produtoId, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.produto_id === produtoId) {
        const produtoOriginal = produtos.find(p => p.id === produtoId);
        const novaQtd = item.quantidade + delta;
        if (novaQtd < 1) return item;
        if (novaQtd > produtoOriginal.quantidade_estoque) {
          alert('Estoque máximo atingido!');
          return item;
        }
        return { ...item, quantidade: novaQtd };
      }
      return item;
    }));
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return alert('O carrinho está vazio!');

    try {
      const response = await fetch(`${API_URL}/api/lojinha/vendas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify({
          aluno_id: alunoSelecionado || null,
          valor_total: totalCarrinho,
          forma_pagamento: formaPagamento,
          status_pagamento: statusPagamento,
          itens: carrinho
        })
      });

      if (!response.ok) throw new Error('Erro ao finalizar venda');

      alert('Venda registrada com sucesso!');
      setCarrinho([]);
      setAlunoSelecionado('');
      carregarDados(); // Recarrega estoque
    } catch (error) {
      alert(error.message);
    }
  };

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- Estoque Funções ---
  const salvarProduto = async (e) => {
    e.preventDefault();
    const url = produtoEditando
      ? `${API_URL}/api/lojinha/produtos/${produtoEditando.id}`
      : `${API_URL}/api/lojinha/produtos`;
    const method = produtoEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify(formProduto)
      });
      if (!res.ok) throw new Error('Erro ao salvar produto');
      setModalProduto(false);
      carregarDados();
    } catch (erro) {
      alert(erro.message);
    }
  };

  const excluirProduto = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      await fetch(`${API_URL}/api/lojinha/produtos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      carregarDados();
    } catch {
      alert('Erro ao excluir');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-amber-500" />
            Lojinha & PDV
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Gerencie produtos e realize vendas.</p>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => setActiveTab('pdv')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pdv' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Caixa (PDV)
          </button>
          <button
            onClick={() => setActiveTab('estoque')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'estoque' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Estoque
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
      ) : activeTab === 'pdv' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Esquerda: Produtos */}
          <div className="lg:w-2/3 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {produtosFiltrados.map(p => (
                <div
                  key={p.id}
                  onClick={() => adicionarAoCarrinho(p)}
                  className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 cursor-pointer transition-all hover:border-amber-500/50 hover:bg-zinc-800/50 ${p.quantidade_estoque <= 0 ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-zinc-800 text-zinc-400 rounded uppercase">{p.categoria}</span>
                    <span className={`text-xs font-bold ${p.quantidade_estoque > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Est: {p.quantidade_estoque}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1 leading-tight line-clamp-2">{p.nome}</h3>
                  <p className="text-amber-400 font-black">R$ {Number(p.preco).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Direita: Carrinho */}
          <div className="lg:w-1/3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2">Carrinho</h2>

              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cliente</label>
                <select
                  value={alunoSelecionado}
                  onChange={e => setAlunoSelecionado(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Venda Avulsa (Não Cadastrado)</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              <div className="space-y-3 min-h-[150px] max-h-[300px] overflow-y-auto mb-4 pr-1">
                {carrinho.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4 text-sm">Nenhum item selecionado</p>
                ) : (
                  carrinho.map(item => (
                    <div key={item.produto_id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-bold text-white truncate">{item.nome}</p>
                        <p className="text-xs text-amber-400">R$ {Number(item.preco_unitario).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => alterarQuantidade(item.produto_id, -1)} className="bg-zinc-800 w-6 h-6 rounded flex items-center justify-center text-white hover:bg-zinc-700">-</button>
                        <span className="text-white text-sm w-4 text-center">{item.quantidade}</span>
                        <button onClick={() => alterarQuantidade(item.produto_id, 1)} className="bg-zinc-800 w-6 h-6 rounded flex items-center justify-center text-white hover:bg-zinc-700">+</button>
                        <button onClick={() => removerDoCarrinho(item.produto_id)} className="ml-1 text-rose-500 hover:text-rose-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Pix', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFormaPagamento(f)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold border transition-colors ${formaPagamento === f ? 'bg-amber-600 border-amber-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 border-t border-zinc-800 pt-4">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Status do Pagamento</label>
                <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                  <button
                    onClick={() => setStatusPagamento('Pago')}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${statusPagamento === 'Pago' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Pago Agora
                  </button>
                  <button
                    onClick={() => setStatusPagamento('Pendente')}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${statusPagamento === 'Pendente' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Pendente
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-zinc-400">Total a Pagar</span>
                  <span className="text-3xl font-black text-white">R$ {totalCarrinho.toFixed(2)}</span>
                </div>

                <button
                  onClick={finalizarVenda}
                  disabled={carrinho.length === 0}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle size={20} />
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Aba Estoque
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setProdutoEditando(null);
                setFormProduto({ nome: '', descricao: '', preco: '', quantidade_estoque: '', categoria: 'Acessórios' });
                setModalProduto(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Novo Produto
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 text-sm">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Categoria</th>
                    <th className="p-4 font-medium text-right">Preço</th>
                    <th className="p-4 font-medium text-right">Estoque</th>
                    <th className="p-4 font-medium text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm">
                  {produtos.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-zinc-500">Nenhum produto cadastrado</td></tr>}
                  {produtos.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-800/20">
                      <td className="p-4">
                        <p className="font-bold text-white">{p.nome}</p>
                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">{p.descricao}</p>
                      </td>
                      <td className="p-4 text-zinc-300">{p.categoria}</td>
                      <td className="p-4 text-right font-medium text-emerald-400">R$ {Number(p.preco).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded font-bold ${p.quantidade_estoque > 5 ? 'bg-emerald-500/10 text-emerald-400' : p.quantidade_estoque > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {p.quantidade_estoque}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setProdutoEditando(p); setFormProduto(p); setModalProduto(true); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"><Edit size={16} /></button>
                          <button onClick={() => excluirProduto(p.id)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-zinc-700 rounded"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Produto */}
      {modalProduto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="text-amber-500" />
                {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setModalProduto(false)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={salvarProduto} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome</label>
                <input required type="text" value={formProduto.nome} onChange={e => setFormProduto({ ...formProduto, nome: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Categoria</label>
                <select value={formProduto.categoria} onChange={e => setFormProduto({ ...formProduto, categoria: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none">
                  <option value="Acessórios">Acessórios</option>
                  <option value="Livros/Métodos">Livros / Métodos</option>
                  <option value="Instrumentos">Instrumentos</option>
                  <option value="Vestuário">Vestuário (Camisetas)</option>
                  <option value="Snack Bar">Snack Bar (Comidas/Bebidas)</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preço (R$)</label>
                  <input required type="number" step="0.01" min="0" value={formProduto.preco} onChange={e => setFormProduto({ ...formProduto, preco: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Estoque</label>
                  <input required type="number" min="0" value={formProduto.quantidade_estoque} onChange={e => setFormProduto({ ...formProduto, quantidade_estoque: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                <textarea value={formProduto.descricao} onChange={e => setFormProduto({ ...formProduto, descricao: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none h-20 resize-none"></textarea>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors">
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

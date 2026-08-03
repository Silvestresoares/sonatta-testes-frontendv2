import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Eye, Edit, Trash2 } from 'lucide-react';


import { API_URL } from '../utils/api';
export default function Responsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [idSendoEditado, setIdSendoEditado] = useState(null);
  const [visualizarResponsavel, setVisualizarResponsavel] = useState(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  const carregarResponsaveis = async () => {
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    try {
      const resposta = await fetch(`${API_URL}/api/responsaveis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setResponsaveis(dados || []);
      }
    } catch (erro) {
      console.error("Erro ao buscar responsáveis:", erro);
    }
  };

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  const resetarFormulario = () => {
    setNome('');
    setCpf('');
    setEmail('');
    setTelefone('');
    setEndereco('');
    setCidade('');
    setEstado('');
    setCep('');
    setIdSendoEditado(null);
  };

  const handleAbrirModalCadastro = () => {
    resetarFormulario();
    setModalAberto(true);
  };

  const handleAbrirModalEdicao = (responsavel) => {
    setIdSendoEditado(responsavel.id);
    setNome(responsavel.nome || '');
    setCpf(responsavel.cpf || '');
    setEmail(responsavel.email || '');
    setTelefone(responsavel.telefone || '');
    setEndereco(responsavel.endereco || '');
    setCidade(responsavel.cidade || '');
    setEstado(responsavel.estado || '');
    setCep(responsavel.cep || '');
    setModalAberto(true);
  };

  const buscarCep = async (cepBuscado) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEndereco(data.logradouro ? `${data.logradouro}, ` : endereco);
        setCidade(data.localidade || cidade);
        setEstado(data.uf || estado);
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e);
    }
  };

  const salvarResponsavel = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('@sonatta:token');
    if (!token) return;

    const payload = { nome, cpf, email, telefone, endereco, cidade, estado, cep };
    const metodo = idSendoEditado ? 'PUT' : 'POST';
    const url = idSendoEditado ? `${API_URL}/api/responsaveis/${idSendoEditado}` : `${API_URL}/api/responsaveis`;

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (resposta.ok) {
        alert(`Responsável ${idSendoEditado ? 'atualizado' : 'cadastrado'} com sucesso!`);
        setModalAberto(false);
        carregarResponsaveis();
      } else {
        const erro = await resposta.json();
        alert(erro.erro || 'Erro ao salvar responsável');
      }
    } catch (erro) {
      console.error(erro);
      alert('Erro interno ao salvar responsável');
    }
  };

  const handleDeletar = async (id, nomeResponsavel) => {
    if (!window.confirm(`Tem certeza que deseja excluir o responsável "${nomeResponsavel}"? Esta ação não pode ser desfeita.`)) return;

    const token = localStorage.getItem('@sonatta:token');
    try {
      const resposta = await fetch(`${API_URL}/api/responsaveis/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resposta.ok) {
        carregarResponsaveis();
      } else {
        const erro = await resposta.json();
        alert(erro.erro || 'Erro ao excluir responsável');
      }
    } catch (erro) {
      console.error(erro);
      alert('Erro interno ao excluir responsável');
    }
  };

  const responsaveisFiltrados = responsaveis.filter(r => 
    r.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    r.cpf?.includes(busca)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Responsáveis Financeiros</h1>
          <p className="text-zinc-400 text-sm">Gerencie os pais ou responsáveis pelos alunos</p>
        </div>
        <button
          onClick={handleAbrirModalCadastro}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <PlusCircle size={20} />
          <span>Novo Responsável</span>
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Buscar responsável por nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white px-10 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table role="table" aria-label="Tabela de dados" className="w-full text-left border-collapse">
            <thead className="bg-zinc-950/50 text-zinc-400 text-sm sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="p-4 font-medium border-b border-zinc-800">Nome</th>
                <th className="p-4 font-medium border-b border-zinc-800">CPF</th>
                <th className="p-4 font-medium border-b border-zinc-800">Telefone</th>
                <th className="p-4 font-medium border-b border-zinc-800">Email</th>
                <th className="p-4 font-medium border-b border-zinc-800 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {responsaveisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500">
                    Nenhum responsável encontrado.
                  </td>
                </tr>
              ) : (
                responsaveisFiltrados.map((resp) => (
                  <tr key={resp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-medium text-white">{resp.nome}</td>
                    <td className="p-4 text-zinc-300">{resp.cpf || '-'}</td>
                    <td className="p-4 text-zinc-300">{resp.telefone || '-'}</td>
                    <td className="p-4 text-zinc-300">{resp.email || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const telefoneZap = (resp.telefone || '').replace(/\D/g, '');
                            if (telefoneZap.length >= 10) {
                              window.open(`https://wa.me/55${telefoneZap}`, '_blank');
                            } else {
                              alert('O responsável não possui um número de telefone válido cadastrado.');
                            }
                          }}
                          className="text-[#25D366] hover:text-[#20bd5a] p-2 rounded transition-all cursor-pointer hover:bg-[#25D366]/10"
                          title="Contatar via WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        </button>
                        <button
                          onClick={() => setVisualizarResponsavel(resp)}
                          className="text-emerald-400 hover:text-emerald-300 p-2 rounded transition-all cursor-pointer hover:bg-emerald-500/10"
                          title="Visualizar Responsável"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleAbrirModalEdicao(resp)}
                          className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10"
                          title="Editar Responsável"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletar(resp.id, resp.nome)}
                          className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10"
                          title="Excluir Responsável"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edição/Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">
                {idSendoEditado ? 'Editar Responsável' : 'Novo Responsável'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="responsavelForm" onSubmit={salvarResponsavel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Nome Completo *</label>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">CPF</label>
                    <input 
                      type="text" 
                      maxLength={14}
                      value={cpf} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        val = val.replace(/(\d{3})(\d)/, '$1.$2');
                        val = val.replace(/(\d{3})(\d)/, '$1.$2');
                        val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                        setCpf(val);
                      }} 
                      className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Telefone / WhatsApp</label>
                    <input 
                      type="text" 
                      maxLength={15}
                      value={telefone} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        val = val.replace(/^(\d{2})(\d)/g, '($1) $2');
                        val = val.replace(/(\d)(\d{4})$/, '$1-$2');
                        setTelefone(val);
                      }} 
                      className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-1">E-mail</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Endereço Completo</label>
                    <input type="text" placeholder="Rua, Número, Bairro" value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">CEP</label>
                    <input 
                      type="text" 
                      placeholder="00000-000" 
                      maxLength={9}
                      value={cep} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
                        setCep(val);
                        if (val.replace(/\D/g, '').length === 8) buscarCep(val);
                      }}
                      onBlur={(e) => buscarCep(e.target.value)} 
                      className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Cidade</label>
                    <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Estado</label>
                    <input type="text" placeholder="SP" maxLength={2} value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} className="w-full bg-zinc-950 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" form="responsavelForm" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">
                {idSendoEditado ? 'Salvar Alterações' : 'Cadastrar Responsável'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualização */}
      {visualizarResponsavel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setVisualizarResponsavel(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Ficha do Responsável</h2>
              <button onClick={() => setVisualizarResponsavel(null)} className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Nome Completo</p>
                <p className="text-white text-lg font-medium">{visualizarResponsavel.nome}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">CPF</p>
                  <p className="text-zinc-300">{visualizarResponsavel.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Telefone</p>
                  <p className="text-zinc-300">{visualizarResponsavel.telefone || 'Não informado'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">E-mail</p>
                <p className="text-zinc-300">{visualizarResponsavel.email || 'Não informado'}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Alunos Vinculados</p>
                {visualizarResponsavel.alunos && visualizarResponsavel.alunos.length > 0 ? (
                  <ul className="space-y-2">
                    {visualizarResponsavel.alunos.map(aluno => (
                      <li key={aluno.id} className="flex items-center justify-between bg-zinc-800/50 px-3 py-2 rounded-lg">
                        <span className="text-white text-sm font-medium">{aluno.nome}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${aluno.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                          {aluno.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-500 text-sm italic">Nenhum aluno vinculado a este responsável.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-between shrink-0">
                <button
                  onClick={() => {
                    const resp = visualizarResponsavel;
                    setVisualizarResponsavel(null);
                    handleAbrirModalEdicao(resp);
                  }}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
                >
                  <Edit size={16} /> Editar
                </button>
              <button onClick={() => setVisualizarResponsavel(null)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout';
import { useNavigate } from 'react-router-dom';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function DashboardPortal() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  
  // Estados para troca de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');

  const token = localStorage.getItem('@sonatta:portal_token');

  useEffect(() => {
    if (!token) {
      navigate('/portal/login');
      return;
    }
    carregarPerfil();
  }, [token, navigate]);

  useEffect(() => {
    if (dados?.tipo_usuario === 'aluno') {
      carregarAgendaEFinanceiro(dados.usuario.id);
    } else if (dados?.tipo_usuario === 'responsavel' && alunoSelecionado) {
      carregarAgendaEFinanceiro(alunoSelecionado);
    }
  }, [dados, alunoSelecionado]);

  const carregarPerfil = async () => {
    try {
      const res = await fetch(`${API_URL}/api/portal/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) navigate('/portal/login');
        throw new Error('Erro ao carregar perfil');
      }
      const data = await res.json();
      setDados(data);
      if (data.tipo_usuario === 'responsavel' && data.dependentes.length > 0) {
        setAlunoSelecionado(data.dependentes[0].id);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const carregarAgendaEFinanceiro = async (id) => {
    try {
      // Agenda
      const resAgenda = await fetch(`${API_URL}/api/portal/agenda?aluno_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAgenda.ok) {
        setAgenda(await resAgenda.json());
      }

      // Financeiro
      const resFin = await fetch(`${API_URL}/api/portal/financeiro?aluno_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resFin.ok) {
        setFinanceiro(await resFin.json());
      } else {
        setFinanceiro([]);
      }

      // Materiais
      const resMat = await fetch(`${API_URL}/api/portal/materiais?aluno_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMat.ok) {
        setMateriais(await resMat.json());
      } else {
        setMateriais([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setMensagemSenha('');
    try {
      const res = await fetch(`${API_URL}/api/portal/trocar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao trocar senha');
      setMensagemSenha('Senha atualizada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err) {
      setMensagemSenha(err.message);
    }
  };

  if (carregando) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-400">Carregando...</div>
        </div>
      </PortalLayout>
    );
  }

  const ehResponsavel = dados?.tipo_usuario === 'responsavel';

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        
        {ehResponsavel && dados.dependentes.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div className="text-zinc-400 font-medium text-sm">Visualizando dados de:</div>
            <select
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              {dados.dependentes.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Coluna 1: Agenda */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-emerald-900/20 border-b border-zinc-800 p-4 flex items-center gap-3">
                <Calendar className="text-emerald-400" size={24} />
                <h3 className="text-lg font-bold text-white">Cronograma de Aulas</h3>
              </div>
              <div className="p-4">
                {agenda.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhuma turma encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {agenda.map((turma, idx) => (
                      <div key={idx} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 hover:border-emerald-500/30 transition-colors">
                        <div className="font-medium text-emerald-400 mb-1">{turma.curso_nome} - {turma.turma_nome}</div>
                        <div className="text-sm text-zinc-300 flex items-center gap-2">
                          <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{turma.dia_semana}</span>
                          <span>{turma.horario_inicio} às {turma.horario_fim}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-2">Prof. {turma.professor_nome}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Troca de Senha */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="border-b border-zinc-800 p-4 flex items-center gap-3">
                <User className="text-zinc-400" size={20} />
                <h3 className="text-base font-bold text-white">Meus Dados / Senha</h3>
              </div>
              <form onSubmit={handleTrocarSenha} className="p-4 space-y-4">
                {mensagemSenha && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${mensagemSenha.includes('sucesso') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {mensagemSenha}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full">
                  Atualizar Senha
                </button>
              </form>
            </div>
          </div>

          {/* Coluna 2: Financeiro e Materiais */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg h-fit">
              <div className="bg-emerald-900/20 border-b border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-emerald-400" size={24} />
                  <h3 className="text-lg font-bold text-white">Financeiro</h3>
                </div>
              </div>
            
            <div className="p-4">
              {!ehResponsavel && dados?.usuario?.responsavel_id ? (
                <div className="text-center py-10 px-4">
                  <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                    <User className="text-zinc-400" size={24} />
                  </div>
                  <p className="text-zinc-300 font-medium">Gestão Financeira</p>
                  <p className="text-zinc-500 text-sm mt-1">O financeiro é gerido pelo seu Responsável Financeiro.</p>
                </div>
              ) : financeiro.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">Nenhum registro financeiro encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {financeiro.map((item) => (
                    <div key={item.id} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                      <div>
                        <div className="font-medium text-zinc-200">{item.descricao}</div>
                        <div className="text-xs text-zinc-500 mt-1">Vencimento: {new Date(item.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <div className="text-lg font-bold text-white">
                          R$ {Number(item.valor).toFixed(2).replace('.', ',')}
                        </div>
                        {item.status === 'Pago' ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                            <CheckCircle2 size={12} /> Pago
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                            <AlertCircle size={12} /> Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Materiais Didáticos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg h-fit mt-6">
              <div className="bg-teal-900/20 border-b border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="text-teal-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <h3 className="text-lg font-bold text-white">Materiais Didáticos</h3>
                </div>
              </div>
              
              <div className="p-4">
                {materiais.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhum material disponível no momento.</p>
                ) : (
                  <div className="space-y-3">
                    {materiais.map((item) => (
                      <div key={item.id} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                        <div>
                          <div className="font-medium text-zinc-200">{item.nome}</div>
                          {item.descricao && <div className="text-xs text-zinc-500 mt-1 max-w-xs truncate">{item.descricao}</div>}
                          {item.professor_nome && <div className="text-xs text-teal-500/80 mt-1">Por: {item.professor_nome}</div>}
                        </div>
                        
                        <div className="flex-shrink-0">
                          <a 
                            href={`${API_URL}/uploads/${item.caminho_arquivo}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Baixar
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

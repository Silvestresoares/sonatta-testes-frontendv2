import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../../utils/pixPayload';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const getStatusInfo = (item) => {
  if (item.status === 'Pago') {
    return { text: 'Pago', colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
  }
  
  if (!item.data_vencimento) {
    return { text: 'Pendente', colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
  }

  const vencimentoDate = new Date(item.data_vencimento);
  vencimentoDate.setUTCHours(0,0,0,0);
  
  const hojeUTC = new Date();
  hojeUTC.setUTCHours(0,0,0,0);

  const diffTime = vencimentoDate.getTime() - hojeUTC.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Vencido', colorClass: 'text-rose-400 bg-rose-400/10 border-rose-400/20' };
  } else if (diffDays === 0) {
    return { text: 'Vence Hoje', colorClass: 'text-orange-400 bg-orange-400/10 border-orange-400/20' };
  } else if (diffDays <= 3) {
    return { text: `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`, colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
  } else {
    return { hidden: true };
  }
};

export default function DashboardPortal() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(''); // eslint-disable-line no-unused-vars
  
  // Estados para troca de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');
  
  // Estado para Modal do Pix
  const [faturaPix, setFaturaPix] = useState(null);

  const token = localStorage.getItem('@sonatta:portal_token');

  useEffect(() => {
    if (!token) {
      navigate('/portal/login');
      return;
    }
    carregarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  useEffect(() => {
    if (dados?.tipo_usuario === 'aluno') {
      carregarAgendaEFinanceiro(dados.usuario.id);
    } else if (dados?.tipo_usuario === 'responsavel' && alunoSelecionado) {
      carregarAgendaEFinanceiro(alunoSelecionado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Registros Pedagógicos
      const resRegistros = await fetch(`${API_URL}/api/portal/registros-aula?aluno_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRegistros.ok) {
        setRegistros(await resRegistros.json());
      } else {
        setRegistros([]);
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
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhuma aula encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {agenda.map((turma, idx) => (
                      <div key={idx} className={`bg-zinc-950/50 border ${turma.tipo === 'regular' ? 'border-blue-500/20' : 'border-zinc-800'} rounded-xl p-4 hover:border-emerald-500/30 transition-colors`}>
                        <div className={`font-medium mb-1 ${turma.tipo === 'regular' ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {turma.curso_nome} {turma.tipo === 'regular' ? '' : `- ${turma.turma_nome}`}
                        </div>
                        <div className="text-sm text-zinc-300 flex items-center gap-2">
                          <span className={`${turma.tipo === 'regular' ? 'bg-blue-900/30 text-blue-300' : 'bg-zinc-800'} px-2 py-1 rounded text-xs`}>
                            {turma.dia_semana}
                          </span>
                          <span>{turma.horario_inicio} às {turma.horario_fim}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-2">Prof. {turma.professor_nome}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Registros Pedagógicos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-blue-900/20 border-b border-zinc-800 p-4 flex items-center gap-3">
                <BookOpen className="text-blue-400" size={24} />
                <h3 className="text-lg font-bold text-white">Registros de Aula</h3>
              </div>
              <div className="p-4">
                {registros.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhum registro de aula recente.</p>
                ) : (
                  <div className="space-y-4">
                    {registros.map((reg, idx) => (
                      <div key={idx} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 relative overflow-hidden group hover:border-zinc-700 transition-all">
                        {/* Indicador de Status */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          reg.status_presenca === 'presente' ? 'bg-emerald-500' :
                          reg.status_presenca === 'cancelada' ? 'bg-red-500' :
                          reg.status_presenca === 'reagendada' ? 'bg-blue-500' :
                          'bg-amber-500' // Falta
                        }`}></div>
                        
                        <div className="pl-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                                {new Date(reg.data_aula).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </div>
                              <div className="text-sm font-medium text-white">{reg.turma_nome ? `Turma: ${reg.turma_nome}` : 'Aula Individual'}</div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${
                              reg.status_presenca === 'presente' ? 'bg-emerald-500/10 text-emerald-400' :
                              reg.status_presenca === 'cancelada' ? 'bg-red-500/10 text-red-400' :
                              reg.status_presenca === 'reagendada' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {reg.status_presenca === 'falta_aluno_aviso' ? 'Falta (C/ Av.)' : 
                               reg.status_presenca === 'falta_aluno_sem_aviso' ? 'Falta (S/ Av.)' : 
                               reg.status_presenca || 'Registrado'}
                            </span>
                          </div>

                          {reg.conteudo_trabalhado && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-zinc-400 mb-1">Conteúdo Trabalhado:</p>
                              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                {reg.conteudo_trabalhado}
                              </p>
                            </div>
                          )}

                          {reg.tarefas_casa && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-amber-400/80 mb-1 flex items-center gap-1">
                                <span>📝</span> Tarefa de Casa:
                              </p>
                              <p className="text-sm text-amber-100/70 whitespace-pre-wrap leading-relaxed bg-amber-900/10 p-3 rounded-lg border border-amber-500/20">
                                {reg.tarefas_casa}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 text-xs text-zinc-500 flex items-center gap-1 border-t border-zinc-800 pt-2">
                            <User size={12} /> Prof. {reg.professor_nome}
                          </div>
                        </div>
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
                          <span className={`flex items-center gap-1 text-xs font-medium border px-2 py-1 rounded ${getStatusInfo(item).colorClass}`}>
                            <CheckCircle2 size={12} /> {getStatusInfo(item).text}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 items-end">
                            {!getStatusInfo(item).hidden && (
                              <span className={`flex items-center gap-1 text-xs font-medium border px-2 py-1 rounded ${getStatusInfo(item).colorClass}`}>
                                <AlertCircle size={12} /> {getStatusInfo(item).text}
                              </span>
                            )}
                            {item.asaas_invoice_url && (
                              <a 
                                href={item.asaas_invoice_url}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors text-center w-full mt-1"
                              >
                                Pagar (Boleto/Pix)
                              </a>
                            )}
                            {dados?.escola?.chave_pix && (
                              <button 
                                onClick={() => setFaturaPix({
                                  ...item, 
                                  payload: generatePixPayload({
                                    chave: dados.escola.chave_pix,
                                    nome: dados.escola.titular_pix || dados.escola.nome_escola,
                                    cidade: dados.escola.cidade_pix || 'Brasil',
                                    valor: item.valor
                                  })
                                })}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors text-center w-full mt-1"
                              >
                                Pagar (Pix Direto)
                              </button>
                            )}
                          </div>
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

      {faturaPix && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="text-emerald-500" />
                Pagamento via Pix
              </h2>
              <button onClick={() => setFaturaPix(null)} className="text-zinc-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar text-center flex-1">
              <p className="text-zinc-300 font-medium mb-1">{faturaPix.descricao}</p>
              <p className="text-2xl font-black text-white mb-6">
                R$ {Number(faturaPix.valor).toFixed(2).replace('.', ',')}
              </p>

              <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-inner">
                <QRCodeSVG value={faturaPix.payload} size={200} />
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-left mb-6">
                <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Pix Copia e Cola</p>
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    readOnly 
                    value={faturaPix.payload}
                    className="flex-1 bg-transparent border-none text-zinc-300 text-sm focus:outline-none truncate"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(faturaPix.payload);
                      alert('Código Pix copiado!');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium text-sm px-2 py-1 bg-emerald-400/10 rounded transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <p className="text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20 text-left mb-4">
                <AlertCircle size={16} className="inline mr-1 mb-1" />
                Após realizar o pagamento, é obrigatório enviar o comprovante para a secretaria para que a baixa seja realizada.
              </p>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
              <a 
                href={`https://wa.me/${dados?.escola?.telefone_comercial?.replace(/\D/g, '')}?text=Olá! Acabei de realizar o pagamento via Pix Direto da fatura: ${faturaPix.descricao} no valor de R$ ${Number(faturaPix.valor).toFixed(2).replace('.', ',')}. Segue o comprovante:`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                onClick={() => setFaturaPix(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Enviar Comprovante (WhatsApp)
              </a>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, CheckCircle2, AlertCircle, BookOpen, Headphones, FileAudio, FileImage, FileText, Download, Folder } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../../utils/pixPayload';


import { API_URL } from '../../utils/api';
const getStatusInfo = (item) => {
  if (item.status === 'Pago') {
    return { text: 'Pago', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  }

  if (!item.data_vencimento) {
    return { text: 'Pendente', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  }

  const vencimentoDate = new Date(item.data_vencimento);
  vencimentoDate.setUTCHours(0, 0, 0, 0);

  const hojeUTC = new Date();
  hojeUTC.setUTCHours(0, 0, 0, 0);

  const diffTime = vencimentoDate.getTime() - hojeUTC.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Vencido', colorClass: 'text-rose-400 bg-rose-500/20 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse' };
  } else if (diffDays === 0) {
    return { text: 'Vence Hoje', colorClass: 'text-orange-400 bg-orange-500/20 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse' };
  } else if (diffDays <= 3) {
    return { text: `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`, colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
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
  const [modalRegistrosAberto, setModalRegistrosAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(''); // eslint-disable-line no-unused-vars

  // Estados do Contrato
  const [contratoPendente, setContratoPendente] = useState(false);
  const [dadosContrato, setDadosContrato] = useState(null);
  const [cpfAssinatura, setCpfAssinatura] = useState('');
  const [assinandoContrato, setAssinandoContrato] = useState(false);
  const [erroContrato, setErroContrato] = useState('');

  const getFileIcon = (tipo) => {
    if (!tipo) return <FileText size={18} className="text-teal-400" />;
    if (tipo.includes('audio')) return <Headphones size={18} className="text-purple-400" />;
    if (tipo.includes('image')) return <FileImage size={18} className="text-blue-400" />;
    if (tipo.includes('pdf')) return <FileText size={18} className="text-rose-400" />;
    return <FileText size={18} className="text-teal-400" />;
  }; // eslint-disable-line no-unused-vars

  // Estado para Modal do Pix
  const [faturaPix, setFaturaPix] = useState(null);

  // Estados para Aviso de Aula do Dia
  const [modalAvisoAulaAberto, setModalAvisoAulaAberto] = useState(false);
  const [aulasHoje, setAulasHoje] = useState([]);

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
    if (agenda && agenda.length > 0 && dados) {
      const diasDaSemanaPT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diaDeHojeNome = diasDaSemanaPT[new Date().getDay()];

      const hojeAulas = agenda.filter(turma => {
        if (!turma.dia_semana) return false;
        // Normaliza strings, removendo "-feira" e acentos, se necessário (ou só "-feira")
        const diaTurma = turma.dia_semana.toLowerCase().replace('-feira', '').trim();
        const diaHoje = diaDeHojeNome.toLowerCase();
        return diaTurma === diaHoje || diaTurma.includes(diaHoje) || diaHoje.includes(diaTurma);
      });

      if (hojeAulas.length > 0) {
        setAulasHoje(hojeAulas);

        // Verifica no localStorage se já viu hoje
        const dataHojeStr = new Date().toISOString().split('T')[0];
        const userId = dados.usuario?.id || 'aluno';
        const keyVisto = `@sonatta:aviso_aula_visto_${userId}_${dataHojeStr}`;
        const jaVisto = localStorage.getItem(keyVisto);

        if (!jaVisto) {
          setModalAvisoAulaAberto(true);
        }
      }
    }
  }, [agenda, dados]);

  const fecharAvisoAula = () => {
    const dataHojeStr = new Date().toISOString().split('T')[0];
    const userId = dados?.usuario?.id || 'aluno';
    const keyVisto = `@sonatta:aviso_aula_visto_${userId}_${dataHojeStr}`;
    localStorage.setItem(keyVisto, 'true');
    setModalAvisoAulaAberto(false);
  };

  useEffect(() => {
    if (dados?.tipo_usuario === 'aluno') {
      carregarAgendaEFinanceiro(dados.usuario.id);
      verificarContrato(dados.usuario.id);
    } else if (dados?.tipo_usuario === 'responsavel' && alunoSelecionado) {
      carregarAgendaEFinanceiro(alunoSelecionado);
      verificarContrato(alunoSelecionado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, alunoSelecionado]);

  const verificarContrato = async (alunoId) => {
    try {
      const res = await fetch(`${API_URL}/api/contratos/meus-contratos/pendencias?alunoId=${alunoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exigeAssinatura) {
          setContratoPendente(true);
          setDadosContrato(data);
        } else {
          setContratoPendente(false);
          setDadosContrato(null);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar contrato:', err);
    }
  };

  const assinarContrato = async () => {
    if (!cpfAssinatura || cpfAssinatura.length < 11) {
      setErroContrato('Digite um CPF válido.');
      return;
    }
    setAssinandoContrato(true);
    setErroContrato('');
    try {
      const payload = {
        cpf: cpfAssinatura,
        alunoId: dadosContrato?.alunoId || alunoSelecionado || dados?.usuario?.id,
        textoContrato: dadosContrato?.textoContrato
      };
      const res = await fetch(`${API_URL}/api/contratos/assinar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        alert('Contrato assinado com sucesso!');
        setContratoPendente(false);
        setDadosContrato(null);
      } else {
        setErroContrato(result.erro || 'Erro ao assinar o contrato.');
      }
    } catch (err) {
      setErroContrato('Falha na comunicação com o servidor.');
    } finally {
      setAssinandoContrato(false);
    }
  };

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

  if (carregando) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-400">Carregando...</div>
        </div>
      </PortalLayout>
    );
  }

  // Se o contrato estiver pendente, bloqueia toda a tela com o modal
  if (contratoPendente && dadosContrato) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col shadow-2xl max-h-screen overflow-hidden">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-full">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Assinatura Eletrônica de Contrato</h2>
              <p className="text-zinc-400">Leia atentamente os termos abaixo para liberar o acesso ao sistema.</p>
            </div>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex-1 overflow-y-auto mb-6 text-sm text-zinc-300 leading-relaxed custom-scrollbar whitespace-pre-wrap">
            {dadosContrato.textoContrato}
          </div>

          <div className="shrink-0 space-y-4">
            <p className="text-xs text-zinc-500">
              Ao assinar digitalmente, o sistema registrará seu Endereço IP ({new Date().toLocaleDateString('pt-BR')}), juntamente com o CPF fornecido abaixo, gerando uma assinatura com plena validade legal.
            </p>
            {erroContrato && <p className="text-rose-400 text-sm font-semibold">{erroContrato}</p>}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">Seu CPF (Assinante)</label>
                <input
                  type="text"
                  value={cpfAssinatura}
                  onChange={(e) => setCpfAssinatura(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  placeholder="Apenas números..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                onClick={assinarContrato}
                disabled={assinandoContrato || cpfAssinatura.length < 11}
                className="w-full sm:w-1/2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                {assinandoContrato ? 'Assinando...' : 'Li, Concordo e Assino'}
              </button>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('@sonatta:portal_token');
                window.location.href = '/portal/login';
              }} 
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Sair do Sistema (Não aceitar)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ehResponsavel = dados?.tipo_usuario === 'responsavel';

  const hojeUtcString = new Date().toISOString().split('T')[0];
  const registrosHoje = registros.filter(reg => {
    const dataAulaStr = typeof reg.data_aula === 'string' ? reg.data_aula.substring(0, 10) : new Date(reg.data_aula).toISOString().split('T')[0];
    return dataAulaStr === hojeUtcString;
  });

  const RegistroCard = ({ reg, idx }) => (
    <div key={idx} className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-4 relative overflow-hidden group hover:border-white/10 transition-all shadow-inner">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${reg.status_presenca === 'presente' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
        reg.status_presenca === 'cancelada' ? 'bg-red-500' :
          reg.status_presenca === 'reagendada' ? 'bg-blue-500' :
            'bg-amber-500'
        }`}></div>

      <div className="pl-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
              {new Date(reg.data_aula).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
            <div className="text-sm font-medium text-white">{reg.turma_nome ? `Turma: ${reg.turma_nome}` : 'Aula Individual'}</div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${reg.status_presenca === 'presente' ? 'bg-emerald-500/10 text-emerald-400' :
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
  );

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return { texto: 'Bom dia', icone: '☀️', sub: 'Pronto para tirar um som hoje?' };
    if (hora < 18) return { texto: 'Boa tarde', icone: '🌤️', sub: 'Uma ótima tarde de muita música para você!' };
    return { texto: 'Boa noite', icone: '🌙', sub: 'Que tal relaxar praticando o que aprendeu?' };
  };
  const saudacao = getSaudacao();



  const nomeExibicao = dados?.usuario?.nome ? dados.usuario.nome.split(' ')[0] : 'Aluno';

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12 animate-in fade-in duration-500">

        {/* Header Motivacional Dinâmico */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          {/* Brilho decorativo no fundo do card */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl animate-bounce">{saudacao.icone}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {saudacao.texto}, <span className="text-emerald-400">{nomeExibicao}!</span>
              </h1>
            </div>
            <p className="text-zinc-300 text-lg">{saudacao.sub}</p>
          </div>

          {agenda && agenda.length > 0 && (
            <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[280px] md:max-h-40 overflow-y-auto custom-scrollbar pr-2 mt-4 md:mt-0 relative z-10">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-left mb-1">Próxima(s) Aula(s)</p>
              {agenda.map((turma, idx) => (
                <div key={idx} className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex items-center gap-3 hover:bg-black/40 transition-colors">
                  <div className="bg-emerald-500/20 p-2.5 rounded-full text-emerald-400 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm leading-tight">{turma.curso_nome} {turma.tipo === 'regular' ? '' : <span className="text-zinc-400 font-normal">({turma.turma_nome})</span>}</p>
                    <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-1">
                      <span>{turma.dia_semana}, {turma.horario_inicio} - {turma.horario_fim}</span>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1 text-emerald-500/80"><User size={10} /> Prof. {turma.professor_nome}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {ehResponsavel && dados.dependentes.length > 0 && (
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="text-zinc-300 font-medium text-sm flex items-center gap-2">
              <User size={16} className="text-emerald-400" /> Visualizando dados de:
            </div>
            <select
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(Number(e.target.value))}
              className="bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
            >
              {dados.dependentes.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Coluna 1: Registros de Aula */}
          <div className="space-y-6">

            {/* Registros Pedagógicos */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-blue-500/10 border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-emerald-400" size={24} />
                  <h3 className="text-lg font-bold text-white">Registros de Aula</h3>
                </div>
                {registros.length > 0 && (
                  <button
                    onClick={() => setModalRegistrosAberto(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-all border border-blue-400/30 hover:border-blue-400/60 px-3 py-1.5 rounded-lg bg-blue-400/10 hover:bg-blue-400/20 cursor-pointer shadow-sm"
                  >
                    Carregar Registros
                  </button>
                )}
              </div>
              <div className="p-4">
                {registrosHoje.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🎵</div>
                    <p className="text-zinc-400 text-sm">O palco está limpo por enquanto.</p>
                    <p className="text-zinc-500 text-xs mt-1">Nenhuma aula registrada para hoje.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrosHoje.map((reg, idx) => (
                      <RegistroCard key={idx} reg={reg} idx={idx} />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Coluna 2: Financeiro e Materiais */}
          <div className="space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-fit">
              <div className="bg-emerald-500/10 border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-emerald-400" size={24} />
                  <h3 className="text-lg font-bold text-white">Financeiro</h3>
                </div>
              </div>

              <div className="p-4">
                {!ehResponsavel && dados?.usuario?.responsavel_id ? (
                  <div className="text-center py-10 px-4">
                    <div className="mx-auto w-12 h-12 bg-black/40 border border-white/10 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <User className="text-zinc-400" size={24} />
                    </div>
                    <p className="text-zinc-300 font-medium">Gestão Financeira</p>
                    <p className="text-zinc-500 text-sm mt-1">O financeiro é gerido pelo seu Responsável Financeiro.</p>
                  </div>
                ) : financeiro.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✨</div>
                    <p className="text-zinc-300 font-medium">Tudo em harmonia por aqui!</p>
                    <p className="text-zinc-500 text-sm mt-1">Nenhum registro financeiro pendente no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {financeiro.map((item) => (
                      <div key={item.id} className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors shadow-inner">
                        <div>
                          <div className="font-medium text-zinc-200">{item.descricao}</div>
                          <div className="text-xs text-zinc-500 mt-1">Vencimento: {new Date(item.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
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
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-fit mt-6">
              <div className="bg-teal-500/10 border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="text-teal-400" size={24} />
                  <h3 className="text-lg font-bold text-white">Materiais Didáticos</h3>
                </div>
              </div>

              <div className="p-4">
                {materiais.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📚</div>
                    <p className="text-zinc-400 text-sm">Material disponível em breve.</p>
                    <p className="text-zinc-500 text-xs mt-1">Materiais enviados pelo professor aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materiais.map((item) => (
                      <div key={item.id} className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors shadow-inner">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-zinc-200 flex items-center gap-2">
                            {getFileIcon(item.tipo)}
                            <span className="truncate">{item.nome}</span>
                          </div>
                          {item.descricao && <div className="text-xs text-zinc-500 mt-1 max-w-xs truncate">{item.descricao}</div>}
                          {item.professor_nome && <div className="text-xs text-teal-500/80 mt-1">Por: {item.professor_nome}</div>}
                          
                          {item.tipo && item.tipo.includes('audio') && (
                            <div className="mt-2">
                              <audio 
                                controls 
                                className="h-8 max-w-[200px] sm:max-w-xs w-full filter drop-shadow-md rounded outline-none" 
                                src={item.caminho_arquivo.startsWith('http') ? item.caminho_arquivo : `${API_URL}/uploads/${item.caminho_arquivo}`}
                              >
                                O seu navegador não suporta áudio.
                              </audio>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 self-start sm:self-center">
                          <a
                            href={item.caminho_arquivo.startsWith('http') ? item.caminho_arquivo : `${API_URL}/uploads/${item.caminho_arquivo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm font-medium text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-2 rounded-lg transition-colors border border-teal-500/20"
                          >
                            <Download size={16} />
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

      {modalRegistrosAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="text-emerald-500" />
                Histórico de Aulas
              </h2>
              <button onClick={() => setModalRegistrosAberto(false)} className="text-zinc-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {registros.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">Nenhum registro encontrado no histórico.</p>
              ) : (
                registros.map((reg, idx) => (
                  <RegistroCard key={idx} reg={reg} idx={idx} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AVISO: AULA HOJE */}
      {modalAvisoAulaAberto && aulasHoje.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col relative text-center p-8">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                <span className="text-4xl">🎸</span>
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-2">Hoje é dia de Aula!</h2>
              <p className="text-zinc-300 text-lg mb-8">Se prepare, seu professor te espera!</p>

              <div className="w-full space-y-3 mb-8 text-left">
                {aulasHoje.map((aula, idx) => (
                  <div key={idx} className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
                    <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{aula.curso_nome}</p>
                      <p className="text-emerald-400 font-medium">{aula.horario_inicio} às {aula.horario_fim}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={fecharAvisoAula}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transform hover:-translate-y-1"
              >
                Tudo certo, estou preparado!
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}

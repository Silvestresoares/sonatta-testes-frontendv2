import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Calendar as CalendarIcon, Clock } from 'lucide-react';
import RegistroAulaModal from '../components/RegistroAulaModal';
import CalendarioVisual from '../components/CalendarioVisual';
import AgendamentoAulaModal from '../components/AgendamentoAulaModal'; // Import the new modal
import AulasTimeline from '../components/AulasTimeline';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

// Mapeamento de dias da semana
const DIAS_SEMANA = {
  'Segunda': 'Segunda-feira',
  'Terça': 'Terça-feira',
  'Quarta': 'Quarta-feira',
  'Quinta': 'Quinta-feira',
  'Sexta': 'Sexta-feira',
  'Sábado': 'Sábado',
  'Domingo': 'Domingo'
};

const ORDEM_DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// ✅ Lista de Feriados Nacionais Fixos (Brasil)
const FERIADOS_FIXOS = {
  '01-01': 'Ano Novo',
  '21-04': 'Tiradentes',
  '01-05': 'Trabalhador',
  '07-09': 'Independência',
  '12-10': 'Aparecida',
  '02-11': 'Finados',
  '15-11': 'Proclamação',
  '20-11': 'Consciência',
  '25-12': 'Natal'
};

const obterNomeFeriado = (data) => {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return FERIADOS_FIXOS[`${dia}-${mes}`];
};

// Função utilitária para formatar data sem problemas de fuso horário
const formatarDataISO = (data) => {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
};

const canalAtualizacao = new BroadcastChannel('sonatta_updates');

export default function Agenda() {
  const [alunos, setAlunos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [experimentais, setExperimentais] = useState([]);
  const [aulasAgendadas, setAulasAgendadas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [professorSelecionado, setProfessorSelecionado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modalRegistroAberto, setModalRegistroAberto] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);
  const [isAgendamentoModalAberto, setIsAgendamentoModalAberto] = useState(false); // State for AgendamentoAulaModal
  const [aulaParaEditar, setAulaParaEditar] = useState(null); // State for editing special classes
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesVisivel, setMesVisivel] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  const token = localStorage.getItem('@sonatta:token');

  // Carregar alunos
  const carregarAlunos = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/alunos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        // Filtrar apenas alunos ativos
        const alunosAtivos = dados.filter(a => a.status === 'Ativo');
        setAlunos(alunosAtivos);
      }
    } catch (erro) {
      console.error('Erro ao carregar alunos:', erro);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  // Carregar registros de aula (para verificar se já tem presença registrada)
  const carregarRegistros = useCallback(async (mesParam, anoParam) => {
    const queryMes = mesParam !== undefined ? mesParam : mesVisivel.mes;
    const queryAno = anoParam !== undefined ? anoParam : mesVisivel.ano;
    try {
      const resposta = await fetch(`${API_URL}/api/registros-aula?mes=${queryMes}&ano=${queryAno}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setRegistros(dados);
      }
    } catch (erro) {
      console.error('Erro ao carregar registros:', erro);
    }
  }, [token, mesVisivel]);

  const handleMesChange = useCallback((mes, ano) => {
    setMesVisivel(prev => {
      if (prev.mes === mes && prev.ano === ano) {
        return prev;
      }
      return { mes, ano };
    });
  }, []);

  // Carregar aulas da tabela 'aulas' (onde ficam as extras/reposições da Sidebar)
  const carregarAulasAgendadas = useCallback(async () => {
    try {
      const resposta = await fetch(`${API_URL}/api/aulas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setAulasAgendadas(dados);
      }
    } catch (erro) {
      console.error('Erro ao carregar aulas agendadas:', erro);
    }
  }, [token]);

  // Carregar aulas experimentais
  const carregarExperimentais = useCallback(async () => {
    try {
      const resposta = await fetch(`${API_URL}/api/aulas-experimentais`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setExperimentais(dados.dados || []);
      }
    } catch (erro) {
      console.error('Erro ao carregar aulas experimentais:', erro);
    }
  }, [token]);

  // Carregar professores ativos
  const carregarProfessores = useCallback(async () => {
    try {
      const resposta = await fetch(`${API_URL}/api/professores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        setProfessores(dados.filter(p => p.status === 'Ativo'));
      }
    } catch (erro) {
      console.error('Erro ao carregar professores:', erro);
    }
  }, [token]);

  // Carregar dados iniciais ao montar
  useEffect(() => {
    carregarAlunos();
    carregarExperimentais();
    carregarAulasAgendadas();
    carregarProfessores();
  }, [carregarAlunos, carregarExperimentais, carregarAulasAgendadas, carregarProfessores]);

  // Ouvir atualizações da Sidebar / outros contextos
  useEffect(() => {
    const handleUpdates = (evento) => {
      if (evento.data === 'atualizar_dados') {
        carregarAulasAgendadas();
        carregarRegistros();
        carregarProfessores();
      }
    };

    canalAtualizacao.addEventListener('message', handleUpdates);
    return () => canalAtualizacao.removeEventListener('message', handleUpdates);
  }, [carregarAulasAgendadas, carregarRegistros, carregarProfessores]);

  // Efeito específico para recarregar registros de aula quando o mês visível for alterado
  useEffect(() => {
    carregarRegistros();
  }, [mesVisivel, carregarRegistros]);

  const nomeFeriado = useMemo(() => {
    return obterNomeFeriado(dataSelecionada);
  }, [dataSelecionada]);

  // Filtra as aulas para o dia selecionado no calendário
  const aulasDoDia = useMemo(() => {
    const diasSemanaMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const nomeDia = diasSemanaMap[dataSelecionada.getDay()];
    const dataISO = formatarDataISO(dataSelecionada);

    // 1. Mapeia aulas regulares baseadas no dia da semana do aluno
    const regulares = alunos
      .filter(aluno => {
        const diaAluno = aluno.dia_aula?.replace('-feira', '');
        return diaAluno === nomeDia;
      })
      .map(aluno => {
        // Busca registro específico de aula regular (sem aula_id e sem experimental_id)
        const registro = registros.find(r => 
          Number(r.aluno_id) === Number(aluno.id) && 
          r.data_aula === dataISO && 
          (!r.aula_id || r.aula_id === 0) && 
          (!r.aula_experimental_id || r.aula_experimental_id === 0)
        );

        return {
          id: registro?.id || `regular-${aluno.id}`,
          aluno_id: aluno.id,
          aluno: aluno.nome,
          instrumento: aluno.instrumento,
          horario: aluno.horario,
          tipo_aula: registro?.tipo_aula || 'aula_regular',
          status: registro ? registro.status_presenca : 'pendente',
          data_aula: dataISO,
          dadosRegistro: registro || null,
          aula_id_referencia: null, // Aulas regulares usam apenas aluno_id + data
          professor_id: aluno.professor_id,
          professor_nome: aluno.professor_nome
        };
      });

    // 2. Adiciona aulas especiais (Extras, Reposições, etc) da tabela 'aulas'
    const extras = aulasAgendadas
      .filter(a => a.data === dataISO && a.tipo_aula !== 'regular')
      .map(a => {
        // Busca registro vinculado exatamente a este ID de aula extra/reposição
        const registroPresenca = registros.find(r => Number(r.aula_id) === Number(a.id) && r.data_aula === dataISO);
        return {
          id: registroPresenca?.id || `extra-${a.id}`,
          aluno_id: a.aluno_id,
          aluno: a.nome_aluno,
          instrumento: a.instrumento,
          horario: a.horario,
          tipo_aula: a.tipo_aula,
          // Se houver um registro pedagógico, usa o status dele. 
          // Senão, mapeamos 'agendada' para 'pendente' para ocultar o selo de status na timeline (igual às aulas regulares).
          status: registroPresenca ? registroPresenca.status_presenca : (a.status === 'agendada' ? 'pendente' : a.status),
          data_aula: dataISO,
          dadosRegistro: registroPresenca || null,
          aula_id_referencia: a.id, // ID da tabela 'aulas' (extra, reposição, etc)
          professor_id: a.professor_id,
          professor_nome: a.professor_nome
        };
      });

    // 3. Adiciona Aulas Experimentais agendadas para o dia
    const aulasExp = experimentais
      .filter(exp => exp.data_aula === dataISO)
      .map(exp => {
        // Verifica se já existe um registro de frequência para esta aula experimental
        const registro = registros.find(r => 
          r.aula_experimental_id === exp.id && r.data_aula === dataISO
        );

        return {
          id: registro?.id || `exp-${exp.id}`,
          aluno_id: null,
          aula_experimental_id: exp.id,
          aluno: exp.nome_aluno,
          instrumento: exp.instrumento,
          horario: exp.horario_aula,
          tipo_aula: 'aula_experimental',
          status: registro ? registro.status_presenca : (exp.status === 'agendada' ? 'pendente' : exp.status),
          data_aula: dataISO,
          tipo_origem: 'experimental',
          dadosRegistro: registro || null,
          professor_id: null,
          professor_nome: null
        };
      });

    const todasAulas = [...regulares, ...extras, ...aulasExp].sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
    
    if (professorSelecionado) {
      return todasAulas.filter(aula => String(aula.professor_id) === String(professorSelecionado));
    }
    
    return todasAulas;
  }, [alunos, registros, experimentais, aulasAgendadas, dataSelecionada, professorSelecionado]);

  // Abrir modal de registro
  const abrirRegistro = (aula) => {
    setAulaSelecionada({
      // Identificadores e metadados da aula para exibição no modal
      id: aula.dadosRegistro?.id || aula.id, 
      aluno_id: aula.aluno_id,
      aluno_nome: aula.aluno,
      instrumento: aula.instrumento,
      horario: aula.horario,
      data_aula: aula.data_aula,
      
      // Referências para persistência (Foreign Keys no banco de dados)
      aula_id: aula.aula_id_referencia, 
      aula_experimental_id: aula.aula_experimental_id,
      
      // Dados pedagógicos carregados para edição imediata
      registroExistente: aula.dadosRegistro,
      status_presenca: aula.dadosRegistro?.status_presenca || (aula.status !== 'pendente' ? aula.status : ''),
      is_novo_registro: !aula.dadosRegistro,
      
      // Flag para o modal abrir com campos habilitados para edição
      modo_edicao: true
    });
    setModalRegistroAberto(true);
  };

  // Handle editing a special class (from 'aulas' table) or experimental class
  const handleEditAula = useCallback((aula) => {
    if (!aula || !aula.id) return;
    
    if (aula.tipo_aula === 'aula_experimental') {
      alert('Edição de aulas experimentais é feita na página de "Aulas Experimentais".');
      return; 
    }

    setAulaParaEditar({ ...aula }); // Cria uma cópia para garantir re-renderização do modal
    setIsAgendamentoModalAberto(true);
  }, []);

  const handleFecharAgendamento = useCallback(() => {
    setIsAgendamentoModalAberto(false);
    setAulaParaEditar(null);
  }, []);

  // Handle deleting a special class (from 'aulas' table) or experimental class
  const handleDeleteAula = useCallback(async (aula) => {
    if (!window.confirm(`Tem certeza que deseja excluir a aula de ${aula.aluno} (${aula.tipo_aula})? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const endpoint = aula.tipo_aula === 'aula_experimental' ? 'aulas-experimentais' : 'aulas';
      const rawId = aula.aula_experimental_id || aula.aula_id_referencia || aula.id;
      const cleanId = String(rawId).replace(/\D/g, '');

      const response = await fetch(`${API_URL}/api/${endpoint}/${cleanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Aula excluída com sucesso!');
        canalAtualizacao.postMessage('atualizar_dados');
        carregarAulasAgendadas(); // Refresh the list of special classes
        carregarExperimentais(); // Refresh experimental classes if applicable
      } else {
        const errorData = await response.json();
        alert(`Erro ao excluir aula: ${errorData.erro || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      alert('Erro de rede ao tentar excluir aula.');
    }
  }, [token, carregarAulasAgendadas, carregarExperimentais, API_URL]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">📅 Agenda de Aulas</h1>
            <p className="text-xs text-zinc-500 mt-1">Gerencie suas aulas e frequências</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Exibir Professor:</label>
            <select
              value={professorSelecionado}
              onChange={(e) => setProfessorSelecionado(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[200px]"
            >
              <option value="">👥 Todos os Professores</option>
              {professores.map(p => (
                <option key={p.id} value={p.id}>👨‍🏫 {p.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-6">
        {carregando ? (
          <div className="flex items-center justify-center h-full">
             <RefreshCw className="animate-spin text-emerald-500 mr-2" />
             <p className="text-zinc-400">Carregando dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: Calendário */}
            <div className="lg:col-span-1">
              <div className="sticky top-0">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CalendarIcon size={16} /> Selecione a Data
                </h2>
                <CalendarioVisual 
                  aulasDoMes={[...alunos, ...registros, ...experimentais, ...aulasAgendadas]} 
                  onDiaSelected={setDataSelecionada} 
                  onMesChange={handleMesChange}
                />
                {!nomeFeriado && (
                  <div className="mt-6 text-center">
                    <p className="text-xl font-black text-blue-400 tracking-tight italic">
                      {aulasDoDia.length} {aulasDoDia.length === 1 ? 'aula hoje' : 'aulas hoje'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2 e 3: Timeline do Dia */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={16} /> 
                <span>Aulas de {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
              </h2>
              
              {nomeFeriado ? (
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-24 text-center min-h-[500px] flex items-center justify-center shadow-lg dark:shadow-2xl">
                  <div className="flex flex-col items-center gap-8">
                    <span className="text-9xl mb-4 animate-bounce drop-shadow-2xl">🍹</span>
                    <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">Feriado! Nenhuma aula hoje!</h3>
                    <p className="text-xl text-rose-400 font-bold uppercase tracking-[0.4em]">
                       {nomeFeriado} 
                    </p>
                  </div>
                </div>
              ) : (
                <AulasTimeline 
                  aulas={aulasDoDia} 
                  onFrequenciaAtualizada={carregarRegistros}
                  onEditAula={handleEditAula}
                  onDeleteAula={handleDeleteAula}
                  onAbrirRegistro={abrirRegistro}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Registro de Aula */}
      {modalRegistroAberto && aulaSelecionada && (
        <RegistroAulaModal
          key={aulaSelecionada.id}
          isOpen={modalRegistroAberto}
          aula={aulaSelecionada}
          onClose={() => {
            setModalRegistroAberto(false);
            carregarRegistros();
            carregarAulasAgendadas();
            carregarExperimentais();
            setAulaSelecionada(null);
          }}
          onSave={() => {
            carregarRegistros();
            carregarAulasAgendadas();
            carregarExperimentais();
          }}
        />
      )}
      
      {/* Modal para Agendamento/Edição de Aulas Especiais (Extra, Reagendada, Reposição) */}
      <AgendamentoAulaModal
        key={aulaParaEditar?.id || 'novo-agendamento'}
        isOpen={isAgendamentoModalAberto}
        onClose={handleFecharAgendamento}
        initialData={aulaParaEditar}
        onSaveSuccess={() => { carregarAulasAgendadas(); handleFecharAgendamento(); }}
      />
    </div>
  );
}

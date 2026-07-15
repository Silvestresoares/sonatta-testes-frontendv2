import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Calendar as CalendarIcon, Clock } from 'lucide-react';
import RegistroAulaModal from '../components/RegistroAulaModal';
import CalendarioVisual from '../components/CalendarioVisual';
import AulasTimeline from '../components/AulasTimeline';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const formatarData = (dataStr) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.substring(0, 10).split('-');
  return `${dia}/${mes}`;
};

const formatarDataISO = (data) => {
  if (!data) return '';
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const obterNomeFeriado = (data) => {
  if (!data) return null;
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const feriados = {
    '01-01': 'Ano Novo',
    '21-04': 'Tiradentes',
    '01-05': 'Dia do Trabalhador',
    '07-09': 'Independência do Brasil',
    '12-10': 'Nossa Senhora Aparecida',
    '02-11': 'Finados',
    '15-11': 'Proclamação da República',
    '20-11': 'Consciência Negra',
    '25-12': 'Natal'
  };
  return feriados[`${dia}-${mes}`] || null;
};

export default function MinhaAgenda({ professorId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [registroAberto, setRegistroAberto] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);

  const token = localStorage.getItem('@sonatta:token');
  const profId = professorId && professorId !== '' ? Number(professorId) : null;

  const carregarAgenda = async () => {
    if (!profId) {
      setErro('ID do professor não encontrado. Tente fazer login novamente.');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch(`${API_URL}/api/professores/${profId}/agenda?mes=${mesAtual}&ano=${anoAtual}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) {
        const json = await resposta.json().catch(() => ({}));
        throw new Error(json.erro || 'Erro ao carregar agenda');
      }

      const json = await resposta.json();
      setDados(json);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgenda();
  }, [profId, mesAtual, anoAtual]);

  const ehMesAtual = mesAtual === new Date().getMonth() + 1 && anoAtual === new Date().getFullYear();
  const nomeFeriado = obterNomeFeriado(dataSelecionada);

  const aulasDoDia = useMemo(() => {
    if (!dados?.aulas_mes) return [];
    const dataISO = formatarDataISO(dataSelecionada);
    return dados.aulas_mes.filter((aula) => aula.data_aula?.toString().substring(0, 10) === dataISO);
  }, [dados, dataSelecionada]);

  const atualizarMes = (mes, ano) => {
    if (mes === mesAtual && ano === anoAtual) return;

    setMesAtual(mes);
    setAnoAtual(ano);

    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    const dia = Math.min(dataSelecionada.getDate(), ultimoDiaDoMes);
    setDataSelecionada(new Date(ano, mes - 1, dia));
  };

  const mesAnterior = () => {
    if (mesAtual === 1) {
      atualizarMes(12, anoAtual - 1);
      return;
    }
    atualizarMes(mesAtual - 1, anoAtual);
  };

  const mesSeguinte = () => {
    if (mesAtual === 12) {
      atualizarMes(1, anoAtual + 1);
      return;
    }
    atualizarMes(mesAtual + 1, anoAtual);
  };

  const abrirRegistro = (aula) => {
    setAulaSelecionada({
      id: aula.dadosRegistro?.id || aula.id,
      aluno_id: aula.aluno_id,
      aluno_nome: aula.nome_aluno || aula.aluno_nome || aula.aluno || aula.nome || '',
      instrumento: aula.instrumento,
      horario: aula.horario,
      data_aula: aula.data_aula,
      aula_id: aula.aula_id || aula.aula_id_referencia || null,
      aula_experimental_id: aula.aula_experimental_id || null,
      registroExistente: aula.dadosRegistro || null,
      status_presenca: aula.dadosRegistro?.status_presenca || (aula.status !== 'pendente' ? aula.status : ''),
      is_novo_registro: !aula.dadosRegistro,
      modo_edicao: true
    });
    setRegistroAberto(true);
  };

  const fecharRegistro = () => {
    setRegistroAberto(false);
    setAulaSelecionada(null);
    carregarAgenda();
  };

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400 text-sm">Carregando sua agenda...</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ {erro}</p>
          <button onClick={carregarAgenda} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm text-white transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden">
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">📅 Minha Agenda</h1>
            <p className="text-xs text-zinc-500 mt-1">Visualize e registre suas aulas com o mesmo layout do administrador.</p>
          </div>
          <button onClick={carregarAgenda} className="flex items-center gap-2 border border-zinc-800 text-zinc-200 rounded-lg px-4 py-2 text-sm hover:bg-zinc-900 transition">
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-0">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CalendarIcon size={16} /> Selecione a data
              </h2>
              <CalendarioVisual
                aulasDoMes={dados?.aulas_mes || []}
                onDiaSelected={(data) => setDataSelecionada(data)}
                onMesChange={(mes, ano) => atualizarMes(mes, ano)}
                initialDate={new Date(anoAtual, mesAtual - 1, 1)}
              />
              {/* Contador de aulas para a data selecionada */}
              <div className="mt-4 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Aulas em {dataSelecionada.toLocaleDateString('pt-BR')}</p>
                <div className="text-2xl font-bold text-blue-400">{aulasDoDia.length}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={16} />
                <span>Aulas de {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
              </h2>

              {nomeFeriado ? (
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-24 text-center min-h-[420px] flex items-center justify-center shadow-lg dark:shadow-2xl">
                  <div className="flex flex-col items-center gap-8">
                    <span className="text-9xl mb-4 animate-bounce drop-shadow-2xl">🍹</span>
                    <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">Feriado! Nenhuma aula hoje!</h3>
                    <p className="text-xl text-rose-400 font-bold uppercase tracking-[0.4em]">{nomeFeriado}</p>
                  </div>
                </div>
              ) : (
                <AulasTimeline aulas={aulasDoDia} onAbrirRegistro={abrirRegistro} showActions={false} />
              )}
            </div>
          </div>
        </div>
      </div>

      <RegistroAulaModal
        isOpen={registroAberto}
        onClose={fecharRegistro}
        aula={aulaSelecionada}
        onSave={fecharRegistro}
      />
    </div>
  );
}

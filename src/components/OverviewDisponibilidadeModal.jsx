import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon } from 'lucide-react';

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const HORARIOS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

// Função utilitária para converter "HH:MM" em minutos totais desde 00:00
function horaParaMinutos(horaStr) {
  if (!horaStr) return 0;
  const [h, m] = horaStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Função utilitária para somar minutos a um horário e formatar "HH:MM"
function somarMinutos(horaStr, duracaoMin = 60) {
  const total = horaParaMinutos(horaStr) + Number(duracaoMin);
  const fimH = Math.floor(total / 60) % 24;
  const fimM = total % 60;
  return `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`;
}


export default function OverviewDisponibilidadeModal({ isOpen, onClose, professores, alunos, turmas, aulasAgendadas, dataSemanaSelecionada }) {
  const [professorId, setProfessorId] = useState('');

  // Define o professor padrão assim que a lista carrega
  useEffect(() => {
    if (professores && professores.length > 0 && !professorId) {
      setProfessorId(professores[0].id.toString());
    }
  }, [professores, professorId]);

  // Calcula as datas da semana selecionada (Segunda a Domingo)
  const datasSemana = useMemo(() => {
    if (!dataSemanaSelecionada) return {};
    const dataRef = new Date(dataSemanaSelecionada);
    const day = dataRef.getDay(); // 0 is Sunday
    const diff = dataRef.getDate() - day + (day === 0 ? -6 : 1);

    const datas = {};
    const curr = new Date(dataRef.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const dataFormatada = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      datas[DIAS_SEMANA[i]] = dataFormatada;
      curr.setDate(curr.getDate() + 1);
    }
    return datas;
  }, [dataSemanaSelecionada]);

  const professorSelecionado = useMemo(() => {
    return professores.find(p => p.id === Number(professorId));
  }, [professores, professorId]);

  const disponibilidade = useMemo(() => {
    if (!professorSelecionado || !professorSelecionado.disponibilidade) return {};
    try {
      return typeof professorSelecionado.disponibilidade === 'string'
        ? JSON.parse(professorSelecionado.disponibilidade)
        : professorSelecionado.disponibilidade;
    } catch (e) {
      return {};
    }
  }, [professorSelecionado]);  // Mapa de ocupação por alunos fixos e turmas considerando duração e periodicidade
  const mapaOcupacaoRegular = useMemo(() => {
    const mapa = {};
    if (!professorId) return mapa;

    // Helper para marcar ocupação nos blocos da grade
    const registrarOcupacao = (diaBase, horaInicio, duracaoMin, dados) => {
      const horaFim = somarMinutos(horaInicio, duracaoMin);
      const minInicio = horaParaMinutos(horaInicio);
      const minFim = horaParaMinutos(horaFim);

      HORARIOS.forEach(slotHora => {
        const minSlot = horaParaMinutos(slotHora);
        // O slot de 30 min vai de minSlot até minSlot + 30
        const slotOcupado = minSlot < minFim && (minSlot + 30) > minInicio;

        if (slotOcupado) {
          if (!mapa[diaBase]) mapa[diaBase] = {};
          if (!mapa[diaBase][slotHora]) mapa[diaBase][slotHora] = [];

          const ehInicioExato = slotHora === horaInicio;
          mapa[diaBase][slotHora].push({
            ...dados,
            horaInicio,
            horaFim,
            duracaoMin,
            ehContinuacao: !ehInicioExato
          });
        }
      });
    };

    // 1. Alunos Regulares
    alunos.forEach(aluno => {
      if (Number(aluno.professor_id) === Number(professorId) && aluno.status === 'Ativo') {
        const dias = (aluno.dia_aula || '').split(',').map(d => d.trim().replace('-feira', ''));
        const horas = (aluno.horario || '').split(',').map(h => h.trim());
        const duracao = Number(aluno.duracao_minutos) || 60;

        dias.forEach((diaBase, idx) => {
          const hora = horas[idx] || horas[0];
          if (diaBase && hora) {
            // Se for quinzenal ou mensal, verifica se o aluno tem aula na semana exibida
            const dataDoDia = datasSemana[diaBase];
            if (dataDoDia && (aluno.periodicidade === 'quinzenal' || aluno.periodicidade === 'mensal')) {
              const diaDoMes = parseInt(dataDoDia.split('-')[2], 10);
              const semanaDoMes = Math.ceil(diaDoMes / 7);
              const semanasPermitidas = String(aluno.semanas_aula || '')
                .split(',')
                .map(s => parseInt(s.trim(), 10))
                .filter(n => !isNaN(n));

              if (semanasPermitidas.length > 0 && !semanasPermitidas.includes(semanaDoMes)) {
                return; // O aluno não ocupa este horário nesta semana do mês!
              }
            }

            registrarOcupacao(diaBase, hora, duracao, {
              tipo: 'regular',
              alunoNome: aluno.nome,
              instrumento: aluno.instrumento
            });
          }
        });
      }
    });

    // 2. Turmas Regulares
    if (turmas) {
      turmas.forEach(turma => {
        if (Number(turma.professor_id) === Number(professorId) && turma.status === 'Ativa') {
          const diaBase = turma.dia_semana?.replace('-feira', '');
          const hora = turma.horario_inicio;
          const duracao = Number(turma.duracao_minutos) || 60;

          if (diaBase && hora) {
            registrarOcupacao(diaBase, hora, duracao, {
              tipo: 'regular',
              isTurma: true,
              alunoNome: `Turma: ${turma.nome}`,
              instrumento: turma.curso_nome || 'Turma'
            });
          }
        }
      });
    }

    return mapa;
  }, [alunos, turmas, professorId, datasSemana]);

  // Mapa de ocupação por aulas especiais agendadas nesta semana exata
  const mapaOcupacaoEspecial = useMemo(() => {
    const mapa = {};
    if (!professorId || !aulasAgendadas) return mapa;

    aulasAgendadas.forEach(aula => {
      if (Number(aula.professor_id) === Number(professorId) && (aula.status === 'agendada' || aula.status === 'realizada' || aula.status === 'pendente')) {
        const aulaDataStr = String(aula.data || aula.data_aula || '').substring(0, 10);
        const diaCorrespondente = Object.keys(datasSemana).find(dia => datasSemana[dia] === aulaDataStr);

        if (diaCorrespondente && aula.horario) {
          if (!mapa[diaCorrespondente]) mapa[diaCorrespondente] = {};
          if (!mapa[diaCorrespondente][aula.horario]) mapa[diaCorrespondente][aula.horario] = [];

          let cor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
          if (aula.tipo_aula === 'aula_extra') cor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          if (aula.tipo_aula === 'reposicao') cor = 'bg-red-500/20 text-red-400 border-red-500/30';
          if (aula.tipo_aula === 'experimental') cor = 'bg-orange-500/20 text-orange-400 border-orange-500/30';

          mapa[diaCorrespondente][aula.horario].push({
            tipo: 'especial',
            alunoNome: aula.nome_aluno || aula.aluno_nome,
            tipo_aula: aula.tipo_aula,
            cor: cor
          });
        }
      }
    });
    return mapa;
  }, [aulasAgendadas, professorId, datasSemana]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Overview de Disponibilidade</h2>
              <p className="text-sm text-zinc-400">Raio-X da semana de {datasSemana['Segunda']?.split('-').reverse().join('/')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 bg-zinc-800 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-72">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Selecione o Professor
              </label>
              <select
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500 transition-colors"
              >
                {professores.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center flex-wrap gap-4 text-xs font-medium bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-3 h-3 rounded-sm bg-zinc-800"></div> Fora de Grade
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30"></div> Livre
              </div>
              <div className="flex items-center gap-2 text-rose-400">
                <div className="w-3 h-3 rounded-sm bg-rose-500/20 border border-rose-500/30"></div> Aluno Fixo
              </div>
              <div className="flex items-center gap-2 text-fuchsia-400">
                <div className="w-3 h-3 rounded-sm bg-fuchsia-500/20 border border-fuchsia-500/30"></div> Turma Fixa
              </div>
              <div className="flex items-center gap-2 text-orange-400">
                <div className="w-3 h-3 rounded-sm bg-orange-500/20 border border-orange-500/30"></div> Aula Especial
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <div className="w-3 h-3 rounded-sm bg-yellow-500/10 border border-yellow-500/30"></div> Agendado Fora da Grade
              </div>
            </div>
          </div>
          {!professorSelecionado ? (
            <div className="text-center py-12 text-zinc-500">
              Nenhum professor selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto bg-zinc-950 rounded-xl border border-zinc-800 p-1 custom-scrollbar">
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    <th className="p-3 text-zinc-500 font-medium text-left w-20 border-b border-zinc-800">Hora</th>
                    {DIAS_SEMANA.map(dia => (
                      <th key={dia} className="p-3 text-zinc-400 font-medium text-center border-b border-zinc-800">
                        {dia}
                        {datasSemana[dia] && (
                          <span className="block text-[10px] text-zinc-600 mt-0.5">
                            {datasSemana[dia].split('-').reverse().slice(0, 2).join('/')}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORARIOS.map(hora => (
                    <tr key={hora} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                      <td className="p-3 text-zinc-500 flex items-center gap-1.5 font-medium border-r border-zinc-800/50">
                        <Clock size={14} className="opacity-50" /> {hora}
                      </td>
                      {DIAS_SEMANA.map(dia => {
                        const estaDisponivel = (disponibilidade[dia] || []).includes(hora);
                        const ocupacoesRegulares = mapaOcupacaoRegular[dia]?.[hora] || [];
                        const ocupacoesEspeciais = mapaOcupacaoEspecial[dia]?.[hora] || [];
                        const todasOcupacoes = [...ocupacoesRegulares, ...ocupacoesEspeciais];
                        const temOcupacao = todasOcupacoes.length > 0;

                        let celula = null;

                        if (temOcupacao) {
                          celula = (
                            <div className="flex flex-col gap-1 w-full">
                              {todasOcupacoes.map((ocupacao, idx) => {
                                const isForaDaGrade = !estaDisponivel;
                                if (isForaDaGrade) {
                                  return (
                                    <div
                                      key={idx}
                                      className="w-full py-1 px-1.5 rounded-md text-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 flex flex-col items-center justify-center"
                                      title={`Agendado fora da grade de disponibilidade! Aluno: ${ocupacao.alunoNome}`}
                                    >
                                      <span className="font-semibold text-[10px] truncate w-full max-w-[110px]">{ocupacao.alunoNome}</span>
                                      <span className="text-[8px] opacity-80 uppercase leading-tight mt-0.5">Fora da Grade</span>
                                    </div>
                                  );
                                }

                                if (ocupacao.tipo === 'especial') {
                                  return (
                                    <div
                                      key={idx}
                                      className={`w-full py-1 px-1.5 rounded-md text-center border ${ocupacao.cor} flex flex-col items-center justify-center`}
                                      title={`Aula Especial: ${ocupacao.tipo_aula.replace('_', ' ')} - ${ocupacao.alunoNome}`}
                                    >
                                      <span className="font-semibold text-[10px] truncate w-full max-w-[110px]">{ocupacao.alunoNome}</span>
                                      <span className="text-[8px] opacity-80 uppercase tracking-wider">{ocupacao.tipo_aula.replace('_', ' ')}</span>
                                    </div>
                                  );
                                }

                                if (ocupacao.isTurma) {
                                  return (
                                    <div
                                      key={idx}
                                      className="w-full py-1 px-1.5 rounded-md text-center bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 flex flex-col items-center justify-center"
                                      title={`Turma Fixa: ${ocupacao.alunoNome} (${ocupacao.instrumento}) • ${ocupacao.horaInicio} às ${ocupacao.horaFim} (${ocupacao.duracaoMin}m)`}
                                    >
                                      <span className="font-semibold text-[10px] truncate w-full max-w-[110px]">{ocupacao.alunoNome.replace('Turma: ', '')}</span>
                                      <span className="text-[8px] opacity-70 truncate w-full max-w-[110px]">{ocupacao.instrumento}</span>
                                      <span className="text-[7px] font-bold text-fuchsia-300/90 mt-0.5">
                                        {ocupacao.horaInicio} - {ocupacao.horaFim} ({ocupacao.duracaoMin}m)
                                      </span>
                                    </div>
                                  );
                                }

                                // Aluno Regular Fixo
                                return (
                                  <div
                                    key={idx}
                                    className={`w-full py-1 px-1.5 rounded-md text-center border flex flex-col items-center justify-center ${ocupacao.ehContinuacao
                                      ? 'bg-rose-500/5 text-rose-400/70 border-rose-500/10 border-dashed'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      }`}
                                    title={`Aluno Fixo: ${ocupacao.alunoNome} (${ocupacao.instrumento}) • ${ocupacao.horaInicio} às ${ocupacao.horaFim} (${ocupacao.duracaoMin} min)`}
                                  >
                                    <span className="font-semibold text-[10px] truncate w-full max-w-[110px]">
                                      {ocupacao.ehContinuacao ? `↳ ${ocupacao.alunoNome}` : ocupacao.alunoNome}
                                    </span>
                                    <span className="text-[8px] opacity-70 truncate w-full max-w-[110px]">
                                      {ocupacao.instrumento}
                                    </span>
                                    <span className="text-[7px] font-bold text-rose-300/90 mt-0.5">
                                      {ocupacao.horaInicio} - {ocupacao.horaFim} ({ocupacao.duracaoMin}m)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        } else if (estaDisponivel) {
                          celula = (
                            <div className="w-full py-1.5 px-2 rounded-md text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Livre
                            </div>
                          );
                        } else {
                          celula = (
                            <div className="w-full h-full flex items-center justify-center text-zinc-800 py-2">
                              -
                            </div>
                          );
                        }

                        return (
                          <td key={`${dia}-${hora}`} className="p-1.5 min-w-[120px] max-w-[140px] align-top border-r border-zinc-800/50 last:border-0">
                            {celula}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

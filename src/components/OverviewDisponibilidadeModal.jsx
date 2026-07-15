import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon } from 'lucide-react';

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function OverviewDisponibilidadeModal({ isOpen, onClose, professores, alunos, aulasAgendadas, dataSemanaSelecionada }) {
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
  }, [professorSelecionado]);

  // Mapa de ocupação por alunos fixos
  const mapaOcupacaoRegular = useMemo(() => {
    const mapa = {};
    if (!professorId) return mapa;

    alunos.forEach(aluno => {
      if (Number(aluno.professor_id) === Number(professorId) && aluno.status === 'Ativo') {
        const diaBase = aluno.dia_aula?.replace('-feira', ''); 
        const hora = aluno.horario;
        if (diaBase && hora) {
          if (!mapa[diaBase]) mapa[diaBase] = {};
          mapa[diaBase][hora] = { 
            tipo: 'regular', 
            alunoNome: aluno.nome,
            instrumento: aluno.instrumento
          };
        }
      }
    });
    return mapa;
  }, [alunos, professorId]);

  // Mapa de ocupação por aulas especiais agendadas nesta semana exata
  const mapaOcupacaoEspecial = useMemo(() => {
    const mapa = {};
    if (!professorId || !aulasAgendadas) return mapa;

    aulasAgendadas.forEach(aula => {
      if (Number(aula.professor_id) === Number(professorId) && (aula.status === 'agendada' || aula.status === 'realizada' || aula.status === 'pendente')) {
        const diaCorrespondente = Object.keys(datasSemana).find(dia => datasSemana[dia] === aula.data);
        
        if (diaCorrespondente && aula.horario) {
          if (!mapa[diaCorrespondente]) mapa[diaCorrespondente] = {};
          
          let cor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
          if (aula.tipo_aula === 'aula_extra') cor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          if (aula.tipo_aula === 'reposicao') cor = 'bg-red-500/20 text-red-400 border-red-500/30';
          if (aula.tipo_aula === 'experimental') cor = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
          
          mapa[diaCorrespondente][aula.horario] = {
            tipo: 'especial',
            alunoNome: aula.nome_aluno || aula.aluno_nome,
            tipo_aula: aula.tipo_aula,
            cor: cor
          };
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
                            {datasSemana[dia].split('-').reverse().slice(0,2).join('/')}
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
                        const ocupacaoRegular = mapaOcupacaoRegular[dia]?.[hora];
                        const ocupacaoEspecial = mapaOcupacaoEspecial[dia]?.[hora];
                        
                        let celula = (
                          <div className="w-full h-full flex items-center justify-center text-zinc-800 py-2">
                            -
                          </div>
                        );

                        if (estaDisponivel) {
                          if (ocupacaoEspecial) {
                            celula = (
                              <div 
                                className={`w-full py-1.5 px-2 rounded-md text-center border ${ocupacaoEspecial.cor} flex flex-col items-center justify-center`}
                                title={`Aula Especial: ${ocupacaoEspecial.tipo_aula.replace('_', ' ')} - ${ocupacaoEspecial.alunoNome}`}
                              >
                                <span className="font-semibold truncate w-full max-w-[110px]">{ocupacaoEspecial.alunoNome}</span>
                                <span className="text-[10px] opacity-80 uppercase tracking-wider">{ocupacaoEspecial.tipo_aula.replace('_', ' ')}</span>
                              </div>
                            );
                          } else if (ocupacaoRegular) {
                            celula = (
                              <div 
                                className="w-full py-1.5 px-2 rounded-md text-center bg-rose-500/10 text-rose-400 border border-rose-500/20 flex flex-col items-center justify-center"
                                title={`Aluno Fixo: ${ocupacaoRegular.alunoNome} (${ocupacaoRegular.instrumento})`}
                              >
                                <span className="font-semibold truncate w-full max-w-[110px]">{ocupacaoRegular.alunoNome}</span>
                                <span className="text-[10px] opacity-70 truncate w-full max-w-[110px]">{ocupacaoRegular.instrumento}</span>
                              </div>
                            );
                          } else {
                            celula = (
                              <div className="w-full py-1.5 px-2 rounded-md text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                Livre
                              </div>
                            );
                          }
                        } else {
                           if (ocupacaoEspecial || ocupacaoRegular) {
                              const o = ocupacaoEspecial || ocupacaoRegular;
                              celula = (
                                <div 
                                  className="w-full py-1.5 px-2 rounded-md text-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 flex flex-col items-center justify-center"
                                  title={`Agendado fora da grade de disponibilidade! Aluno: ${o.alunoNome}`}
                                >
                                  <span className="font-semibold truncate w-full max-w-[110px]">{o.alunoNome}</span>
                                  <span className="text-[9px] opacity-80 uppercase leading-tight mt-0.5">Fora da Grade</span>
                                </div>
                              );
                           }
                        }

                        return (
                          <td key={`${dia}-${hora}`} className="p-1.5 min-w-[120px] max-w-[140px] align-middle border-r border-zinc-800/50 last:border-0">
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

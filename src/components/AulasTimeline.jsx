import React from 'react';
import { Clock, User, Music, AlertCircle, CheckCircle2, XCircle, Tag, Clipboard } from 'lucide-react';

export default function AulasTimeline({ aulas = [], onAbrirRegistro = null, onEditAula = null, onDeleteAula = null }) {
  if (!aulas || aulas.length === 0) {
    return (
      <div className="bg-transparent border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <Clock size={40} className="text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-lg font-bold text-zinc-400 dark:text-zinc-500">Nenhuma aula hoje!</h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Selecione um dia com aulas ou agende novas aulas.
          </p>
        </div>
      </div>
    );
  }

  // Ordena aulas por horário
  const aulasOrdenadas = [...aulas].sort((a, b) => {
    const horaA = parseInt(a.horario?.split(':')[0] || '23');
    const horaB = parseInt(b.horario?.split(':')[0] || '23');
    return horaA - horaB;
  });

  // Centralização da lógica de status para evitar repetição
  const CONFIG_STATUS = {
    sucesso: {
      matches: ['realizada', 'presente'],
      icon: <CheckCircle2 size={14} className="text-emerald-400" />,
      card: 'border-l-emerald-500 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/20',
      badge: 'text-emerald-400',
      color: 'text-emerald-400'
    },
    reposta: {
      matches: ['aula_reposta'],
      icon: <CheckCircle2 size={14} className="text-blue-400" />,
      card: 'border-l-blue-500 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/20',
      badge: 'text-blue-400',
      color: 'text-blue-400'
    },
    erro: {
      matches: ['faltou', 'ausente', 'cancelada', 'falta_aluno_sem_aviso', 'falta_professor'],
      icon: <XCircle size={14} className="text-rose-400" />,
      card: 'border-l-rose-500 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/20',
      badge: 'text-rose-400',
      color: 'text-rose-400'
    },
    padrao: {
      icon: <AlertCircle size={14} className="text-amber-400" />,
      card: 'border-l-zinc-300 dark:border-l-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/20',
      badge: 'text-amber-400',
      color: 'text-amber-400'
    }
  };

  const getStatusConfig = (status) => {
    if (CONFIG_STATUS.sucesso.matches.includes(status)) return CONFIG_STATUS.sucesso;
    if (CONFIG_STATUS.reposta.matches.includes(status)) return CONFIG_STATUS.reposta;
    if (CONFIG_STATUS.erro.matches.includes(status)) return CONFIG_STATUS.erro;
    return CONFIG_STATUS.padrao;
  };

  const LABELS_STATUS = {
    'realizada': 'Aula realizada', 'presente': 'Presente', 'faltou': 'Faltou',
    'ausente': 'Ausente', 'pendente': 'Pendente', 'aula_reposta': 'Reposta', 'cancelada': 'Cancelada',
    'falta_aluno_aviso': 'Falta (C/ Aviso)', 'falta_aluno_sem_aviso': 'Falta (S/ Aviso)',
    'falta_professor': 'Falta Prof.', 'feriado': 'Feriado/Recesso'
  };

  const obterCorTipoAula = (tipo) => {
    if (tipo === 'aula_experimental') return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    if (tipo === 'reposicao') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (tipo === 'aula_extra' || tipo === 'reagendada') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (tipo === 'aula_regular') return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-3">
      {aulasOrdenadas.map((aula, index) => {
        const statusConfig = getStatusConfig(aula.status || 'pendente');
        return (
          <div
            key={aula.id || index}
            className={`border-l-4 rounded-xl p-5 transition-all transform hover:scale-[1.01] hover:shadow-xl ${statusConfig.card}`}
          >
          {/* Cabeçalho: Horário e Status */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-emerald-400" />
                <span className="text-xs font-black text-zinc-900 dark:text-white">{aula.horario}</span>
              </div>
              {aula.status && aula.status !== 'pendente' && (
                <div className={`flex items-center gap-2 text-xs font-semibold ${statusConfig.badge}`}>
                  {statusConfig.icon}
                  <span>{LABELS_STATUS[aula.status] || aula.status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Aluno com Botões de Ação */}
          <div className="space-y-2 ml-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <User size={18} className="text-emerald-400 flex-shrink-0" />
                <p className="text-base font-bold text-zinc-900 dark:text-white">{aula.nome_aluno || aula.aluno}</p>
                <button
                  onClick={() => onAbrirRegistro && onAbrirRegistro(aula)}
                  className={`p-1 rounded-md transition-all cursor-pointer active:scale-95 ${statusConfig.color} hover:bg-white/5`}
                  title={aula.dadosRegistro ? "Editar Registro Pedagógico" : "Registrar Aula"}
                >
                  <Clipboard size={16} />
                </button>
                {aula.instrumento && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <Music size={14} className="text-zinc-500 flex-shrink-0" />
                    <span className="text-xs text-zinc-400">{aula.instrumento}</span>
                  </>
                )}
              </div>

              {/* Ações para Aulas Especiais */}
              <div className="flex items-center gap-1 ml-auto">
                {aula.tipo_aula && aula.tipo_aula !== 'aula_regular' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditAula && onEditAula(aula); }}
                      className="text-blue-400 hover:text-blue-300 p-2 rounded transition-all cursor-pointer hover:bg-blue-500/10 active:scale-90"
                      title="Editar"
                    >✏️</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteAula && onDeleteAula(aula); }}
                      className="text-rose-400 hover:text-rose-300 p-2 rounded transition-all cursor-pointer hover:bg-rose-500/10 active:scale-90"
                      title="Excluir"
                    >🗑️</button>
                  </>
                )}
              </div>
            </div>

            {aula.sala && (
              <div className="text-xs text-zinc-400 ml-6">
                📍 Sala {aula.sala}
              </div>
            )}
            {aula.professor_nome && (
              <div className="text-xs text-zinc-400 ml-6 mt-1 flex items-center gap-1">
                <span>👨‍🏫 Professor:</span>
                <span className="font-semibold text-zinc-300">{aula.professor_nome}</span>
              </div>
            )}
          </div>


          {/* Tipo de aula */}
          {aula.tipo_aula && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${obterCorTipoAula(aula.tipo_aula)}`}>
                <Tag size={12} />
                {aula.tipo_aula === 'aula_extra' ? 'Aula extra' : 
                 aula.tipo_aula === 'aula_experimental' ? 'Experimental' :
                 aula.tipo_aula === 'reposicao' ? 'Reposição' :
                 aula.tipo_aula === 'reagendada' ? 'Reagendada' : 
                 aula.tipo_aula === 'aula_regular' ? 'Regular' : aula.tipo_aula}
              </span>
            </div>
          )}

          {/* Notas ou observações */}
          {aula.notas && (
            <div className="mt-3 pt-3 border-t border-zinc-700/50">
              <p className="text-xs text-zinc-400 italic">💬 {aula.notas}</p>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

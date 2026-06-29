import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

// ✅ Parse seguro de data LOCAL (sem conversão UTC)
const parseDataLocal = (dataString) => {
  if (!dataString) return null;
  if (dataString instanceof Date) return dataString;
  
  // Se é string YYYY-MM-DD, parsear como local
  if (typeof dataString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dataString)) {
    const [year, month, day] = dataString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback: tentar novo Date (pode ser arriscado)
  const parsed = new Date(dataString);
  return isNaN(parsed.getTime()) ? null : parsed;
};

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

export function CalendarioVisual({ aulasDoMes = [], onDiaSelected = () => {}, onMesChange }) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  useEffect(() => {
    if (onMesChange) {
      onMesChange(mesAtual.getMonth() + 1, mesAtual.getFullYear());
    }
  }, [mesAtual, onMesChange]);
  
  const nomeMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const nomeDias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  
  // Gera o calendário do mês
  const gerarDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    
    const primeirodia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    
    const dias = [];
    
    // Dias do mês anterior
    const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = primeirodia - 1; i >= 0; i--) {
      dias.push({
        dia: ultimoDiaMesAnterior - i,
        mesAtual: false,
        data: new Date(ano, mes - 1, ultimoDiaMesAnterior - i)
      });
    }
    
    // Dias do mês atual
    for (let i = 1; i <= ultimoDia; i++) {
      dias.push({
        dia: i,
        mesAtual: true,
        data: new Date(ano, mes, i)
      });
    }
    
    // Dias do próximo mês
    const diasFaltando = 42 - dias.length;
    for (let i = 1; i <= diasFaltando; i++) {
      dias.push({
        dia: i,
        mesAtual: false,
        data: new Date(ano, mes + 1, i)
      });
    }
    
    return dias;
  };
  
  const contarAulasDoDia = (data) => {
    // Se for feriado nacional, as aulas são bloqueadas (contagem zero)
    if (obterNomeFeriado(data)) return 0;

    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaDasemana = diasSemana[data.getDay()];
    const idsRegistradosNoDia = new Set();

    // 1. Conta registros específicos para este dia (presenças, extras, etc)
    const registrosDoDia = aulasDoMes.filter(aula => {
      if (aula.data_aula) {
        const aulasData = parseDataLocal(aula.data_aula);
        if (aulasData && aulasData.toDateString() === data.toDateString()) {
          if (aula.aluno_id) idsRegistradosNoDia.add(aula.aluno_id);
          return true;
        }
      }
      return false;
    });

    // 2. Conta alunos com aula regular hoje que ainda não possuem registro específico
    const regularesDoDia = aulasDoMes.filter(aula => {
      if (aula.dia_aula) {
        const diaTratado = aula.dia_aula.replace('-feira', '');
        return diaTratado === diaDasemana && !idsRegistradosNoDia.has(aula.id);
      }
      return false;
    });

    return registrosDoDia.length + regularesDoDia.length;
  };
  
  const temAulasHoje = (data) => {
    return contarAulasDoDia(data) > 0;
  };
  
  const ehHoje = (data) => {
    const hoje = new Date();
    return data.toDateString() === hoje.toDateString();
  };
  
  const diasDoMes = gerarDiasDoMes();
  
  const handleMesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1));
  };
  
  const handleProximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1));
  };
  
  const handleCliqueDia = (dia) => {
    setDiaSelecionado(dia.data);
    onDiaSelected(dia.data);
    
    // Se clicou em um dia de outro mês, muda o mês automaticamente
    if (!dia.mesAtual) {
      setMesAtual(new Date(dia.data.getFullYear(), dia.data.getMonth()));
    }
  };

  const estaSelecionado = (data) => {
    if (!diaSelecionado) return false;
    return data.toDateString() === diaSelecionado.toDateString();
  };

  return (
    <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-lg dark:shadow-2xl">
      {/* Cabeçalho com navegação de mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleMesAnterior}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white active:scale-90"
          title="Mês anterior"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {nomeMeses[mesAtual.getMonth()]}
          </h3>
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-widest opacity-80">
            {mesAtual.getFullYear()}
          </p>
        </div>
        
        <button
          onClick={handleProximoMes}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white active:scale-90"
          title="Próximo mês"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Cabeçalho com dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {nomeDias.map((dia) => (
          <div key={dia} className="text-center text-[10px] font-black text-zinc-600 py-2 uppercase tracking-tighter">
            {dia}
          </div>
        ))}
      </div>
      
      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-3">
        {diasDoMes.map((item, index) => {
          const numAulas = contarAulasDoDia(item.data);
          const temAulas = numAulas > 0;
          const ehHojeDia = ehHoje(item.data);
          const selecionado = estaSelecionado(item.data);
          const nomeFeriado = obterNomeFeriado(item.data);
          
          return (
            <button
              key={index}
              onClick={() => handleCliqueDia(item)}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold
                transition-all cursor-pointer group border-2
                ${ehHojeDia 
                  ? 'bg-orange-500/25 text-orange-400 border-orange-500/30 hover:bg-orange-500/35' 
                  : selecionado 
                    ? 'bg-emerald-600 dark:bg-white/25 text-white dark:text-white border-emerald-700 dark:border-white/30 shadow-xl scale-105 z-10' 
                    : nomeFeriado && item.mesAtual
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 opacity-60 hover:bg-rose-500/20'
                      : !item.mesAtual 
                        ? 'text-zinc-300 dark:text-zinc-700 bg-transparent border-transparent opacity-40 hover:opacity-100' 
                        : temAulas 
                          ? 'bg-transparent text-zinc-600 dark:text-zinc-300 border-transparent hover:bg-zinc-100 dark:hover:bg-white/5' 
                          : 'bg-transparent text-zinc-400 dark:text-zinc-500 border-transparent hover:bg-zinc-100 dark:hover:bg-white/5'
                }
              `}
              title={nomeFeriado && item.mesAtual ? `Feriado: ${nomeFeriado}` : temAulas ? `${numAulas} aula(s)` : ''}
            >
              <span>{item.dia}</span>
              {nomeFeriado && item.mesAtual && (
                <span className="absolute bottom-1 w-full text-center text-[7px] leading-tight text-rose-500 font-bold px-1 truncate uppercase tracking-tighter">
                  {nomeFeriado}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarioVisual;

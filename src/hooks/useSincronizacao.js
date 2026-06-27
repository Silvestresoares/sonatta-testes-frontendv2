import { useEffect, useCallback, useRef } from 'react';
import { useAulasFrequencia } from '../contexts/AulasFrequenciaContext';

/**
 * 🔄 Hook: useSincronizacaoAulas
 * Sincroniza automaticamente aulas e frequência entre componentes
 * Escuta mudanças no BroadcastChannel e atualiza dados
 */
export function useSincronizacaoAulas(alunoId, mes = null, ano = null) {
  const { 
    sincronizarDados, 
    carregarAulasPorAluno, 
    carregarFrequenciaAluno,
    atualizacoes 
  } = useAulasFrequencia();
  
  const primeiroCarregamentoRef = useRef(false);
  const timerRef = useRef(null);

  // Carregamento inicial
  useEffect(() => {
    if (!alunoId || primeiroCarregamentoRef.current) return;

    primeiroCarregamentoRef.current = true;

    const carregarDados = async () => {
      try {
        await sincronizarDados(alunoId, mes, ano);
        console.log('✅ Dados sincronizados:', { alunoId, mes, ano });
      } catch (erro) {
        console.error('❌ Erro ao sincronizar dados:', erro);
      }
    };

    carregarDados();
  }, [alunoId, mes, ano, sincronizarDados]);

  // Monitorar atualizações e sincronizar
  useEffect(() => {
    if (atualizacoes.length === 0) return;

    const ultimaAtualizacao = atualizacoes[atualizacoes.length - 1];

    console.log('📡 Atualização detectada:', ultimaAtualizacao.tipo);

    // Limpar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Sincronizar com delay para evitar muitas requisições
    timerRef.current = setTimeout(() => {
      if (alunoId) {
        sincronizarDados(alunoId, mes, ano).catch(console.error);
      }
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [atualizacoes, alunoId, mes, ano, sincronizarDados]);

  return {
    recarregar: () => sincronizarDados(alunoId, mes, ano)
  };
}

/**
 * 🎯 Hook: useAulaAluno
 * Obter aulas filtradas de um aluno com sincronização
 */
export function useAulasAluno(alunoId, mes = null, ano = null) {
  const { obterAulasPorAluno, aulas } = useAulasFrequencia();
  const { recarregar } = useSincronizacaoAulas(alunoId, mes, ano);

  // Filtrar aulas por mês e ano se fornecidos
  let aulasAluno = obterAulasPorAluno(alunoId);

  if (mes && ano) {
    aulasAluno = aulasAluno.filter(aula => {
      const [aulaMes, aulaAno] = aula.mes && aula.ano 
        ? [aula.mes, aula.ano]
        : aula.data_aula
        ? (() => {
            const data = parseDataLocal(aula.data_aula);
            return data ? [data.getMonth() + 1, data.getFullYear()] : [null, null];
          })()
        : [null, null];

      return aulaMes === mes && aulaAno === ano;
    });
  }

  return {
    aulas: aulasAluno,
    recarregar
  };
}

/**
 * 📊 Hook: useFrequenciaAluno
 * Obter resumo de frequência com sincronização
 */
export function useFrequenciaAluno(alunoId, mes = null, ano = null) {
  const { frequenciaPorAluno } = useAulasFrequencia();
  const { recarregar } = useSincronizacaoAulas(alunoId, mes, ano);

  const frequencia = frequenciaPorAluno[alunoId];

  return {
    frequencia,
    recarregar
  };
}

/**
 * ⚡ Hook: useFrequenciaEmTempoReal
 * Escuta atualizações de frequência em tempo real
 */
export function useFrequenciaEmTempoReal(alunoId, callback) {
  const canalRef = useRef(null);

  useEffect(() => {
    try {
      canalRef.current = new BroadcastChannel('sonatta-aulas-frequencia');
      
      canalRef.current.onmessage = (evento) => {
        // Filtrar apenas atualizações para este aluno
        if (
          evento.data.tipo === 'frequencia-atualizada' &&
          evento.data.alunoId === alunoId &&
          callback
        ) {
          console.log('⚡ Frequência atualizada em tempo real:', evento.data);
          callback(evento.data);
        }
      };

      return () => {
        if (canalRef.current) {
          canalRef.current.close();
        }
      };
    } catch (erro) {
      console.warn('BroadcastChannel não disponível:', erro);
    }
  }, [alunoId, callback]);
}

/**
 * 🔄 Hook: useAutoSincronizacao
 * Sincronização automática em intervalos regulares
 */
export function useAutoSincronizacao(alunoId, mes = null, ano = null, intervalMs = 30000) {
  const { sincronizarDados } = useAulasFrequencia();

  useEffect(() => {
    if (!alunoId) return;

    // Primeira sincronização imediata
    sincronizarDados(alunoId, mes, ano).catch(console.error);

    // Sincronizar em intervalos
    const timer = setInterval(() => {
      console.log('⏰ Auto-sincronização...');
      sincronizarDados(alunoId, mes, ano).catch(console.error);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [alunoId, mes, ano, intervalMs, sincronizarDados]);
}

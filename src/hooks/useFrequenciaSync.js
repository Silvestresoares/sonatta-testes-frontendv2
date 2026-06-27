import { useEffect, useState } from 'react';

/**
 * 🔄 Hook: useFrequenciaSync
 * Gerencia sincronização de frequência em tempo real entre componentes
 * Ouve atualizações via BroadcastChannel e notifica quando há mudanças
 */
export function useFrequenciaSync(alunoId, mes, ano) {
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(0);
  const [atualizacaoPendente, setAtualizacaoPendente] = useState(false);

  useEffect(() => {
    // Ouvir atualizações de frequência
    try {
      const canal = new BroadcastChannel('sonatta-frequencia');
      
      canal.onmessage = (evento) => {
        if (evento.data.tipo === 'frequencia-atualizada' && evento.data.alunoId === alunoId) {
          console.log('🔄 useFrequenciaSync: Atualização recebida', evento.data);
          setAtualizacaoPendente(true);
          setUltimaAtualizacao(Date.now());
          
          // Limpar flag após um tempo
          setTimeout(() => {
            setAtualizacaoPendente(false);
          }, 500);
        }
      };
      
      return () => canal.close();
    } catch (erro) {
      console.warn('BroadcastChannel não disponível:', erro);
    }
  }, [alunoId]);

  return {
    ultimaAtualizacao,
    atualizacaoPendente,
    necessitaRecarregar: ultimaAtualizacao > 0
  };
}

/**
 * 🔄 Hook: useFrequenciaComSincronizacao
 * Combina carregamento de frequência com sincronização automática
 */
export function useFrequenciaComSincronizacao(alunoId, mes, ano, carregarFuncao) {
  const { ultimaAtualizacao, necessitaRecarregar } = useFrequenciaSync(alunoId, mes, ano);

  useEffect(() => {
    if (necessitaRecarregar) {
      // Aguardar um pouco para o backend processar
      const timeout = setTimeout(() => {
        carregarFuncao();
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [ultimaAtualizacao, necessitaRecarregar, carregarFuncao]);

  return { ultimaAtualizacao, necessitaRecarregar };
}

/**
 * 📢 Função: notificarFrequenciaAtualizada
 * Envia notificação de atualização de frequência para outros componentes
 */
export function notificarFrequenciaAtualizada(aulaId, comparecimento, alunoId, desmarcar = false) {
  try {
    const canal = new BroadcastChannel('sonatta-frequencia');
    canal.postMessage({
      tipo: 'frequencia-atualizada',
      aulaId,
      comparecimento,
      alunoId,
      desmarcar,
      timestamp: Date.now()
    });
    canal.close();
  } catch (erro) {
    console.warn('BroadcastChannel não disponível:', erro);
  }
}

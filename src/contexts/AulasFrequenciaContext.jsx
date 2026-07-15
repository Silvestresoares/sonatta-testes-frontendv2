import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * 📊 Contexto: AulasFrequenciaContext
 * Gerencia o estado COMPLETO de aulas e frequência da aplicação
 * Sincroniza em tempo real entre Agenda, Controle de Frequência e demais páginas
 */
const AulasFrequenciaContext = createContext();

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export function AulasFrequenciaProvider({ children }) {
  // Estado de aulas
  const [aulas, setAulas] = useState([]); // Todas as aulas carregadas
  const [aulasCarregadas, setAulasCarregadas] = useState(false);
  
  // Estado de frequência
  const [frequenciaPorAluno, setFrequenciaPorAluno] = useState({});
  
  // Estado de sincronização
  const [atualizacoes, setAtualizacoes] = useState([]);
  const canalAulasRef = useRef(null);
  const atualizacaoTimerRef = useRef(null);

  // Inicializar canal de comunicação
  useEffect(() => {
    try {
      canalAulasRef.current = new BroadcastChannel('sonatta_updates');
      canalAulasRef.current.onmessage = (evento) => {
        console.log('📡 AulasFrequenciaContext: Mensagem recebida', evento.data);
        
        // Suporte a mensagens legadas em formato string
        if (evento.data === 'atualizar_dados') {
          console.log('📡 Recarga global solicitada via string');
          return;
        }

        switch (evento.data.tipo) {
          case 'aula-criada':
            adicionarAulaLocal(evento.data.aula);
            break;
          case 'frequencia-atualizada':
            atualizarFrequenciaLocal(evento.data.aulaId, evento.data.comparecimento, evento.data.alunoId);
            break;
          case 'aula-removida':
            removerAulaLocal(evento.data.aulaId);
            break;
          case 'recarregar-aulas':
            // Trigger para recarregar dados do backend
            console.log('📡 Requisição de recarga de aulas recebida');
            break;
          default:
            break;
        }
      };
      return () => {
        if (canalAulasRef.current) {
          canalAulasRef.current.close();
        }
      };
    } catch (erro) {
      console.warn('BroadcastChannel não disponível:', erro);
    }
  }, []);

  /**
   * 🔄 Broadcast para outros componentes
   */
  const notificarMudanca = useCallback((tipo, dados) => {
    if (canalAulasRef.current) {
      canalAulasRef.current.postMessage({
        tipo,
        ...dados,
        timestamp: Date.now()
      });
    }
    
    // Também registrar a atualização no histórico
    setAtualizacoes(prev => [...prev, { tipo, dados, timestamp: Date.now() }].slice(-50));
  }, []);

  /**
   * 📚 Adicionar aula ao estado local
   */
  const adicionarAulaLocal = useCallback((novaAula) => {
    setAulas(prev => {
      // Verificar se aula já existe
      const novaIdLimpa = String(novaAula.id).replace(/\D/g, '');
      const existe = prev.some(a => String(a.id).replace(/\D/g, '') === novaIdLimpa);
      if (existe) {
        // Atualizar aula existente
        return prev.map(a => String(a.id).replace(/\D/g, '') === novaIdLimpa ? novaAula : a);
      }
      // Adicionar nova aula
      return [novaAula, ...prev];
    });
  }, []);

  /**
   * 📋 Remover aula do estado local
   */
  const removerAulaLocal = useCallback((aulaId) => {
    const cleanId = String(aulaId).replace(/\D/g, '');
    setAulas(prev => prev.filter(a => String(a.id).replace(/\D/g, '') !== cleanId));
  }, []);

  /**
   * ✏️ Atualizar frequência localmente
   */
  const atualizarFrequenciaLocal = useCallback((aulaId, comparecimento, alunoId) => {
    const cleanId = String(aulaId).replace(/\D/g, '');
    setAulas(prev =>
      prev.map(aula =>
        String(aula.id).replace(/\D/g, '') === cleanId
          ? { ...aula, comparecimento }
          : aula
      )
    );

    // Também atualizar o índice por aluno
    if (alunoId) {
      setFrequenciaPorAluno(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          [aulaId]: comparecimento
        }
      }));
    }
  }, []);

  /**
   * 📥 Carregar todas as aulas de um aluno para um período
   */
  const carregarAulasPorAluno = useCallback(async (alunoId, mes = null, ano = null) => {
    try {
      const token = localStorage.getItem('@sonatta:token');
      if (!token) throw new Error('Sem autenticação');

      let url = `${API_URL}/api/aulas/${alunoId}`;
      if (mes && ano) {
        url += `?mes=${mes}&ano=${ano}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar aulas');

      const dados = await response.json();
      
      // Atualizar aulas
      setAulas(prev => {
        const aulasOtrosAlunos = prev.filter(a => a.aluno_id !== alunoId);
        return [...aulasOtrosAlunos, ...dados];
      });

      setAulasCarregadas(true);
      return dados;
    } catch (erro) {
      console.error('Erro ao carregar aulas:', erro);
      throw erro;
    }
  }, []);

  /**
   * 📊 Carregar frequência de um aluno
   */
  const carregarFrequenciaAluno = useCallback(async (alunoId, mes = null, ano = null) => {
    try {
      const token = localStorage.getItem('@sonatta:token');
      if (!token) throw new Error('Sem autenticação');

      let url = `${API_URL}/api/frequencia/${alunoId}`;
      if (mes && ano) {
        url += `?mes=${mes}&ano=${ano}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar frequência');

      const dados = await response.json();
      
      // Armazenar no estado
      setFrequenciaPorAluno(prev => ({
        ...prev,
        [alunoId]: dados
      }));

      return dados;
    } catch (erro) {
      console.error('Erro ao carregar frequência:', erro);
      throw erro;
    }
  }, []);

  /**
   * ➕ Criar aula e sincronizar
   */
  const criarAula = useCallback(async (dadosAula) => {
    try {
      const token = localStorage.getItem('@sonatta:token');
      if (!token) throw new Error('Sem autenticação');

      const response = await fetch(`${API_URL}/api/aulas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosAula)
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || 'Erro ao criar aula');
      }

      const novaAula = await response.json();

      // Adicionar ao estado local
      adicionarAulaLocal(novaAula);

      // Notificar outros componentes
      notificarMudanca('aula-criada', { aula: novaAula });
      
      // Garante compatibilidade com componentes que esperam a string 'atualizar_dados' (como o Financeiro)
      if (canalAulasRef.current) canalAulasRef.current.postMessage('atualizar_dados');

      return novaAula;
    } catch (erro) {
      console.error('Erro ao criar aula:', erro);
      throw erro;
    }
  }, [adicionarAulaLocal, notificarMudanca]);

  /**
   * 🗑️ Deletar aula
   */
  const deletarAula = useCallback(async (idOrObject) => {
    try {
      // Garante que estamos pegando o ID, seja ele passado como número ou objeto
      const isObject = typeof idOrObject === 'object' && idOrObject !== null;
      const rawId = isObject ? (idOrObject.id || idOrObject.aula_id) : idOrObject;
      const aulaId = rawId ? String(rawId).replace(/^\D+/g, '') : null;
      const tipoAula = isObject ? idOrObject.tipo_aula : 'aula_extra';
      
      if (!aulaId) throw new Error('ID da aula inválido para exclusão');

      const token = localStorage.getItem('@sonatta:token');
      if (!token) throw new Error('Sem autenticação');

      // Determina o endpoint correto baseado no tipo da aula
      const endpoint = tipoAula === 'aula_experimental' ? 'aulas-experimentais' : 'aulas';

      const response = await fetch(`${API_URL}/api/${endpoint}/${aulaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao deletar aula');

      // Remover do estado local
      removerAulaLocal(aulaId);

      // Notificar outros componentes
      notificarMudanca('aula-removida', { aulaId });

      return true;
    } catch (erro) {
      console.error('Erro ao deletar aula:', erro);
      throw erro;
    }
  }, [removerAulaLocal, notificarMudanca]);

  /**
   * ✏️ Atualizar frequência da aula
   */
  const atualizarFrequencia = useCallback(async (aulaId, comparecimento) => {
    try {
      const token = localStorage.getItem('@sonatta:token');
      if (!token) throw new Error('Sem autenticação');

      // Normaliza o ID para busca local e para a URL
      const cleanId = String(aulaId).replace(/^\D+/g, '');
      // Obter o aluno_id da aula
      const aula = aulas.find(a => String(a.id).replace(/^\D+/g, '') === cleanId);
      if (!aula) throw new Error('Aula não encontrada');

      const response = await fetch(`${API_URL}/api/aulas/${cleanId}/frequencia`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comparecimento })
      });

      if (!response.ok) throw new Error('Erro ao atualizar frequência');

      const aulaAtualizada = await response.json();

      // Atualizar localmente
      atualizarFrequenciaLocal(aulaId, comparecimento, aula.aluno_id);

      // Notificar outros componentes
      notificarMudanca('frequencia-atualizada', {
        aulaId,
        alunoId: aula.aluno_id,
        comparecimento
      });

      return aulaAtualizada;
    } catch (erro) {
      console.error('Erro ao atualizar frequência:', erro);
      throw erro;
    }
  }, [aulas, atualizarFrequenciaLocal, notificarMudanca]);

  /**
   * 🔍 Obter aulas de um aluno
   */
  const obterAulasPorAluno = useCallback((alunoId) => {
    return aulas.filter(a => a.aluno_id === alunoId);
  }, [aulas]);

  /**
   * 🔄 Sincronizar dados do backend
   */
  const sincronizarDados = useCallback(async (alunoId, mes, ano) => {
    try {
      // Carregar tanto aulas quanto frequência em paralelo
      await Promise.all([
        carregarAulasPorAluno(alunoId, mes, ano),
        carregarFrequenciaAluno(alunoId, mes, ano)
      ]);

      notificarMudanca('dados-sincronizados', { alunoId, mes, ano });
    } catch (erro) {
      console.error('Erro ao sincronizar dados:', erro);
      throw erro;
    }
  }, [carregarAulasPorAluno, carregarFrequenciaAluno, notificarMudanca]);

  /**
   * 🚪 Logout: Limpa a sessão e redireciona para o login
   */
  const logout = useCallback((e) => {
    // Se vier de um clique em link/botão, previne comportamentos padrão do navegador
    if (e && e.preventDefault) e.preventDefault();
    
    console.log('🚪 Iniciando processo de encerramento de sessão...');

    // 1. Limpa TODOS os tipos de armazenamento para não deixar rastros
    localStorage.clear();
    sessionStorage.clear();

    // 2. Redireciona para a raiz usando replace para limpar o histórico de navegação
    // Isso impede que o usuário clique em "Voltar" e veja dados em cache
    const urlRaiz = window.location.origin;
    window.location.replace(urlRaiz);
  }, []);

  const value = {
    // Estado
    aulas,
    aulasCarregadas,
    frequenciaPorAluno,
    atualizacoes,
    
    // Métodos de carregamento
    carregarAulasPorAluno,
    carregarFrequenciaAluno,
    sincronizarDados,
    logout,
    
    // Métodos de manipulação
    criarAula,
    deletarAula,
    atualizarFrequencia,
    
    // Métodos de consulta
    obterAulasPorAluno,
    
    // Métodos de comunicação
    notificarMudanca
  };

  return (
    <AulasFrequenciaContext.Provider value={value}>
      {children}
    </AulasFrequenciaContext.Provider>
  );
}

/**
 * 🎣 Hook para usar o contexto de aulas e frequência
 */
export function useAulasFrequencia() {
  const context = useContext(AulasFrequenciaContext);
  if (!context) {
    throw new Error('useAulasFrequencia deve ser usado dentro de AulasFrequenciaProvider');
  }
  return context;
}

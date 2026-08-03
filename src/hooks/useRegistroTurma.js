import { useState, useEffect } from 'react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export function useRegistroTurma(turmaAula, isOpen, onClose, onSave) {
  const [formData, setFormData] = useState({
    conteudo_trabalhado: '',
    tarefas_casa: '',
    anotacoes: '',
    observacoes: ''
  });
  
  const [alunos, setAlunos] = useState([]);
  const [presencas, setPresencas] = useState({}); // { aluno_id: 'status' }
  const [statusGeral, setStatusGeral] = useState('dada'); // 'dada', 'cancelada', 'reagendada'
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (isOpen && turmaAula) {
      carregarAlunosERegistros();
      setErro('');
      setSucesso(false);
      setFormData({
        conteudo_trabalhado: '',
        tarefas_casa: '',
        anotacoes: '',
        observacoes: ''
      });
      setPresencas({});
      setStatusGeral('dada');
    }
  }, [isOpen, turmaAula]);

  const carregarAlunosERegistros = async () => {
    if (!turmaAula?.turma_id) return;
    setCarregando(true);
    try {
      const token = localStorage.getItem('@sonatta:token');
      
      const resAlunos = await fetch(`${API_URL}/api/turmas/${turmaAula.turma_id}/alunos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resAlunos.ok) throw new Error('Erro ao buscar alunos da turma.');
      const dataAlunos = await resAlunos.json();
      setAlunos(dataAlunos);

      const dataBusca = turmaAula.data_aula;
      let conteudoUnificado = '';
      let tarefasUnificadas = '';
      let anotacoesUnificadas = '';
      let observacoesUnificadas = '';
      const presencasMap = {};

      for (const aluno of dataAlunos) {
        const params = new URLSearchParams({ data_aula: dataBusca, aluno_id: aluno.id, turma_id: turmaAula.turma_id });
        const resReg = await fetch(`${API_URL}/api/registros-aula/buscar?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resReg.ok) {
          const reg = await resReg.json();
          if (reg) {
            presencasMap[aluno.id] = reg.status_presenca;
            if (!conteudoUnificado && reg.conteudo_trabalhado) conteudoUnificado = reg.conteudo_trabalhado;
            if (!tarefasUnificadas && reg.tarefas_casa) tarefasUnificadas = reg.tarefas_casa;
            if (!anotacoesUnificadas && reg.anotacoes) anotacoesUnificadas = reg.anotacoes;
            if (!observacoesUnificadas && reg.observacoes) observacoesUnificadas = reg.observacoes;
          }
        }
      }

      setPresencas(presencasMap);
      
      const valores = Object.values(presencasMap);
      if (valores.length > 0 && valores.length === dataAlunos.length) {
        if (valores.every(v => v === 'cancelada')) setStatusGeral('cancelada');
        else if (valores.every(v => v === 'reagendada')) setStatusGeral('reagendada');
        else setStatusGeral('dada');
      } else {
        setStatusGeral('dada');
      }

      setFormData({
        conteudo_trabalhado: conteudoUnificado,
        tarefas_casa: tarefasUnificadas,
        anotacoes: anotacoesUnificadas,
        observacoes: observacoesUnificadas
      });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handlePresencaChange = (alunoId, status) => {
    setPresencas(prev => ({ ...prev, [alunoId]: status }));
  };

  const handleMarcarTodos = (status) => {
    const novasPresencas = {};
    alunos.forEach(a => { novasPresencas[a.id] = status; });
    setPresencas(novasPresencas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const token = localStorage.getItem('@sonatta:token');
      const payload = {
        turma_id: turmaAula.turma_id,
        data_aula: turmaAula.data_aula,
        alunos: alunos.map(a => ({ aluno_id: a.id, status_presenca: presencas[a.id] })),
        conteudo_trabalhado: formData.conteudo_trabalhado,
        tarefas_casa: formData.tarefas_casa,
        anotacoes: formData.anotacoes,
        observacoes: formData.observacoes
      };

      const response = await fetch(`${API_URL}/api/registros-aula/turma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao salvar registro de turma.');
      }

      setSucesso(true);
      setTimeout(() => {
        if (onSave) onSave();
        else onClose();
      }, 1500);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return {
    formData,
    setFormData,
    alunos,
    presencas,
    statusGeral,
    setStatusGeral,
    carregando,
    erro,
    sucesso,
    handlePresencaChange,
    handleMarcarTodos,
    handleSubmit
  };
}

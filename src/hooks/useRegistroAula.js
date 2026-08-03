import { useState, useEffect } from 'react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

const getNomeAluno = (dados) => {
  if (!dados) return '';
  return dados.aluno_nome || dados.nome_aluno || dados.aluno || dados.nome || '';
};

export function useRegistroAula(aula, aluno, isOpen, onClose, onSave) {
  const [formData, setFormData] = useState({
    aluno_id: null,
    aula_id: null,
    aula_experimental_id: null,
    aluno_nome: '',
    professor: '',
    data_aula: new Date().toLocaleDateString('en-CA'),
    horario: '',
    instrumento: '',
    status_presenca: '',
    conteudo_trabalhado: '',
    tarefas_casa: '',
    anotacoes: '',
    observacoes: ''
  });

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const carregarRegistroData = async (dataBusca) => {
    const token = localStorage.getItem('@sonatta:token');
    const idAluno = aula?.aluno_id || aluno?.id || formData.aluno_id;
    const idAula = aula?.aula_id || aula?.aula_id_referencia;
    const idExp = aula?.aula_experimental_id;

    if (!idAluno && !idExp && !idAula) return;

    try {
      const params = new URLSearchParams({
        data_aula: dataBusca,
        aluno_id: idAluno || '',
        aula_id: (idAula && !String(idAula).includes('regular')) ? idAula : '',
        aula_experimental_id: idExp || ''
      });

      const response = await fetch(`${API_URL}/api/registros-aula/buscar?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const reg = await response.json();
        if (reg) {
          setFormData(prev => ({
            ...prev,
            status_presenca: reg.status_presenca || prev.status_presenca || '',
            conteudo_trabalhado: reg.conteudo_trabalhado || '',
            tarefas_casa: reg.tarefas_casa || '',
            anotacoes: reg.anotacoes || '',
            observacoes: reg.observacoes || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            conteudo_trabalhado: '',
            tarefas_casa: '',
            anotacoes: '',
            observacoes: ''
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar registro existente:', error);
    }
  };

  useEffect(() => {
    if (aula && isOpen) {
      const reg = aula.registroExistente || {};
      const aulaId = aula.aula_id || aula.aula_id_referencia;

      setFormData({
        aluno_id: aula.aluno_id || null,
        aula_id: aulaId,
        aula_experimental_id: aula.aula_experimental_id || null,
        aluno_nome: getNomeAluno(aula),
        professor: aula.professor || '',
        data_aula: aula.data_aula || '',
        horario: aula.horario || '',
        instrumento: aula.instrumento || '',
        status_presenca: reg.status_presenca || aula.status_presenca || '',
        conteudo_trabalhado: reg.conteudo_trabalhado || '',
        tarefas_casa: reg.tarefas_casa || '',
        anotacoes: reg.anotacoes || '',
        observacoes: reg.observacoes || ''
      });
    } 
    else if (aluno && isOpen) {
      setFormData({
        aluno_id: aluno.id,
        aula_experimental_id: null,
        aluno_nome: getNomeAluno(aluno),
        professor: aluno.professor || '',
        data_aula: new Date().toISOString().split('T')[0],
        horario: aluno.horario || '',
        instrumento: aluno.instrumento || '',
        status_presenca: '',
        conteudo_trabalhado: '',
        tarefas_casa: '',
        anotacoes: '',
        observacoes: ''
      });
    }

    if (isOpen) {
      const dataParaBuscar = aula?.data_aula || new Date().toLocaleDateString('en-CA');
      carregarRegistroData(dataParaBuscar);
    }

    setErro('');
    setSucesso(false);
  }, [aula, aluno, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'data_aula' && value) {
      carregarRegistroData(value);
    }
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.data_aula) {
      setErro('Data da aula é obrigatória');
      return;
    }

    if (!formData.aluno_id && !formData.aula_id && !formData.aula_experimental_id) {
      setErro('Erro ao carregar dados da aula. Tente novamente.');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const token = localStorage.getItem('@sonatta:token');
      
      const payload = {
        aluno_id: formData.aluno_id || null,
        aula_id: formData.aula_id || null,
        aula_experimental_id: formData.aula_experimental_id || null,
        data_aula: formData.data_aula,
        status_presenca: formData.status_presenca,
        conteudo_trabalhado: formData.conteudo_trabalhado || null,
        tarefas_casa: formData.tarefas_casa || null,
        anotacoes: formData.anotacoes || null,
        observacoes: formData.observacoes || null
      };
      
      const url = `${API_URL}/api/registros-aula`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = `Status ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          errorMessage = data.erro || data.message || errorMessage;
        } catch (err) {}
        throw new Error(errorMessage);
      }

      setSucesso(true);
      if (onSave) onSave();

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      setErro(err.message || 'Erro ao salvar registro de aula');
    } finally {
      setCarregando(false);
    }
  };

  return {
    formData,
    setFormData,
    carregando,
    erro,
    sucesso,
    handleChange,
    handleSubmit
  };
}

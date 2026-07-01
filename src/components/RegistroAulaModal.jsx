import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, BookOpen, Home, MessageSquare, Info, Calendar, Clock, Music, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUS_OPCOES = [
  { id: 'presente', label: 'Presente', icon: <CheckCircle size={16} />, color: 'emerald' },
  { id: 'falta_aluno_aviso', label: 'Falta Aluno (C/ Aviso)', icon: <span className="text-lg">📅</span>, color: 'amber', activeClass: 'bg-amber-600/50' },
  { id: 'falta_aluno_sem_aviso', label: 'Falta Aluno (S/ Aviso)', icon: <span className="text-lg">⏳</span>, color: 'orange', activeClass: 'bg-orange-600/50' },
  { id: 'falta_professor', label: 'Falta Professor', icon: <X size={16} />, color: 'red', activeClass: 'bg-red-600/50' },
  { id: 'aula_reposta', label: 'Aula Reposta', icon: <span className="text-lg">↩️</span>, color: 'blue' },
  { id: 'feriado', label: 'Feriado / Recesso', icon: <span className="text-lg">🌴</span>, color: 'zinc', activeClass: 'bg-zinc-600/80' },
  { id: 'cancelada', label: 'Aula Cancelada', icon: <X size={16} />, color: 'red', activeClass: 'bg-red-600/50' },
];

export default function RegistroAulaModal({ isOpen, onClose, aluno, aula, onSave }) {
  const [formData, setFormData] = useState({
    aluno_id: null,
    aula_id: null,
    aula_experimental_id: null,
    aluno_nome: '',
    professor: '',
    data_aula: new Date().toLocaleDateString('en-CA'), // Formato YYYY-MM-DD seguro localmente
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
    const idAula = aula?.aula_id || aula?.aula_id_referencia || (aula?.id && !String(aula.id).startsWith('regular') ? aula.id : null);
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
          // Se não houver registro, mantemos o status que veio da agenda mas limpamos o conteúdo pedagógico
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
    // Se vem de aula agendada (Agenda), usar dados da aula
    if (aula && isOpen) {
      const reg = aula.registroExistente || {};
      const aulaId = aula.aula_id || aula.aula_id_referencia || (aula.id && !String(aula.id).startsWith('regular') ? aula.id : null);

      setFormData({
        aluno_id: aula.aluno_id || null,
        aula_id: aulaId,
        aula_experimental_id: aula.aula_experimental_id || null,
        aluno_nome: aula.aluno_nome || '',
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
    // Se vem de aluno cadastrado, usar dados do aluno
    else if (aluno && isOpen) {
      setFormData({
        aluno_id: aluno.id,
        aula_experimental_id: null,
        aluno_nome: aluno.nome || '',
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

    // Se o modal abriu, tenta carregar dados existentes para a data atual do formulário
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
    
    // Se mudou a data, busca se já existe registro para o novo dia selecionado
    if (name === 'data_aula' && value) {
      carregarRegistroData(value);
    }
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações simples
    if (!formData.status_presenca) {
      setErro('Status de presença é obrigatório');
      return;
    }

    if (!formData.data_aula) {
      setErro('Data da aula é obrigatória');
      return;
    }

    // Validação: deve ter aluno_id, aula_id ou aula_experimental_id
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
      
      // Sempre usamos POST para aproveitar a lógica de UPSERT (Insert or Update) do backend
      const url = `${API_URL}/api/registros-aula`;
      const method = 'POST';

      const response = await fetch(url, {
        method: method,
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
        } catch (e) {
          // Fallback se não for JSON
        }
        throw new Error(errorMessage);
      }

      setSucesso(true);
      if (onSave) onSave();

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (erro) {
      console.error('Erro ao salvar registro:', erro);
      setErro(erro.message || 'Erro ao salvar registro de aula');
    } finally {
      setCarregando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Registro de Aula</h2>
              <p className="text-sm text-zinc-400">{formData.aluno_nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Mensagens de feedback */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="bg-emerald-500/10 border border-emerald-500 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-400 text-sm">Registro de aula salvo com sucesso!</p>
            </div>
          )}

          {/* Seção 1: Informações Básicas */}
          <div className="space-y-4 p-5 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
               <Info size={16} className="text-orange-500" />
               <h3 className="font-semibold text-zinc-100 text-sm uppercase tracking-wider">Informações Básicas</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nome do Aluno</label>
              <div className="px-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-100 flex items-center gap-2">
                <User size={14} className="text-zinc-500" />
                {formData.aluno_nome || 'Carregando...'}
              </div>
            </div>

            {formData.instrumento && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">🎵 Instrumento</label>
                <div className="px-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-100 flex items-center gap-2">
                  <Music size={14} className="text-zinc-500" />
                  {formData.instrumento}
                </div>
              </div>
            )}

            {formData.horario && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">⏰ Horário</label>
                <div className="px-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-100 flex items-center gap-2">
                  <Clock size={14} className="text-zinc-500" />
                  {formData.horario}
                </div>
              </div>
            )}

            {formData.professor && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">👨‍🏫 Professor</label>
                <div className="px-3 py-2 bg-zinc-700 rounded-lg text-white">
                  {formData.professor}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="data_aula" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Data da Aula
              </label>
              {aula ? (
                <div className="px-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-100 flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-500" />
                  {formData.data_aula.split('-').reverse().join('/')}
                </div>
              ) : (
                <input
                  type="date"
                  id="data_aula"
                  name="data_aula"
                  value={formData.data_aula}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Status de Presença *</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPCOES.map((opcao) => (
                  <button
                    key={opcao.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      status_presenca: opcao.id,
                      // Limpa campos de conteúdo se o status for de ausência ou cancelamento
                      ...( (['falta_aluno_aviso', 'falta_aluno_sem_aviso', 'falta_professor', 'feriado', 'cancelada'].includes(opcao.id)) && {
                        conteudo_trabalhado: '', tarefas_casa: ''
                      })
                    }))}
                    className={`py-2 px-2 rounded-lg font-medium text-[11px] transition flex items-center justify-center gap-1.5 ${
                      formData.status_presenca === opcao.id
                          ? `${opcao.activeClass || `bg-${opcao.color}-600`} text-white shadow-lg shadow-${opcao.color}-900/20`
                        : `bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-${opcao.color}-600 hover:text-zinc-200`
                    }`}
                  >
                    {opcao.icon} {opcao.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção 2: Conteúdo da Aula */}
          <div className="space-y-4 p-5 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
               <BookOpen size={16} className="text-orange-500" />
               <h3 className="font-semibold text-zinc-100 text-sm uppercase tracking-wider">Conteúdo da Aula</h3>
            </div>
            
            <div>
              <label htmlFor="conteudo_trabalhado" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Conteúdo Trabalhado
              </label>
              <textarea
                id="conteudo_trabalhado"
                name="conteudo_trabalhado"
                value={formData.conteudo_trabalhado}
                onChange={handleChange}
                disabled={['falta_aluno_aviso', 'falta_aluno_sem_aviso', 'falta_professor', 'feriado', 'cancelada'].includes(formData.status_presenca)}
                placeholder={['falta_aluno_aviso', 'falta_aluno_sem_aviso', 'falta_professor', 'feriado', 'cancelada'].includes(formData.status_presenca) 
                  ? "Campo desativado para alunos ausentes/aulas canceladas" 
                  : "Ex: Escalas menores, Leitura de partitura, Prática de dedilhado..."}
                rows="3"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition resize-none disabled:opacity-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="tarefas_casa" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Tarefas para Casa
              </label>
              <textarea
                id="tarefas_casa"
                name="tarefas_casa"
                value={formData.tarefas_casa}
                onChange={handleChange}
                disabled={['falta_aluno_aviso', 'falta_aluno_sem_aviso', 'falta_professor', 'feriado', 'cancelada'].includes(formData.status_presenca)}
                placeholder={['falta_aluno_aviso', 'falta_aluno_sem_aviso', 'falta_professor', 'feriado', 'cancelada'].includes(formData.status_presenca) 
                  ? "Campo desativado para alunos ausentes/aulas canceladas" 
                  : "Ex: Praticar escalas 30 minutos, Estudar páginas 10-12 do método..."}
                rows="3"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition resize-none disabled:opacity-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Seção 3: Observações */}
          <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Observações</h3>
            
            <div>
              <label htmlFor="anotacoes" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Anotações da Aula
              </label>
              <textarea
                id="anotacoes"
                name="anotacoes"
                value={formData.anotacoes}
                onChange={handleChange}
                placeholder="Notas sobre o desempenho, pontos positivos, áreas de melhoria..."
                rows="3"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition resize-none"
              />
            </div>

            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Observações Adicionais
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Qualquer informação adicional importante..."
                rows="2"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando || sucesso}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : sucesso ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                'Salvar Registro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

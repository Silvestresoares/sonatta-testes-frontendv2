import React, { useState } from 'react';
import { X, Clock, Calendar, Save, FileText } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function SolicitarAjustePontoModal({ isOpen, onClose, professorId, token, onSucesso }) {
  const [dataRef, setDataRef] = useState(new Date().toISOString().split('T')[0]);
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSaida, setHoraSaida] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dataRef || !horaEntrada || !horaSaida || !justificativa) {
      setErro('Preencha todos os campos.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const res = await fetch(`${API_URL}/api/professores/${professorId}/ponto/ajuste`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify({
          data_referencia: dataRef,
          hora_entrada: horaEntrada,
          hora_saida: horaSaida,
          justificativa: justificativa
        })
      });

      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro || 'Erro ao solicitar ajuste.');
      } else {
        alert(json.mensagem);
        if (onSucesso) onSucesso();
        onClose();
        // Reset form
        setDataRef(new Date().toISOString().split('T')[0]);
        setHoraEntrada('');
        setHoraSaida('');
        setJustificativa('');
      }
    } catch (err) {
      setErro('Erro de conexão ao enviar solicitação.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-500" /> Solicitar Ajuste de Ponto
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Preencha os horários corretos e explique o motivo da correção. A solicitação será avaliada pela administração da escola.
          </p>

          {erro && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-sm border border-rose-200 dark:border-rose-500/20">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                <Calendar size={14} /> Data da Correção
              </label>
              <input 
                type="date" 
                required
                value={dataRef}
                onChange={e => setDataRef(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Entrada Correta</label>
                <input 
                  type="time" 
                  required
                  value={horaEntrada}
                  onChange={e => setHoraEntrada(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Saída Correta</label>
                <input 
                  type="time" 
                  required
                  value={horaSaida}
                  onChange={e => setHoraSaida(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
                <FileText size={14} /> Motivo / Justificativa
              </label>
              <textarea 
                required
                rows={3}
                placeholder="Ex: Esqueci de bater a saída ao final do expediente..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-white resize-none"
              ></textarea>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={enviando}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : <><Save size={16} /> Enviar Solicitação</>}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

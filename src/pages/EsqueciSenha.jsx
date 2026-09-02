import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function EsqueciSenha({ aoVoltar }) {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const resposta = await fetch(`${API_URL}/api/recuperacao/esqueci-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setMensagem({
          tipo: 'sucesso',
          texto: dados.mensagem || 'Link de recuperação enviado com sucesso para o seu e-mail!',
        });
        setEmail('');
      } else {
        setMensagem({
          tipo: 'erro',
          texto: dados.erro || 'Ocorreu um erro ao processar a solicitação.',
        });
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      setMensagem({
        tipo: 'erro',
        texto: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleVoltar = () => {
    if (typeof aoVoltar === 'function') {
      aoVoltar();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
            <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recuperar Senha</h2>
          <p className="text-xs text-zinc-400">
            Digite seu e-mail cadastrado para receber o link de redefinição de senha.
          </p>
        </div>

        {mensagem.texto && (
          <div className={`p-3.5 rounded-xl text-sm flex items-center gap-2.5 font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="seuemail@exemplo.com"
                disabled={carregando}
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98"
          >
            {carregando ? 'Enviando link...' : 'Enviar Link de Recuperação'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleVoltar}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Voltar para o Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

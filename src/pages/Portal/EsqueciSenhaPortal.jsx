import React, { useState } from 'react';


import { API_URL } from '../../utils/api';
export default function EsqueciSenhaPortal({ aoVoltar }) {
  const [login, setLogin] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login) return;

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const resposta = await fetch(`${API_URL}/api/portal/esqueci-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setMensagem({
          tipo: 'sucesso',
          texto: dados.mensagem || 'Link de recuperação gerado com sucesso! Verifique seu e-mail.',
        });
        setLogin('');
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

  return (
    <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm mx-auto z-10 relative">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h2>
        <p className="text-zinc-400 text-sm">
          Digite seu CPF ou E-mail cadastrado para receber as instruções de recuperação.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            CPF ou E-mail
          </label>
          <input
            type="text"
            required
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            placeholder="Digite aqui..."
            disabled={carregando}
          />
        </div>

        {mensagem.texto && (
          <div
            className={`p-3 rounded-lg text-sm text-center font-medium ${
              mensagem.tipo === 'sucesso'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {carregando ? 'Processando...' : 'Enviar Link'}
          </button>
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={aoVoltar}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Voltar para o Login
          </button>
        </div>
      </form>
    </div>
  );
}

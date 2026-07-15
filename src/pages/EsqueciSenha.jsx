import React, { useState } from 'react';

const API_URL = 'https://sonatta-backend.onrender.com';

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
          texto: dados.mensagem || 'Link de recuperação gerado com sucesso! Verifique o console do backend.',
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite seu e-mail cadastrado para receber as instruções de recuperação.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="sr-only">
              Endereço de E-mail
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Ex: seuemail@gmail.com"
              disabled={carregando}
            />
          </div>

          {mensagem.texto && (
            <div
              className={`p-3 rounded text-sm text-center ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={carregando}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                carregando
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {carregando ? 'Processando...' : 'Enviar Link de Recuperação'}
            </button>
          </div>

          <div className="text-sm text-center mt-4">
            <button
              type="button"
              onClick={aoVoltar}
              className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none cursor-pointer"
            >
              Voltar para o Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

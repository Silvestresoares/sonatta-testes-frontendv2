import React from 'react';

/**
 * ErrorBoundary — captura erros de renderização em qualquer componente filho
 * e exibe uma tela de fallback amigável em vez de quebrar silenciosamente (FE-04).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Em produção, aqui seria ideal enviar para Sentry ou serviço similar
    console.error('[ErrorBoundary] Erro capturado:', error, info.componentStack);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-white text-xl font-bold mb-2">Algo deu errado</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Ocorreu um erro inesperado nesta página. Tente recarregar — se o problema persistir,
            entre em contato com o suporte.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="text-left text-xs text-red-400 bg-red-950/30 rounded-lg p-3 mb-4 overflow-auto max-h-32">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
}

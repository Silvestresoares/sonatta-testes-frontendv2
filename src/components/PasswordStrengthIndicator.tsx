import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { avaliarSenha } from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  senha: string;
  /** Se true, mostra o checklist detalhado; se false, mostra apenas a barra de progresso */
  mostrarChecklist?: boolean;
}

/**
 * Componente visual para exibir a força da senha em tempo real
 * e fornecer feedback interativo com checklist dos requisitos de segurança
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  senha,
  mostrarChecklist = true,
}) => {
  if (!senha) return null;

  const { criterios, pontuacao, nivel, label, valida } = avaliarSenha(senha);

  // Mapeamento de cores da barra de acordo com o nível
  const coresNivel = {
    fraca: 'bg-rose-500',
    media: 'bg-amber-500',
    forte: 'bg-emerald-500',
  };

  const textoNivel = {
    fraca: 'text-rose-400',
    media: 'text-amber-400',
    forte: 'text-emerald-400',
  };

  const itensChecklist = [
    { label: 'Pelo menos 8 caracteres', atendido: criterios.temMinimo },
    { label: 'Pelo menos 1 letra maiúscula (A-Z)', atendido: criterios.temMaiuscula },
    { label: 'Pelo menos 1 letra minúscula (a-z)', atendido: criterios.temMinuscula },
    { label: 'Pelo menos 1 número (0-9)', atendido: criterios.temNumero },
    { label: 'Pelo menos 1 caractere especial (!@#$%...)', atendido: criterios.temEspecial },
  ];

  return (
    <div className="mt-2.5 p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-2.5 transition-all animate-fadeIn">
      {/* Barra de Progresso em 5 Segmentos */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-zinc-400 flex items-center gap-1.5">
            {valida ? (
              <ShieldCheck size={14} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={14} className="text-amber-400" />
            )}
            Força da Senha:
          </span>
          <span className={`font-semibold ${textoNivel[nivel]}`}>
            {label}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 h-1.5">
          {[1, 2, 3, 4, 5].map((seg) => (
            <div
              key={seg}
              className={`h-full rounded-full transition-all duration-300 ${
                seg <= pontuacao ? coresNivel[nivel] : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Checklist Dinâmico dos Requisitos */}
      {mostrarChecklist && (
        <ul className="space-y-1 pt-1 border-t border-zinc-800/60 text-xs">
          {itensChecklist.map((item, index) => (
            <li
              key={index}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                item.atendido ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {item.atendido ? (
                <Check size={13} className="shrink-0 text-emerald-400" />
              ) : (
                <X size={13} className="shrink-0 text-zinc-600" />
              )}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;

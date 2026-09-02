/**
 * Utilitário para validação e cálculo de força de senhas no Frontend
 * 
 * Critérios exigidos pelos padrões modernos:
 * - Mínimo de 8 caracteres
 * - Pelo menos uma letra maiúscula (A-Z)
 * - Pelo menos uma letra minúscula (a-z)
 * - Pelo menos um número (0-9)
 * - Pelo menos um caractere especial (!@#$%^&*()_+-=[]{};':"|,.<>/? etc.)
 */

export interface CriteriosSenha {
  temMinimo: boolean;
  temMaiuscula: boolean;
  temMinuscula: boolean;
  temNumero: boolean;
  temEspecial: boolean;
}

export type NivelForca = 'fraca' | 'media' | 'forte';

export interface ResultadoForcaSenha {
  criterios: CriteriosSenha;
  pontuacao: number; // 0 a 5
  porcentagem: number; // 0 a 100%
  nivel: NivelForca;
  label: string;
  valida: boolean;
}

// Regex para caracteres especiais comumente aceitos
export const REGEX_ESPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

/**
 * Avalia os critérios e calcula a força da senha em tempo real
 * @param senha - Senha digitada pelo usuário
 * @returns Objeto com status dos critérios, nível de força e validação
 */
export function avaliarSenha(senha: string): ResultadoForcaSenha {
  const str = senha || '';

  const criterios: CriteriosSenha = {
    temMinimo: str.length >= 8,
    temMaiuscula: /[A-Z]/.test(str),
    temMinuscula: /[a-z]/.test(str),
    temNumero: /[0-9]/.test(str),
    temEspecial: REGEX_ESPECIAL.test(str),
  };

  // Calcula quantos critérios foram atendidos (0 a 5)
  const pontuacao = Object.values(criterios).filter(Boolean).length;
  const porcentagem = (pontuacao / 5) * 100;

  let nivel: NivelForca = 'fraca';
  let label = 'Muito Fraca';

  if (pontuacao <= 2) {
    nivel = 'fraca';
    label = 'Fraca';
  } else if (pontuacao <= 4) {
    nivel = 'media';
    label = 'Média';
  } else {
    nivel = 'forte';
    label = 'Forte';
  }

  // A senha só é considerada válida para submissão se cumprir TODOS os 5 critérios
  const valida = pontuacao === 5;

  return {
    criterios,
    pontuacao,
    porcentagem,
    nivel,
    label,
    valida,
  };
}

export default {
  avaliarSenha,
  REGEX_ESPECIAL,
};

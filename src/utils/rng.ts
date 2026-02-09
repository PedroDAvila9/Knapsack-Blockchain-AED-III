/**
 * Gerador de Números Pseudo-Aleatórios Determinístico
 *
 * Implementa o algoritmo Mulberry32, um PRNG rápido e de boa qualidade
 * que permite reprodutibilidade através de uma semente (seed).
 *
 * Referência: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */

/**
 * Interface para o gerador de números aleatórios.
 */
export interface RandomGenerator {
  /** Retorna um número float no intervalo [0, 1) */
  random(): number;
  /** Retorna um inteiro no intervalo [min, max] (inclusivo) */
  randomInt(min: number, max: number): number;
  /** Retorna true com probabilidade p */
  randomBool(p?: number): boolean;
  /** Seleciona um elemento aleatório de um array */
  randomChoice<T>(array: T[]): T;
  /** Embaralha um array in-place (Fisher-Yates) */
  shuffle<T>(array: T[]): T[];
  /** Retorna a semente atual */
  getSeed(): number;
}

/**
 * Cria um gerador Mulberry32 com a semente especificada.
 *
 * Mulberry32 é um PRNG de 32 bits com período de 2^32.
 * Produz resultados idênticos para a mesma semente.
 *
 * Complexidade:
 * - Todas as operações: O(1), exceto shuffle que é O(n)
 *
 * @param seed - Semente para inicializar o gerador
 * @returns Objeto RandomGenerator
 */
export function createRng(seed: number): RandomGenerator {
  // Estado interno do gerador
  let state = seed >>> 0; // Converte para unsigned 32-bit

  /**
   * Função Mulberry32 core.
   * Gera o próximo número pseudo-aleatório.
   */
  function mulberry32(): number {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /**
     * Retorna um número float no intervalo [0, 1).
     */
    random(): number {
      return mulberry32();
    },

    /**
     * Retorna um inteiro no intervalo [min, max] (inclusivo).
     *
     * @param min - Valor mínimo
     * @param max - Valor máximo
     */
    randomInt(min: number, max: number): number {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(mulberry32() * (max - min + 1)) + min;
    },

    /**
     * Retorna true com probabilidade p.
     *
     * @param p - Probabilidade (padrão: 0.5)
     */
    randomBool(p = 0.5): boolean {
      return mulberry32() < p;
    },

    /**
     * Seleciona um elemento aleatório de um array.
     *
     * @param array - Array de elementos
     * @throws Error se o array estiver vazio
     */
    randomChoice<T>(array: T[]): T {
      if (array.length === 0) {
        throw new Error('Não é possível escolher de um array vazio');
      }
      const index = Math.floor(mulberry32() * array.length);
      return array[index];
    },

    /**
     * Embaralha um array in-place usando Fisher-Yates.
     *
     * Complexidade: O(n)
     *
     * @param array - Array a ser embaralhado
     * @returns O mesmo array embaralhado
     */
    shuffle<T>(array: T[]): T[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(mulberry32() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    /**
     * Retorna a semente original.
     */
    getSeed(): number {
      return seed;
    },
  };
}

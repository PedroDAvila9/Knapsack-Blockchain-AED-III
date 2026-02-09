/**
 * Módulo de Algoritmos
 *
 * Exporta todos os algoritmos implementados para o problema da mochila.
 */

export * from './greedy';
export * from './fptas';
export * from './simulated-annealing';
export * from './exact';

import { KnapsackInstance, KnapsackSolution } from '../model';
import { greedyByDensity, greedyByFee, greedy2Approx } from './greedy';
import { fptas, FptasParams } from './fptas';
import { simulatedAnnealing, SimulatedAnnealingParams } from './simulated-annealing';

/**
 * Tipos de algoritmos disponíveis.
 *
 * - greedy-density: Guloso por densidade (sem garantia sozinho)
 * - greedy-fee: Guloso por fee absoluto (baseline, sem garantia)
 * - greedy-2approx: Guloso 2-aproximação (garantia ≥ 50% OPT)
 * - fptas: FPTAS (garantia ≥ (1-ε) OPT)
 * - sa: Simulated Annealing (heurístico/Monte Carlo)
 */
export type AlgorithmType =
  | 'greedy-density'
  | 'greedy-fee'
  | 'greedy-2approx'
  | 'fptas'
  | 'sa';

/**
 * Parâmetros genéricos para execução de algoritmo.
 */
export interface AlgorithmParams {
  /** Tipo do algoritmo */
  type: AlgorithmType;
  /** Epsilon para FPTAS (obrigatório se type === 'fptas') */
  epsilon?: number;
  /** Semente para SA (obrigatório se type === 'sa') */
  seed?: number;
  /** Máximo de iterações para SA (opcional) */
  maxIterations?: number;
}

/**
 * Executa o algoritmo especificado na instância.
 *
 * @param instance - Instância do problema
 * @param params - Parâmetros do algoritmo
 * @returns Solução encontrada
 */
export function runAlgorithm(
  instance: KnapsackInstance,
  params: AlgorithmParams
): KnapsackSolution {
  switch (params.type) {
    case 'greedy-density':
      return greedyByDensity(instance);

    case 'greedy-fee':
      return greedyByFee(instance);

    case 'greedy-2approx':
      return greedy2Approx(instance);

    case 'fptas': {
      if (params.epsilon === undefined) {
        throw new Error('Parâmetro epsilon é obrigatório para FPTAS');
      }
      const fptasParams: FptasParams = {
        epsilon: params.epsilon,
      };
      return fptas(instance, fptasParams);
    }

    case 'sa': {
      if (params.seed === undefined) {
        throw new Error('Parâmetro seed é obrigatório para SA');
      }
      const saParams: SimulatedAnnealingParams = {
        seed: params.seed,
        maxIterations: params.maxIterations ?? 20000,
      };
      return simulatedAnnealing(instance, saParams);
    }

    default:
      throw new Error(`Algoritmo desconhecido: ${params.type}`);
  }
}

/**
 * Retorna descrição legível do algoritmo.
 */
export function getAlgorithmDescription(type: AlgorithmType): string {
  switch (type) {
    case 'greedy-density':
      return 'Guloso por Densidade (sem garantia)';
    case 'greedy-fee':
      return 'Guloso por Taxa (baseline)';
    case 'greedy-2approx':
      return 'Guloso 2-Aproximação (≥50% OPT)';
    case 'fptas':
      return 'FPTAS (≥(1-ε) OPT)';
    case 'sa':
      return 'Simulated Annealing (Monte Carlo)';
    default:
      return 'Desconhecido';
  }
}

/**
 * Lista todos os algoritmos disponíveis.
 */
export const AVAILABLE_ALGORITHMS: AlgorithmType[] = [
  'greedy-density',
  'greedy-fee',
  'greedy-2approx',
  'fptas',
  'sa',
];

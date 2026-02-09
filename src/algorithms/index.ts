/**
 * Módulo de Algoritmos
 *
 * Exporta os 4 algoritmos implementados para o problema da mochila:
 * - Guloso
 * - Programação Dinâmica
 * - Monte Carlo (Simulated Annealing)
 * - FPTAS
 */

export * from './greedy';
export * from './fptas';
export * from './simulated-annealing';
export * from './exact';

import { KnapsackInstance, KnapsackSolution } from '../model';
import { greedy } from './greedy';
import { fptas, FptasParams } from './fptas';
import { simulatedAnnealing, SimulatedAnnealingParams } from './simulated-annealing';
import { dynamicProgramming } from './exact';

/**
 * Tipos de algoritmos disponíveis.
 */
export type AlgorithmType = 'greedy' | 'dp' | 'sa' | 'fptas';

/**
 * Parâmetros para execução de algoritmo.
 */
export interface AlgorithmParams {
  type: AlgorithmType;
  epsilon?: number;      // Para FPTAS
  seed?: number;         // Para SA
  maxIterations?: number; // Para SA
}

/**
 * Executa o algoritmo especificado.
 */
export function runAlgorithm(
  instance: KnapsackInstance,
  params: AlgorithmParams
): KnapsackSolution {
  switch (params.type) {
    case 'greedy':
      return greedy(instance);

    case 'dp':
      return dynamicProgramming(instance);

    case 'fptas': {
      if (params.epsilon === undefined) {
        throw new Error('Parâmetro epsilon é obrigatório para FPTAS');
      }
      const fptasParams: FptasParams = { epsilon: params.epsilon };
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
 * Descrição dos algoritmos.
 */
export function getAlgorithmDescription(type: AlgorithmType): string {
  switch (type) {
    case 'greedy':
      return 'Guloso';
    case 'dp':
      return 'Programação Dinâmica (ótima)';
    case 'sa':
      return 'Simulated Annealing (Monte Carlo)';
    case 'fptas':
      return 'FPTAS (aproximativo)';
    default:
      return 'Desconhecido';
  }
}

/**
 * Lista de algoritmos disponíveis.
 */
export const AVAILABLE_ALGORITHMS: AlgorithmType[] = ['greedy', 'dp', 'sa', 'fptas'];

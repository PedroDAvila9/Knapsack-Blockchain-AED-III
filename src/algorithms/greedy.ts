/**
 * Algoritmos Gulosos (Greedy) para o Problema da Mochila
 *
 * Implementa três variantes do algoritmo guloso:
 * 1. Greedy por Densidade (fee/vsize) - Heurística rápida, SEM garantia sozinho
 * 2. Greedy por Valor (fee) - Baseline simples, sem garantia
 * 3. Greedy 2-Aproximação - Combina densidade + melhor item único (garantia ≥ 50% OPT)
 *
 * Complexidade de Tempo: O(n log n) devido à ordenação
 * Complexidade de Espaço: O(n) para armazenar a ordenação
 *
 * IMPORTANTE: O algoritmo guloso por densidade SOZINHO NÃO garante 50% do ótimo.
 * Para obter a garantia clássica de 2-aproximação, usamos greedy2Approx() que
 * retorna max(greedyDensity, melhorItemÚnico).
 *
 * Referência: Korte & Vygen, "Combinatorial Optimization", Cap. 17.
 */

import { Transaction, KnapsackInstance, KnapsackSolution } from '../model';

/**
 * Tipo de ordenação para o algoritmo guloso.
 */
export type GreedySortType = 'density' | 'fee';

/**
 * Parâmetros do algoritmo guloso.
 */
export interface GreedyParams {
  /** Tipo de ordenação */
  sortBy: GreedySortType;
}

/**
 * Algoritmo Guloso por Densidade (Fee Rate).
 *
 * Ordena transações por fee/vsize (taxa por byte) decrescente e
 * seleciona enquanto couber na capacidade.
 *
 * Esta é a heurística clássica para o problema da mochila fracionária.
 * Para mochila 0/1, NÃO garante 50% do ótimo sozinho.
 *
 * ATENÇÃO: Para garantia de 2-aproximação, use greedy2Approx().
 *
 * @param instance - Instância do problema
 * @returns Solução encontrada
 */
export function greedyByDensity(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;

  // Cria cópia ordenada por densidade (feeRate) decrescente
  // Complexidade: O(n log n)
  const sorted = [...transactions].sort((a, b) => b.feeRate - a.feeRate);

  return selectGreedy(sorted, capacity);
}

/**
 * Algoritmo Guloso por Valor (Fee Total).
 *
 * Ordena transações por fee total decrescente e seleciona
 * enquanto couber na capacidade.
 *
 * Esta heurística prioriza transações com maior taxa absoluta,
 * independente do tamanho. Geralmente inferior à ordenação por
 * densidade, mas pode ser melhor em casos específicos.
 *
 * Sem garantia teórica de aproximação.
 *
 * @param instance - Instância do problema
 * @returns Solução encontrada
 */
export function greedyByFee(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;

  // Cria cópia ordenada por fee total decrescente
  // Complexidade: O(n log n)
  const sorted = [...transactions].sort((a, b) => b.fee - a.fee);

  return selectGreedy(sorted, capacity);
}

/**
 * Encontra o melhor item único que cabe na capacidade.
 *
 * @param transactions - Lista de transações
 * @param capacity - Capacidade disponível
 * @returns Solução com apenas o melhor item, ou vazia se nenhum couber
 */
function findBestSingleItem(
  transactions: Transaction[],
  capacity: number
): KnapsackSolution {
  let bestTx: Transaction | null = null;

  for (const tx of transactions) {
    if (tx.vsize <= capacity) {
      if (bestTx === null || tx.fee > bestTx.fee) {
        bestTx = tx;
      }
    }
  }

  if (bestTx === null) {
    return {
      selectedTxids: [],
      totalWeight: 0,
      totalValue: 0,
      txCount: 0,
      fillRatio: 0,
    };
  }

  return {
    selectedTxids: [bestTx.txid],
    totalWeight: bestTx.vsize,
    totalValue: bestTx.fee,
    txCount: 1,
    fillRatio: bestTx.vsize / capacity,
  };
}

/**
 * Algoritmo Guloso 2-Aproximação.
 *
 * Combina o algoritmo guloso por densidade com a seleção do melhor item único.
 * Retorna a melhor das duas soluções.
 *
 * GARANTIA TEÓRICA: Solução ≥ 50% do ótimo (2-aproximação).
 *
 * Prova (informal):
 * - Seja OPT o valor ótimo
 * - O guloso por densidade obtém pelo menos OPT - max_fee (onde max_fee é a
 *   maior fee de um item que não coube)
 * - O melhor item único tem valor ≥ max_fee (se max_fee existir e couber)
 * - Portanto, max(greedy, bestSingle) ≥ OPT/2
 *
 * Complexidade: O(n log n)
 *
 * @param instance - Instância do problema
 * @returns Solução com garantia de 2-aproximação
 */
export function greedy2Approx(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;

  // Executa guloso por densidade
  const greedySolution = greedyByDensity(instance);

  // Encontra melhor item único
  const bestSingle = findBestSingleItem(transactions, capacity);

  // Retorna o melhor dos dois
  if (bestSingle.totalValue > greedySolution.totalValue) {
    return bestSingle;
  }

  return greedySolution;
}

/**
 * Função auxiliar que seleciona transações na ordem dada
 * enquanto couberem na capacidade.
 *
 * Complexidade: O(n)
 *
 * @param sortedTransactions - Transações já ordenadas
 * @param capacity - Capacidade disponível
 * @returns Solução com transações selecionadas
 */
function selectGreedy(
  sortedTransactions: Transaction[],
  capacity: number
): KnapsackSolution {
  const selectedTxids: string[] = [];
  let totalWeight = 0;
  let totalValue = 0;

  for (const tx of sortedTransactions) {
    // Verifica se cabe na capacidade restante
    if (totalWeight + tx.vsize <= capacity) {
      selectedTxids.push(tx.txid);
      totalWeight += tx.vsize;
      totalValue += tx.fee;
    }
  }

  return {
    selectedTxids,
    totalWeight,
    totalValue,
    txCount: selectedTxids.length,
    fillRatio: totalWeight / capacity,
  };
}

/**
 * Função unificada que executa o algoritmo guloso com parâmetros.
 *
 * @param instance - Instância do problema
 * @param params - Parâmetros do algoritmo
 * @returns Solução encontrada
 */
export function greedy(
  instance: KnapsackInstance,
  params: GreedyParams
): KnapsackSolution {
  if (params.sortBy === 'density') {
    return greedyByDensity(instance);
  } else {
    return greedyByFee(instance);
  }
}

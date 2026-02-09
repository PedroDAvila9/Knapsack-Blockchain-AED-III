/**
 * Algoritmo Guloso (Greedy) para o Problema da Mochila
 *
 * Ordena itens por densidade (valor/peso) e seleciona enquanto couber.
 *
 * Complexidade: O(n log n)
 */

import { KnapsackInstance, KnapsackSolution } from '../model';

/**
 * Algoritmo Guloso por Densidade.
 *
 * Ordena transações por fee/vsize decrescente e seleciona enquanto couber.
 *
 * @param instance - Instância do problema
 * @returns Solução encontrada
 */
export function greedy(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;

  // Ordena por densidade decrescente
  const sorted = [...transactions].sort((a, b) => b.feeRate - a.feeRate);

  const selectedTxids: string[] = [];
  let totalWeight = 0;
  let totalValue = 0;

  for (const tx of sorted) {
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

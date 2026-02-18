/**
 * FPTAS (Fully Polynomial-Time Approximation Scheme) para o Problema da Mochila
 * Complexidade de Tempo: O(n² / ε)
 * Complexidade de Espaço: O(n / ε)
 *
 * Referência:
 * Ibarra, O. H., & Kim, C. E. (1975).
 * "Fast approximation algorithms for the knapsack and sum of subset problems."
 */

import { KnapsackInstance, KnapsackSolution, createEmptySolution } from '../model';

export interface FptasParams {
  epsilon: number;
}

export function fptas(
  instance: KnapsackInstance,
  params: FptasParams
): KnapsackSolution {
  const { transactions, capacity } = instance;
  const { epsilon } = params;

  const n = transactions.length;

  if (n === 0) return createEmptySolution();

  // Encontra P_max (maior lucro/fee)
  let pMax = 0;
  for (const tx of transactions) {
    if (tx.fee > pMax) {
      pMax = tx.fee;
    }
  }

  // PCalcula fator de escala K
  const K = Math.max(1, (epsilon * pMax) / n);

  // Escala os lucros
  const scaledProfits = new Uint32Array(n);
  let totalScaledProfit = 0;

  for (let i = 0; i < n; i++) {
    scaledProfits[i] = Math.floor(transactions[i].fee / K);
    totalScaledProfit += scaledProfits[i];
  }

  // DP para minimizar peso dado lucro escalado
  const maxProfit = totalScaledProfit + 1;

  const dp = new Float64Array(maxProfit);
  dp.fill(Infinity);
  dp[0] = 0;

  const parent = new Int32Array(maxProfit);
  const itemUsed = new Int32Array(maxProfit);
  parent.fill(-1);
  itemUsed.fill(-1);

  for (let i = 0; i < n; i++) {
    const weight = transactions[i].vsize;
    const profit = scaledProfits[i];

    // Percorre de trás para frente para evitar usar o mesmo item duas vezes
    for (let p = maxProfit - 1; p >= profit; p--) {
      const prevProfit = p - profit;
      const newWeight = dp[prevProfit] + weight;

      if (newWeight < dp[p] && newWeight <= capacity) {
        dp[p] = newWeight;
        parent[p] = prevProfit;
        itemUsed[p] = i;
      }
    }
  }

  // Encontra o maior lucro escalado alcançável
  let bestScaledProfit = 0;
  for (let p = maxProfit - 1; p >= 0; p--) {
    if (dp[p] <= capacity) {
      bestScaledProfit = p;
      break;
    }
  }

  // Backtracking
  const seen = new Set<number>();
  const selectedIndices: number[] = [];
  let currentProfit = bestScaledProfit;

  while (currentProfit > 0 && itemUsed[currentProfit] !== -1) {
    const idx = itemUsed[currentProfit];

    if (seen.has(idx)) {
      throw new Error(`Item ${idx} usado mais de uma vez no backtracking`);
    }

    seen.add(idx);
    selectedIndices.push(idx);
    currentProfit = parent[currentProfit];
  }

  const selectedTxids: string[] = [];
  let totalWeight = 0;
  let totalValue = 0;

  for (const idx of selectedIndices) {
    const tx = transactions[idx];
    selectedTxids.push(tx.txid);
    totalWeight += tx.vsize;
    totalValue += tx.fee;
  }

  return {
    selectedTxids,
    totalWeight,
    totalValue,
    txCount: selectedTxids.length,
    fillRatio: totalWeight / capacity,
  };
}
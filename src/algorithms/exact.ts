/**
 * Soluções Exatas para o Problema da Mochila
 * 1. FORÇA BRUTA (bruteForce)
 * 2. PROGRAMAÇÃO DINÂMICA (dynamicProgramming)
*/

import { KnapsackInstance, KnapsackSolution, createEmptySolution } from '../model';

/**
 * Limite máximo de itens para força bruta.
 * 2^25 ≈ 33 milhões de subconjuntos.
 */
const MAX_ITEMS_BRUTE_FORCE = 25;

/**
 * Limite máximo de capacidade para DP.
 * O(n × W) com W = 100.000 ainda é viável.
 */
const MAX_CAPACITY_DP = 100_000;

export function bruteForce(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;
  const n = transactions.length;

  if (n === 0) return createEmptySolution();

  if (n > MAX_ITEMS_BRUTE_FORCE) {
    throw new Error(
      `Força bruta suporta no máximo ${MAX_ITEMS_BRUTE_FORCE} itens. `
    );
  }

  let bestValue = 0;
  let bestWeight = 0;
  let bestMask = 0;

  const totalSubsets = 1 << n;

  for (let mask = 0; mask < totalSubsets; mask++) {
    let weight = 0;
    let value = 0;

    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        weight += transactions[i].vsize;
        value += transactions[i].fee;
      }
    }

    if (weight <= capacity && value > bestValue) {
      bestValue = value;
      bestWeight = weight;
      bestMask = mask;
    }
  }

  const selectedTxids: string[] = [];
  for (let i = 0; i < n; i++) {
    if (bestMask & (1 << i)) {
      selectedTxids.push(transactions[i].txid);
    }
  }

  return {
    selectedTxids,
    totalWeight: bestWeight,
    totalValue: bestValue,
    txCount: selectedTxids.length,
    fillRatio: bestWeight / capacity,
  };
}

export function dynamicProgramming(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;
  const n = transactions.length;

  if (n === 0) return createEmptySolution();

  // Verifica se capacidade é razoável para DP
  if (capacity > MAX_CAPACITY_DP) {
    throw new Error(
      `Capacidade ${capacity} muito grande para DP exato (máx: ${MAX_CAPACITY_DP}). `
    );
  }

  const dp = new Float64Array(capacity + 1);
  dp.fill(0);

  const keep: boolean[][] = [];
  for (let w = 0; w <= capacity; w++) {
    keep.push(new Array(n).fill(false));
  }

  for (let i = 0; i < n; i++) {
    const w = transactions[i].vsize;
    const v = transactions[i].fee;

    for (let c = capacity; c >= w; c--) {
      if (dp[c - w] + v > dp[c]) {
        dp[c] = dp[c - w] + v;
        for (let j = 0; j < i; j++) {
          keep[c][j] = keep[c - w][j];
        }
        keep[c][i] = true;
      }
    }
  }

  let bestWeight = 0;
  let bestValue = 0;
  for (let w = 0; w <= capacity; w++) {
    if (dp[w] > bestValue) {
      bestValue = dp[w];
      bestWeight = w;
    }
  }

  const selectedTxids: string[] = [];
  let actualWeight = 0;

  for (let i = 0; i < n; i++) {
    if (keep[bestWeight][i]) {
      selectedTxids.push(transactions[i].txid);
      actualWeight += transactions[i].vsize;
    }
  }

  return {
    selectedTxids,
    totalWeight: actualWeight,
    totalValue: bestValue,
    txCount: selectedTxids.length,
    fillRatio: actualWeight / capacity,
  };
}

export function isDPFeasible(capacity: number): boolean {
  return capacity <= MAX_CAPACITY_DP;
}

export function isBruteForceFeasible(n: number): boolean {
  return n <= MAX_ITEMS_BRUTE_FORCE;
}

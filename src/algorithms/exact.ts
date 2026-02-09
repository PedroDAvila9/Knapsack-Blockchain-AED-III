/**
 * Soluções Exatas para o Problema da Mochila
 *
 * Este módulo contém dois algoritmos exatos:
 *
 * 1. FORÇA BRUTA (bruteForce)
 *    - Enumera todos os 2^n subconjuntos
 *    - Complexidade: O(2^n) - exponencial
 *    - Uso: APENAS para testes unitários com n ≤ 25
 *
 * 2. PROGRAMAÇÃO DINÂMICA (dynamicProgramming)
 *    - Algoritmo clássico de Bellman
 *    - Complexidade: O(n × W) - pseudo-polinomial
 *    - Uso: Instâncias pequenas para obter ótimo de referência
 *    - Limitação: W (capacidade) deve ser razoável (≤ 100.000)
 *
 * ATENÇÃO: Nenhum destes deve ser usado em produção com instâncias grandes.
 * Para n grande ou W grande, use FPTAS ou heurísticas.
 */

import { KnapsackInstance, KnapsackSolution } from '../model';

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

/**
 * Resolve o problema da mochila 0/1 por FORÇA BRUTA.
 *
 * Enumera todos os 2^n subconjuntos possíveis e retorna
 * aquele com maior valor que respeita a capacidade.
 *
 * Complexidade de Tempo: O(2^n) - EXPONENCIAL
 * Complexidade de Espaço: O(n)
 *
 * USO: APENAS para testes unitários com instâncias muito pequenas.
 *
 * @param instance - Instância do problema
 * @returns Solução ÓTIMA
 * @throws Error se n > MAX_ITEMS_BRUTE_FORCE
 */
export function bruteForce(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;
  const n = transactions.length;

  if (n === 0) {
    return {
      selectedTxids: [],
      totalWeight: 0,
      totalValue: 0,
      txCount: 0,
      fillRatio: 0,
    };
  }

  if (n > MAX_ITEMS_BRUTE_FORCE) {
    throw new Error(
      `Força bruta suporta no máximo ${MAX_ITEMS_BRUTE_FORCE} itens. ` +
        `Recebido: ${n}. Use dynamicProgramming() ou FPTAS.`
    );
  }

  let bestValue = 0;
  let bestWeight = 0;
  let bestMask = 0;

  // Enumera todos os 2^n subconjuntos usando máscara de bits
  const totalSubsets = 1 << n;

  for (let mask = 0; mask < totalSubsets; mask++) {
    let weight = 0;
    let value = 0;

    // Calcula peso e valor do subconjunto atual
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        weight += transactions[i].vsize;
        value += transactions[i].fee;
      }
    }

    // Verifica se é viável e melhor que a melhor solução
    if (weight <= capacity && value > bestValue) {
      bestValue = value;
      bestWeight = weight;
      bestMask = mask;
    }
  }

  // Reconstrói a solução a partir da máscara
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

/**
 * Resolve o problema da mochila 0/1 usando PROGRAMAÇÃO DINÂMICA.
 *
 * Algoritmo clássico de Bellman (1957) para o problema da mochila.
 * Encontra a solução ÓTIMA com complexidade pseudo-polinomial.
 *
 * Complexidade de Tempo: O(n × W) onde W é a capacidade
 * Complexidade de Espaço: O(n × W) para rastreamento
 *
 * USO: Instâncias pequenas/médias para obter ótimo de referência
 * e calcular gap (%) das heurísticas e aproximações.
 *
 * LIMITAÇÃO: A capacidade W deve ser ≤ 100.000 para ser viável.
 * Para W = 1.000.000 (bloco Bitcoin real), use FPTAS.
 *
 * @param instance - Instância do problema
 * @returns Solução ÓTIMA
 * @throws Error se capacidade > MAX_CAPACITY_DP
 */
export function dynamicProgramming(instance: KnapsackInstance): KnapsackSolution {
  const { transactions, capacity } = instance;
  const n = transactions.length;

  if (n === 0) {
    return {
      selectedTxids: [],
      totalWeight: 0,
      totalValue: 0,
      txCount: 0,
      fillRatio: 0,
    };
  }

  // Verifica se capacidade é razoável para DP
  if (capacity > MAX_CAPACITY_DP) {
    throw new Error(
      `Capacidade ${capacity} muito grande para DP exato (máx: ${MAX_CAPACITY_DP}). ` +
        `Use FPTAS ou reduza a capacidade para testes.`
    );
  }

  // DP: dp[w] = valor máximo usando peso até w
  const dp = new Float64Array(capacity + 1);
  dp.fill(0);

  // Para rastrear itens selecionados
  // keep[w][i] = true se item i foi incluído para obter dp[w]
  const keep: boolean[][] = [];
  for (let w = 0; w <= capacity; w++) {
    keep.push(new Array(n).fill(false));
  }

  // Processa cada item (algoritmo de Bellman)
  for (let i = 0; i < n; i++) {
    const w = transactions[i].vsize;
    const v = transactions[i].fee;

    // Percorre de trás para frente (evita usar mesmo item 2x)
    for (let c = capacity; c >= w; c--) {
      if (dp[c - w] + v > dp[c]) {
        dp[c] = dp[c - w] + v;
        // Copia seleção anterior e adiciona item atual
        for (let j = 0; j < i; j++) {
          keep[c][j] = keep[c - w][j];
        }
        keep[c][i] = true;
      }
    }
  }

  // Encontra melhor capacidade usada
  let bestWeight = 0;
  let bestValue = 0;
  for (let w = 0; w <= capacity; w++) {
    if (dp[w] > bestValue) {
      bestValue = dp[w];
      bestWeight = w;
    }
  }

  // Reconstrói solução
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

/**
 * Verifica se é viável usar DP exato para uma instância.
 *
 * @param capacity - Capacidade da mochila
 * @returns true se DP é viável
 */
export function isDPFeasible(capacity: number): boolean {
  return capacity <= MAX_CAPACITY_DP;
}

/**
 * Verifica se é viável usar força bruta para uma instância.
 *
 * @param n - Número de itens
 * @returns true se força bruta é viável
 */
export function isBruteForceFeasible(n: number): boolean {
  return n <= MAX_ITEMS_BRUTE_FORCE;
}

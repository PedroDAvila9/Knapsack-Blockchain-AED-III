/**
 * FPTAS (Fully Polynomial-Time Approximation Scheme) para o Problema da Mochila
 *
 * O FPTAS é um esquema de aproximação que produz uma solução com valor
 * pelo menos (1 - ε) vezes o valor ótimo, onde ε é um parâmetro configurável.
 *
 * Ideia Central:
 * 1. Escalar os lucros para reduzir o espaço de busca
 * 2. Aplicar programação dinâmica nos lucros escalados
 * 3. A escala introduz erro limitado por ε
 *
 * Complexidade de Tempo: O(n² / ε)
 * Complexidade de Espaço: O(n / ε)
 *
 * Referência: Ibarra, O. H., & Kim, C. E. (1975).
 * "Fast approximation algorithms for the knapsack and sum of subset problems."
 */

import { KnapsackInstance, KnapsackSolution, createEmptySolution } from '../model';

/**
 * Parâmetros do algoritmo FPTAS.
 */
export interface FptasParams {
  /** Fator de aproximação ε ∈ (0, 1]. Menor = mais preciso, mais lento. */
  epsilon: number;
}

/**
 * Implementa o FPTAS para o problema da mochila 0/1.
 *
 * Algoritmo:
 * 1. Encontra P_max = max{p_i} (maior lucro)
 * 2. Define K = (ε * P_max) / n
 * 3. Escala lucros: p'_i = floor(p_i / K)
 * 4. Executa DP para minimizar peso dado um lucro alvo
 * 5. Retorna conjunto de itens com maior lucro original
 *
 * @param instance - Instância do problema
 * @param params - Parâmetros do FPTAS
 * @returns Solução aproximada
 */
export function fptas(
  instance: KnapsackInstance,
  params: FptasParams
): KnapsackSolution {
  const { transactions, capacity } = instance;
  const { epsilon } = params;

  const n = transactions.length;

  if (n === 0) return createEmptySolution();

  // Passo 1: Encontra P_max (maior lucro/fee)
  let pMax = 0;
  for (const tx of transactions) {
    if (tx.fee > pMax) {
      pMax = tx.fee;
    }
  }

  // Passo 2: Calcula fator de escala K
  // K = (ε * P_max) / n
  // Se K < 1, não faz sentido escalar (já são valores pequenos)
  const K = Math.max(1, (epsilon * pMax) / n);

  // Passo 3: Escala os lucros
  // p'_i = floor(p_i / K)
  const scaledProfits = new Uint32Array(n);
  let totalScaledProfit = 0;

  for (let i = 0; i < n; i++) {
    scaledProfits[i] = Math.floor(transactions[i].fee / K);
    totalScaledProfit += scaledProfits[i];
  }

  // Passo 4: DP para minimizar peso dado lucro escalado
  // dp[p] = peso mínimo para obter lucro escalado exatamente p
  // Inicializa com Infinity (impossível)
  const maxProfit = totalScaledProfit + 1;

  // Usa Float64Array para suportar valores grandes de peso
  const dp = new Float64Array(maxProfit);
  dp.fill(Infinity);
  dp[0] = 0;

  // Para rastrear quais itens foram selecionados
  // keep[p] = bitmask ou lista de itens usados para obter lucro p
  // Por eficiência, usamos uma abordagem de backtracking
  const parent = new Int32Array(maxProfit);
  const itemUsed = new Int32Array(maxProfit);
  parent.fill(-1);
  itemUsed.fill(-1);

  // Processa cada item
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

  // Passo 5: Encontra o maior lucro escalado alcançável
  let bestScaledProfit = 0;
  for (let p = maxProfit - 1; p >= 0; p--) {
    if (dp[p] <= capacity) {
      bestScaledProfit = p;
      break;
    }
  }

  // Passo 6: Reconstrói a solução via backtracking
  const selectedIndices: number[] = [];
  let currentProfit = bestScaledProfit;

  while (currentProfit > 0 && itemUsed[currentProfit] !== -1) {
    selectedIndices.push(itemUsed[currentProfit]);
    currentProfit = parent[currentProfit];
  }

  // Calcula valores reais (não escalados)
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

/**
 * Versão otimizada do FPTAS usando arrays tipados para melhor performance.
 *
 * Esta implementação usa uma abordagem ligeiramente diferente:
 * - Usa DP por peso ao invés de por lucro
 * - Mais eficiente em memória para instâncias com muitos itens
 *
 * @param instance - Instância do problema
 * @param params - Parâmetros do FPTAS
 * @returns Solução aproximada
 */
export function fptasOptimized(
  instance: KnapsackInstance,
  params: FptasParams
): KnapsackSolution {
  const { transactions, capacity } = instance;
  const { epsilon } = params;

  const n = transactions.length;

  if (n === 0) return createEmptySolution();

  // Encontra P_max
  let pMax = 0;
  for (const tx of transactions) {
    if (tx.fee > pMax) {
      pMax = tx.fee;
    }
  }

  // Fator de escala
  const K = Math.max(1, (epsilon * pMax) / n);

  // Escala lucros e calcula limite superior
  const scaledProfits: number[] = [];
  let sumScaled = 0;

  for (let i = 0; i < n; i++) {
    const scaled = Math.floor(transactions[i].fee / K);
    scaledProfits.push(scaled);
    sumScaled += scaled;
  }

  // Limite de lucro escalado
  const profitLimit = sumScaled + 1;

  // DP: peso mínimo para cada lucro escalado
  const minWeight = new Float64Array(profitLimit);
  minWeight.fill(Infinity);
  minWeight[0] = 0;

  // Rastreamento para reconstrução
  const selection: boolean[][] = [];
  for (let p = 0; p < profitLimit; p++) {
    selection.push([]);
  }

  // Processa itens
  for (let i = 0; i < n; i++) {
    const w = transactions[i].vsize;
    const p = scaledProfits[i];

    // Atualiza de trás para frente
    for (let profit = profitLimit - 1; profit >= p; profit--) {
      const prevProfit = profit - p;
      const newWeight = minWeight[prevProfit] + w;

      if (newWeight < minWeight[profit] && newWeight <= capacity) {
        minWeight[profit] = newWeight;
        // Copia seleção anterior e adiciona item atual
        selection[profit] = [...selection[prevProfit], true];
        // Marca posição do item
        while (selection[profit].length <= i) {
          selection[profit].push(false);
        }
        selection[profit][i] = true;
      }
    }
  }

  // Encontra melhor solução
  let bestProfit = 0;
  for (let p = profitLimit - 1; p >= 0; p--) {
    if (minWeight[p] <= capacity) {
      bestProfit = p;
      break;
    }
  }

  // Reconstrói solução
  const selectedTxids: string[] = [];
  let totalWeight = 0;
  let totalValue = 0;

  // Abordagem alternativa: recalcula itens selecionados
  // Isso é mais eficiente em memória
  let remainingWeight = minWeight[bestProfit];
  let remainingProfit = bestProfit;

  for (let i = n - 1; i >= 0 && remainingProfit > 0; i--) {
    const w = transactions[i].vsize;
    const p = scaledProfits[i];

    if (
      remainingProfit >= p &&
      Math.abs(minWeight[remainingProfit - p] + w - remainingWeight) < 0.001
    ) {
      selectedTxids.push(transactions[i].txid);
      totalWeight += transactions[i].vsize;
      totalValue += transactions[i].fee;
      remainingWeight -= w;
      remainingProfit -= p;
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
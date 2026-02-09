/**
 * Métricas de Avaliação
 *
 * Funções para calcular e comparar métricas de soluções.
 */

import { KnapsackSolution, KnapsackInstance, AlgorithmResult } from '../model';

/**
 * Métricas calculadas para uma solução.
 */
export interface SolutionMetrics {
  /** Valor total (fee em sats) */
  totalValue: number;
  /** Peso total (vsize) */
  totalWeight: number;
  /** Taxa de preenchimento (weight/capacity) */
  fillRatio: number;
  /** Número de transações selecionadas */
  txCount: number;
  /** Fee rate médio das transações selecionadas */
  avgFeeRate: number;
  /** Fee rate mínimo das transações selecionadas */
  minFeeRate: number;
  /** Fee rate máximo das transações selecionadas */
  maxFeeRate: number;
}

/**
 * Calcula métricas detalhadas de uma solução.
 *
 * @param solution - Solução a analisar
 * @param instance - Instância do problema
 * @returns Métricas calculadas
 */
export function calculateMetrics(
  solution: KnapsackSolution,
  instance: KnapsackInstance
): SolutionMetrics {
  // Cria mapa de transações por txid
  const txMap = new Map(instance.transactions.map((tx) => [tx.txid, tx]));

  // Calcula fee rates das selecionadas
  const feeRates: number[] = [];
  for (const txid of solution.selectedTxids) {
    const tx = txMap.get(txid);
    if (tx) {
      feeRates.push(tx.feeRate);
    }
  }

  // Estatísticas de fee rate
  const avgFeeRate =
    feeRates.length > 0
      ? feeRates.reduce((a, b) => a + b, 0) / feeRates.length
      : 0;

  const minFeeRate = feeRates.length > 0 ? Math.min(...feeRates) : 0;
  const maxFeeRate = feeRates.length > 0 ? Math.max(...feeRates) : 0;

  return {
    totalValue: solution.totalValue,
    totalWeight: solution.totalWeight,
    fillRatio: solution.fillRatio,
    txCount: solution.txCount,
    avgFeeRate,
    minFeeRate,
    maxFeeRate,
  };
}

/**
 * Compara duas soluções e retorna o gap percentual.
 *
 * Gap = (referência - solução) / referência * 100
 *
 * @param solution - Solução a comparar
 * @param reference - Solução de referência (geralmente ótima)
 * @returns Gap percentual (0 = igual, positivo = pior, negativo = melhor)
 */
export function calculateGap(
  solution: KnapsackSolution,
  reference: KnapsackSolution
): number {
  if (reference.totalValue === 0) {
    return solution.totalValue === 0 ? 0 : -100;
  }

  return ((reference.totalValue - solution.totalValue) / reference.totalValue) * 100;
}

/**
 * Formata valor em satoshis para string legível.
 *
 * @param sats - Valor em satoshis
 * @returns String formatada (ex: "1.234.567 sats" ou "0.01234567 BTC")
 */
export function formatSats(sats: number): string {
  if (sats >= 100_000_000) {
    const btc = sats / 100_000_000;
    return `${btc.toFixed(8)} BTC`;
  }
  return `${sats.toLocaleString('pt-BR')} sats`;
}

/**
 * Formata peso em vbytes para string legível.
 *
 * @param vbytes - Tamanho em vbytes
 * @returns String formatada (ex: "500 KB" ou "1.2 MB")
 */
export function formatVbytes(vbytes: number): string {
  if (vbytes >= 1_000_000) {
    return `${(vbytes / 1_000_000).toFixed(2)} MvB`;
  }
  if (vbytes >= 1_000) {
    return `${(vbytes / 1_000).toFixed(2)} KvB`;
  }
  return `${vbytes} vB`;
}

/**
 * Imprime um resumo formatado de uma solução.
 *
 * @param result - Resultado do algoritmo
 * @param instance - Instância do problema
 */
export function printSolutionSummary(
  result: AlgorithmResult,
  instance: KnapsackInstance
): void {
  const metrics = calculateMetrics(result.solution, instance);

  console.log(`\n=== ${result.algorithm} ===`);
  console.log(`Valor total: ${formatSats(metrics.totalValue)}`);
  console.log(`Peso usado: ${formatVbytes(metrics.totalWeight)}`);
  console.log(`Preenchimento: ${(metrics.fillRatio * 100).toFixed(2)}%`);
  console.log(`Transações: ${metrics.txCount}`);
  console.log(`Fee rate médio: ${metrics.avgFeeRate.toFixed(2)} sats/vB`);
  console.log(`Fee rate range: ${metrics.minFeeRate.toFixed(2)} - ${metrics.maxFeeRate.toFixed(2)} sats/vB`);
  console.log(`Tempo: ${result.runtimeMs.toFixed(2)}ms`);
}
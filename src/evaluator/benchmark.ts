/**
 * Executor de Benchmark
 *
 * Executa todos os algoritmos em uma instância e coleta métricas.
 */

import {
  KnapsackInstance,
  AlgorithmResult,
  validateSolution,
  createInstance,
  SnapshotFile,
} from '../model';
import {
  AVAILABLE_ALGORITHMS,
  runAlgorithm,
  getAlgorithmDescription,
} from '../algorithms';
import { timeExecution, BenchmarkRow, writeBenchmarkCsv } from '../utils';
import { calculateGap, printSolutionSummary } from './metrics';

/**
 * Configuração do benchmark.
 */
export interface BenchmarkConfig {
  /** Capacidade da mochila em vbytes */
  capacity: number;
  /** Epsilon para FPTAS (padrão: 0.1) */
  epsilon?: number;
  /** Semente para SA (padrão: 42) */
  seed?: number;
  /** Máximo de iterações para SA (padrão: 20000) */
  maxIterations?: number;
  /** Se deve imprimir progresso */
  verbose?: boolean;
}

/**
 * Resultado completo do benchmark.
 */
export interface BenchmarkResult {
  /** Resultados por algoritmo */
  results: AlgorithmResult[];
  /** Melhor resultado encontrado */
  best: AlgorithmResult;
  /** Configuração usada */
  config: BenchmarkConfig;
  /** Informações da instância */
  instanceInfo: {
    transactionCount: number;
    capacity: number;
    totalAvailableValue: number;
    totalAvailableWeight: number;
  };
}

/**
 * Executa benchmark completo em uma instância.
 *
 * @param instance - Instância do problema
 * @param config - Configuração do benchmark
 * @returns Resultado completo do benchmark
 */
export function runBenchmark(
  instance: KnapsackInstance,
  config: BenchmarkConfig
): BenchmarkResult {
  const {
    capacity,
    epsilon = 0.1,
    seed = 42,
    maxIterations = 20000,
    verbose = true,
  } = config;

  if (verbose) {
    console.log('\n=== Iniciando Benchmark ===');
    console.log(`Transações: ${instance.transactions.length}`);
    console.log(`Capacidade: ${capacity.toLocaleString()} vbytes`);
    console.log(`Epsilon (FPTAS): ${epsilon}`);
    console.log(`Seed (SA): ${seed}`);
    console.log(`Max Iterações (SA): ${maxIterations}`);
  }

  const results: AlgorithmResult[] = [];

  for (const algType of AVAILABLE_ALGORITHMS) {
    if (verbose) {
      console.log(`\nExecutando: ${getAlgorithmDescription(algType)}...`);
    }

    // Define parâmetros específicos
    const params: Record<string, unknown> = { type: algType };

    if (algType === 'fptas') {
      params.epsilon = epsilon;
    } else if (algType === 'sa') {
      params.seed = seed;
      params.maxIterations = maxIterations;
    }

    // Executa com medição de tempo
    try {
      const { result: solution, elapsedMs } = timeExecution(() =>
        runAlgorithm(instance, {
          type: algType,
          epsilon,
          seed,
          maxIterations,
        })
      );

      // Valida solução
      const validation = validateSolution(instance, solution);
      if (!validation.valid) {
        console.error(`ERRO: Solução inválida de ${algType}:`);
        validation.errors.forEach((err) => console.error(`  - ${err}`));
      }

      const result: AlgorithmResult = {
        algorithm: algType,
        solution,
        runtimeMs: elapsedMs,
        params,
      };

      results.push(result);

      if (verbose) {
        printSolutionSummary(result, instance);
      }
    } catch (error) {
      if (verbose) {
        console.log(`  ⚠ Pulando ${algType}: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      }
      continue;
    }
  }

  // Encontra melhor resultado
  const best = results.reduce((a, b) =>
    a.solution.totalValue > b.solution.totalValue ? a : b
  );

  // Calcula gaps relativos ao melhor
  if (verbose) {
    console.log('\n=== Comparação (Gap relativo ao melhor) ===');
    for (const result of results) {
      const gap = calculateGap(result.solution, best.solution);
      console.log(
        `${result.algorithm}: ${gap === 0 ? 'MELHOR' : `${gap.toFixed(2)}% abaixo`}`
      );
    }
  }

  // Informações da instância
  const instanceInfo = {
    transactionCount: instance.transactions.length,
    capacity,
    totalAvailableValue: instance.transactions.reduce((sum, tx) => sum + tx.fee, 0),
    totalAvailableWeight: instance.transactions.reduce((sum, tx) => sum + tx.vsize, 0),
  };

  return {
    results,
    best,
    config: { capacity, epsilon, seed, maxIterations },
    instanceInfo,
  };
}

/**
 * Converte resultados do benchmark para formato CSV.
 *
 * @param benchmarkResult - Resultado do benchmark
 * @returns Array de linhas para CSV
 */
export function benchmarkToCsvRows(benchmarkResult: BenchmarkResult): BenchmarkRow[] {
  return benchmarkResult.results.map((result) => ({
    algorithm: result.algorithm,
    fee_total_sats: result.solution.totalValue,
    weight_used: result.solution.totalWeight,
    fill_ratio: Math.round(result.solution.fillRatio * 10000) / 10000,
    tx_count: result.solution.txCount,
    runtime_ms: Math.round(result.runtimeMs * 100) / 100,
    params: JSON.stringify(result.params),
  }));
}

/**
 * Executa benchmark e salva resultados em CSV.
 *
 * @param snapshot - Arquivo de snapshot
 * @param capacity - Capacidade da mochila
 * @param outputPath - Caminho do arquivo CSV de saída
 * @param config - Configuração adicional
 */
export function runBenchmarkAndSave(
  snapshot: SnapshotFile,
  capacity: number,
  outputPath: string,
  config: Partial<BenchmarkConfig> = {}
): BenchmarkResult {
  const instance = createInstance(snapshot, capacity);

  const result = runBenchmark(instance, {
    capacity,
    ...config,
  });

  const rows = benchmarkToCsvRows(result);
  writeBenchmarkCsv(outputPath, rows);

  console.log(`\nResultados salvos em: ${outputPath}`);

  return result;
}
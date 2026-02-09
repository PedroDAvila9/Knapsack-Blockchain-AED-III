/**
 * Comando: benchmark
 *
 * Executa todos os algoritmos em um snapshot e compara resultados.
 */

import { Command } from 'commander';
import { loadSnapshot } from '../../utils';
import { runBenchmarkAndSave } from '../../evaluator';

export const benchmarkCommand = new Command('benchmark')
  .description('Executa todos os algoritmos e compara resultados')
  .requiredOption(
    '-i, --snapshot <path>',
    'Caminho do arquivo de snapshot JSON'
  )
  .option(
    '-c, --capacity <number>',
    'Capacidade da mochila em vbytes',
    '1000000'
  )
  .option('-e, --epsilon <number>', 'Epsilon para FPTAS (0 < ε ≤ 1)', '0.1')
  .option('-s, --seed <number>', 'Semente para algoritmos probabilísticos', '42')
  .option(
    '-m, --maxIters <number>',
    'Máximo de iterações para SA',
    '20000'
  )
  .option(
    '-o, --out <path>',
    'Caminho do arquivo CSV de saída',
    'results/benchmark.csv'
  )
  .action(async (options) => {
    try {
      // Parseia parâmetros numéricos
      const capacity = parseInt(options.capacity, 10);
      const epsilon = parseFloat(options.epsilon);
      const seed = parseInt(options.seed, 10);
      const maxIterations = parseInt(options.maxIters, 10);

      // Validações
      if (isNaN(capacity) || capacity <= 0) {
        console.error(`Capacidade inválida: ${options.capacity}`);
        process.exit(1);
      }

      if (isNaN(epsilon) || epsilon <= 0 || epsilon > 1) {
        console.error(`Epsilon inválido: ${options.epsilon}`);
        process.exit(1);
      }

      if (isNaN(seed)) {
        console.error(`Seed inválido: ${options.seed}`);
        process.exit(1);
      }

      console.log('=== Bitcoin Block Builder - Benchmark ===\n');

      // Carrega snapshot
      console.log(`Carregando snapshot: ${options.snapshot}`);
      const snapshot = loadSnapshot(options.snapshot);
      console.log(`Transações carregadas: ${snapshot.transactions.length}`);

      // Executa benchmark
      const result = runBenchmarkAndSave(snapshot, capacity, options.out, {
        epsilon,
        seed,
        maxIterations,
        verbose: true,
      });

      // Resumo final
      console.log('\n=== Resumo Final ===');
      console.log(`Melhor algoritmo: ${result.best.algorithm}`);
      console.log(`Melhor valor: ${result.best.solution.totalValue.toLocaleString()} sats`);
      console.log(`Transações: ${result.instanceInfo.transactionCount}`);
      console.log(`Capacidade: ${capacity.toLocaleString()} vbytes`);

      console.log('\nBenchmark concluído com sucesso!');
    } catch (error) {
      console.error('\nErro durante o benchmark:');
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });
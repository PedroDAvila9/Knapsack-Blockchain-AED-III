/**
 * Comando: run
 *
 * Executa um algoritmo de mochila em um snapshot.
 */

import { Command } from 'commander';
import { loadSnapshot, saveSolution, writeCsv } from '../../utils';
import { createInstance, validateSolution } from '../../model';
import {
  runAlgorithm,
  AlgorithmType,
  AVAILABLE_ALGORITHMS,
  getAlgorithmDescription,
} from '../../algorithms';
import { timeExecution } from '../../utils';
import { calculateMetrics, formatSats, formatVbytes } from '../../evaluator';

export const runCommand = new Command('run')
  .description('Executa um algoritmo de mochila em um snapshot')
  .requiredOption(
    '-i, --snapshot <path>',
    'Caminho do arquivo de snapshot JSON'
  )
  .option(
    '-c, --capacity <number>',
    'Capacidade da mochila em vbytes',
    '1000000'
  )
  .requiredOption(
    '-a, --alg <algorithm>',
    `Algoritmo a usar: ${AVAILABLE_ALGORITHMS.join(', ')}`
  )
  .option('-e, --epsilon <number>', 'Epsilon para FPTAS (0 < ε ≤ 1)', '0.1')
  .option('-s, --seed <number>', 'Semente para algoritmos probabilísticos', '42')
  .option(
    '-m, --maxIters <number>',
    'Máximo de iterações para SA',
    '20000'
  )
  .option('-o, --out <path>', 'Caminho base para arquivos de saída')
  .action(async (options) => {
    try {
      // Valida algoritmo
      const alg = options.alg as AlgorithmType;
      if (!AVAILABLE_ALGORITHMS.includes(alg)) {
        console.error(`Algoritmo inválido: ${options.alg}`);
        console.error(`Disponíveis: ${AVAILABLE_ALGORITHMS.join(', ')}`);
        process.exit(1);
      }

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

      if (alg === 'fptas' && (isNaN(epsilon) || epsilon <= 0 || epsilon > 1)) {
        console.error(`Epsilon inválido para FPTAS: ${options.epsilon}`);
        console.error('Use um valor entre 0 (exclusivo) e 1 (inclusivo)');
        process.exit(1);
      }

      if (alg === 'sa' && isNaN(seed)) {
        console.error(`Seed inválido: ${options.seed}`);
        process.exit(1);
      }

      console.log('=== Bitcoin Block Builder - Execução ===\n');

      // Carrega snapshot
      console.log(`Carregando snapshot: ${options.snapshot}`);
      const snapshot = loadSnapshot(options.snapshot);
      console.log(`Transações carregadas: ${snapshot.transactions.length}`);

      // Cria instância
      const instance = createInstance(snapshot, capacity);

      // Executa algoritmo
      console.log(`\nExecutando: ${getAlgorithmDescription(alg)}`);
      console.log(`Capacidade: ${capacity.toLocaleString()} vbytes`);

      if (alg === 'fptas') {
        console.log(`Epsilon: ${epsilon}`);
      } else if (alg === 'sa') {
        console.log(`Seed: ${seed}`);
        console.log(`Max iterações: ${maxIterations}`);
      }

      const { result: solution, elapsedMs } = timeExecution(() =>
        runAlgorithm(instance, {
          type: alg,
          epsilon,
          seed,
          maxIterations,
        })
      );

      // Valida solução
      const validation = validateSolution(instance, solution);
      if (!validation.valid) {
        console.error('\nERRO: Solução inválida!');
        validation.errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
      }

      // Calcula métricas
      const metrics = calculateMetrics(solution, instance);

      // Exibe resultados
      console.log('\n=== Resultado ===');
      console.log(`Valor total: ${formatSats(metrics.totalValue)}`);
      console.log(`Peso usado: ${formatVbytes(metrics.totalWeight)}`);
      console.log(`Preenchimento: ${(metrics.fillRatio * 100).toFixed(2)}%`);
      console.log(`Transações: ${metrics.txCount}`);
      console.log(`Fee rate médio: ${metrics.avgFeeRate.toFixed(2)} sats/vB`);
      console.log(`Tempo: ${elapsedMs.toFixed(2)}ms`);

      // Salva resultados se especificado
      if (options.out) {
        const basePath = options.out;
        const jsonPath = basePath.endsWith('.json')
          ? basePath
          : `${basePath}.json`;
        const csvPath = basePath.endsWith('.json')
          ? basePath.replace('.json', '.csv')
          : `${basePath}.csv`;

        // Salva JSON com solução completa
        saveSolution(jsonPath, {
          algorithm: alg,
          params: { epsilon, seed, maxIterations, capacity },
          selectedTxids: solution.selectedTxids,
          totalWeight: solution.totalWeight,
          totalValue: solution.totalValue,
          txCount: solution.txCount,
          fillRatio: solution.fillRatio,
          runtimeMs: elapsedMs,
          timestamp: new Date().toISOString(),
        });
        console.log(`\nSolução salva em: ${jsonPath}`);

        // Salva CSV resumido
        writeCsv(
          csvPath,
          [
            {
              algorithm: alg,
              fee_total_sats: solution.totalValue,
              weight_used: solution.totalWeight,
              fill_ratio: solution.fillRatio,
              tx_count: solution.txCount,
              runtime_ms: elapsedMs,
              capacity,
              epsilon: alg === 'fptas' ? epsilon : '',
              seed: alg === 'sa' ? seed : '',
            },
          ],
          [
            'algorithm',
            'fee_total_sats',
            'weight_used',
            'fill_ratio',
            'tx_count',
            'runtime_ms',
            'capacity',
            'epsilon',
            'seed',
          ]
        );
        console.log(`Resumo CSV salvo em: ${csvPath}`);
      }

      console.log('\nExecução concluída com sucesso!');
    } catch (error) {
      console.error('\nErro durante a execução:');
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });
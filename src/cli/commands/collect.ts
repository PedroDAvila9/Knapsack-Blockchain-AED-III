/**
 * Comando: collect
 *
 * Coleta um snapshot do mempool Bitcoin de uma API pública.
 */

import { Command } from 'commander';
import { collectAndSave, DataSource } from '../../collector';

export const collectCommand = new Command('collect')
  .description('Coleta um snapshot do mempool Bitcoin')
  .requiredOption(
    '-s, --source <source>',
    'Fonte de dados (mempoolspace ou blockstream)',
    'mempoolspace'
  )
  .requiredOption(
    '-o, --out <path>',
    'Caminho do arquivo de saída JSON',
    'snapshots/mempool.json'
  )
  .option(
    '-n, --topN <number>',
    'Número máximo de transações a coletar',
    '5000'
  )
  .action(async (options) => {
    try {
      // Valida fonte
      const source = options.source as DataSource;
      if (source !== 'mempoolspace' && source !== 'blockstream') {
        console.error(`Fonte inválida: ${options.source}`);
        console.error('Use: mempoolspace ou blockstream');
        process.exit(1);
      }

      // Parseia topN
      const topN = parseInt(options.topN, 10);
      if (isNaN(topN) || topN <= 0) {
        console.error(`Valor inválido para topN: ${options.topN}`);
        process.exit(1);
      }

      console.log('=== Bitcoin Block Builder - Coleta de Dados ===\n');

      // Coleta e salva
      await collectAndSave(
        {
          source,
          topN,
          onProgress: (collected, total) => {
            const pct = ((collected / total) * 100).toFixed(1);
            process.stdout.write(`\rProgresso: ${collected}/${total} (${pct}%)`);
          },
        },
        options.out
      );

      console.log('\nColeta concluída com sucesso!');
    } catch (error) {
      console.error('\nErro durante a coleta:');
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });
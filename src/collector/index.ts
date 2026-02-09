/**
 * Módulo Coletor de Dados
 *
 * Fornece uma interface unificada para coletar transações do mempool
 * usando diferentes APIs (mempool.space ou Blockstream).
 */

import * as mempoolspace from './mempoolspace';
import * as blockstream from './blockstream';
import { Transaction, SnapshotFile, SnapshotMetadata } from '../model';
import { saveSnapshot } from '../utils';

/** Fontes de dados disponíveis */
export type DataSource = 'mempoolspace' | 'blockstream';

/**
 * Opções para coleta de snapshot.
 */
export interface CollectOptions {
  /** Fonte de dados */
  source: DataSource;
  /** Número máximo de transações a coletar */
  topN: number;
  /** Callback de progresso */
  onProgress?: (collected: number, total: number) => void;
}

/**
 * Coleta um snapshot do mempool.
 *
 * @param options - Opções de coleta
 * @returns Arquivo de snapshot com transações
 */
export async function collectSnapshot(
  options: CollectOptions
): Promise<SnapshotFile> {
  const { source, topN, onProgress } = options;

  console.log(`\nIniciando coleta via ${source}...`);
  console.log(`Limite: ${topN} transações\n`);

  let transactions: Transaction[];
  let totalMempoolSize: number | undefined;

  try {
    if (source === 'mempoolspace') {
      totalMempoolSize = await mempoolspace.getMempoolSize();
      transactions = await mempoolspace.collectTransactions(topN, onProgress);
    } else {
      totalMempoolSize = await blockstream.getMempoolSize();
      transactions = await blockstream.collectTransactions(topN, onProgress);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Falha na coleta via ${source}: ${error.message}`);
    }
    throw error;
  }

  // Cria metadata
  const metadata: SnapshotMetadata = {
    source,
    collectedAt: new Date().toISOString(),
    totalMempoolSize,
    snapshotSize: transactions.length,
  };

  // Cria snapshot file
  const snapshot: SnapshotFile = {
    version: '1.0.0',
    metadata,
    transactions,
  };

  return snapshot;
}

/**
 * Coleta e salva um snapshot em arquivo.
 *
 * @param options - Opções de coleta
 * @param outputPath - Caminho do arquivo de saída
 */
export async function collectAndSave(
  options: CollectOptions,
  outputPath: string
): Promise<SnapshotFile> {
  const snapshot = await collectSnapshot(options);

  console.log(`\nSalvando snapshot em ${outputPath}...`);
  saveSnapshot(outputPath, snapshot);

  console.log('\n=== Resumo da Coleta ===');
  console.log(`Fonte: ${snapshot.metadata.source}`);
  console.log(`Coletado em: ${snapshot.metadata.collectedAt}`);
  console.log(`Transações no mempool: ${snapshot.metadata.totalMempoolSize ?? 'N/A'}`);
  console.log(`Transações no snapshot: ${snapshot.metadata.snapshotSize}`);

  if (snapshot.transactions.length > 0) {
    const totalFees = snapshot.transactions.reduce((sum, tx) => sum + tx.fee, 0);
    const totalVsize = snapshot.transactions.reduce((sum, tx) => sum + tx.vsize, 0);
    const avgFeeRate =
      snapshot.transactions.reduce((sum, tx) => sum + tx.feeRate, 0) /
      snapshot.transactions.length;

    console.log(`Taxa total: ${totalFees.toLocaleString()} sats`);
    console.log(`Tamanho total: ${totalVsize.toLocaleString()} vbytes`);
    console.log(`Fee rate médio: ${avgFeeRate.toFixed(2)} sats/vB`);
  }

  console.log(`Arquivo salvo: ${outputPath}`);

  return snapshot;
}

// Re-exporta módulos individuais para uso direto
export { mempoolspace, blockstream };
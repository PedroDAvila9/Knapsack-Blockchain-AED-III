/**
 * Modelo do Problema da Mochila (Knapsack)
 *
 * Define os tipos para representar uma instância do problema 0/1 Knapsack
 * aplicado à seleção de transações Bitcoin.
 */

import { Transaction } from './transaction';

export interface KnapsackInstance {
  transactions: Transaction[];
  capacity: number;
  metadata?: SnapshotMetadata;
}

export interface SnapshotMetadata {
  source: 'mempoolspace' | 'blockstream';
  collectedAt: string;
  totalMempoolSize?: number;
  snapshotSize: number;
}

export interface KnapsackSolution {
  selectedTxids: string[];
  totalWeight: number;
  totalValue: number;
  txCount: number;
  fillRatio: number;
}

export function createEmptySolution(): KnapsackSolution {
  return {
    selectedTxids: [],
    totalWeight: 0,
    totalValue: 0,
    txCount: 0,
    fillRatio: 0,
  };
}

export interface AlgorithmResult {
  algorithm: string;
  solution: KnapsackSolution;
  runtimeMs: number;
  params: Record<string, unknown>;
}

export interface SnapshotFile {
  version: string;
  metadata: SnapshotMetadata;
  transactions: Transaction[];
}

export function createInstance(
  snapshot: SnapshotFile,
  capacity: number
): KnapsackInstance {
  return {
    transactions: snapshot.transactions,
    capacity,
    metadata: snapshot.metadata,
  };
}

export function validateSolution(
  instance: KnapsackInstance,
  solution: KnapsackSolution
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const txMap = new Map(instance.transactions.map((tx) => [tx.txid, tx]));

  const uniqueTxids = new Set(solution.selectedTxids);
  if (uniqueTxids.size !== solution.selectedTxids.length) {
    errors.push('Solução contém txids duplicados');
  }

  for (const txid of solution.selectedTxids) {
    if (!txMap.has(txid)) {
      errors.push(`Txid não encontrado na instância: ${txid.substring(0, 16)}...`);
    }
  }

  let actualWeight = 0;
  let actualValue = 0;
  for (const txid of solution.selectedTxids) {
    const tx = txMap.get(txid);
    if (tx) {
      actualWeight += tx.vsize;
      actualValue += tx.fee;
    }
  }

  if (actualWeight > instance.capacity) {
    errors.push(
      `Peso total (${actualWeight}) excede capacidade (${instance.capacity})`
    );
  }

  if (actualWeight !== solution.totalWeight) {
    errors.push(
      `Peso reportado (${solution.totalWeight}) difere do calculado (${actualWeight})`
    );
  }

  if (actualValue !== solution.totalValue) {
    errors.push(
      `Valor reportado (${solution.totalValue}) difere do calculado (${actualValue})`
    );
  }

  if (solution.txCount !== solution.selectedTxids.length) {
    errors.push(
      `Contagem reportada (${solution.txCount}) difere do número de txids (${solution.selectedTxids.length})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

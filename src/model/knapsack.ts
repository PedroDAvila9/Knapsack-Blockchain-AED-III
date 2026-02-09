/**
 * Modelo do Problema da Mochila (Knapsack)
 *
 * Define os tipos para representar uma instância do problema 0/1 Knapsack
 * aplicado à seleção de transações Bitcoin.
 */

import { Transaction } from './transaction';

/**
 * Representa uma instância do problema da mochila 0/1.
 *
 * No contexto de construção de blocos Bitcoin:
 * - Itens = transações do mempool
 * - Peso de cada item = vsize da transação
 * - Valor de cada item = taxa (fee) da transação
 * - Capacidade = tamanho máximo do bloco em vbytes
 */
export interface KnapsackInstance {
  /** Lista de transações disponíveis para seleção */
  transactions: Transaction[];
  /** Capacidade máxima em vbytes (padrão: 1.000.000) */
  capacity: number;
  /** Metadados opcionais sobre o snapshot */
  metadata?: SnapshotMetadata;
}

/**
 * Metadados sobre o snapshot do mempool.
 */
export interface SnapshotMetadata {
  /** Fonte dos dados (mempoolspace ou blockstream) */
  source: 'mempoolspace' | 'blockstream';
  /** Timestamp de quando o snapshot foi coletado (ISO 8601) */
  collectedAt: string;
  /** Número total de transações no mempool original */
  totalMempoolSize?: number;
  /** Número de transações incluídas no snapshot (topN) */
  snapshotSize: number;
}

/**
 * Resultado de uma execução de algoritmo de mochila.
 */
export interface KnapsackSolution {
  /** IDs das transações selecionadas */
  selectedTxids: string[];
  /** Peso total usado (soma dos vsizes) */
  totalWeight: number;
  /** Valor total (soma das taxas em satoshis) */
  totalValue: number;
  /** Número de transações selecionadas */
  txCount: number;
  /** Taxa de preenchimento (totalWeight / capacity) */
  fillRatio: number;
}

/**
 * Resultado completo de uma execução, incluindo métricas de performance.
 */
export interface AlgorithmResult {
  /** Nome do algoritmo utilizado */
  algorithm: string;
  /** Solução encontrada */
  solution: KnapsackSolution;
  /** Tempo de execução em milissegundos */
  runtimeMs: number;
  /** Parâmetros específicos do algoritmo */
  params: Record<string, unknown>;
}

/**
 * Formato do arquivo de snapshot JSON salvo em disco.
 */
export interface SnapshotFile {
  /** Versão do formato do arquivo */
  version: string;
  /** Metadados do snapshot */
  metadata: SnapshotMetadata;
  /** Lista de transações */
  transactions: Transaction[];
}

/**
 * Cria uma instância do problema da mochila a partir de um snapshot.
 *
 * @param snapshot - Arquivo de snapshot carregado
 * @param capacity - Capacidade da mochila em vbytes
 * @returns Instância do problema da mochila
 */
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

/**
 * Valida uma solução do problema da mochila.
 *
 * Verifica:
 * 1. Peso total não excede capacidade
 * 2. Soma dos valores está correta
 * 3. Não há txids duplicados
 * 4. Todos os txids existem no conjunto original
 *
 * @param instance - Instância do problema
 * @param solution - Solução a ser validada
 * @returns Objeto com status de validação e mensagens de erro
 */
export function validateSolution(
  instance: KnapsackInstance,
  solution: KnapsackSolution
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const txMap = new Map(instance.transactions.map((tx) => [tx.txid, tx]));

  // Verifica duplicatas
  const uniqueTxids = new Set(solution.selectedTxids);
  if (uniqueTxids.size !== solution.selectedTxids.length) {
    errors.push('Solução contém txids duplicados');
  }

  // Verifica se todos os txids existem
  for (const txid of solution.selectedTxids) {
    if (!txMap.has(txid)) {
      errors.push(`Txid não encontrado na instância: ${txid.substring(0, 16)}...`);
    }
  }

  // Calcula peso e valor reais
  let actualWeight = 0;
  let actualValue = 0;
  for (const txid of solution.selectedTxids) {
    const tx = txMap.get(txid);
    if (tx) {
      actualWeight += tx.vsize;
      actualValue += tx.fee;
    }
  }

  // Verifica peso total
  if (actualWeight > instance.capacity) {
    errors.push(
      `Peso total (${actualWeight}) excede capacidade (${instance.capacity})`
    );
  }

  // Verifica se peso reportado está correto
  if (actualWeight !== solution.totalWeight) {
    errors.push(
      `Peso reportado (${solution.totalWeight}) difere do calculado (${actualWeight})`
    );
  }

  // Verifica se valor reportado está correto
  if (actualValue !== solution.totalValue) {
    errors.push(
      `Valor reportado (${solution.totalValue}) difere do calculado (${actualValue})`
    );
  }

  // Verifica contagem de transações
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

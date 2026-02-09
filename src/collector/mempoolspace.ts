/**
 * Cliente da API mempool.space
 *
 * Coleta dados de transações do mempool Bitcoin usando a API pública
 * do mempool.space (https://mempool.space/api).
 *
 * Documentação da API: https://mempool.space/docs/api
 */

import { Transaction, createTransaction } from '../model';

/** URL base da API mempool.space */
const BASE_URL = 'https://mempool.space/api';

/** Tempo limite para requisições HTTP em ms */
const REQUEST_TIMEOUT = 30000;

/**
 * Estrutura de resposta da API mempool.space para /mempool.
 */
interface MempoolInfo {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: [number, number][];
}

/**
 * Estrutura de transação da API mempool.space.
 * Nota: A API retorna 'weight', não 'vsize' diretamente.
 * vsize = ceil(weight / 4)
 */
interface MempoolTx {
  txid: string;
  fee: number;
  weight: number;
}

/**
 * Faz uma requisição HTTP GET com timeout.
 *
 * @param url - URL para requisição
 * @returns Resposta parseada como JSON
 */
async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'bitcoin-block-builder/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Obtém informações gerais sobre o mempool.
 *
 * @returns Informações do mempool (contagem, tamanho, etc.)
 */
export async function getMempoolInfo(): Promise<MempoolInfo> {
  return fetchJson<MempoolInfo>(`${BASE_URL}/mempool`);
}

/**
 * Obtém lista de txids do mempool.
 *
 * @returns Array de txids
 */
export async function getMempoolTxids(): Promise<string[]> {
  return fetchJson<string[]>(`${BASE_URL}/mempool/txids`);
}

/**
 * Obtém detalhes de uma transação específica.
 *
 * @param txid - ID da transação
 * @returns Dados da transação
 */
export async function getTransaction(txid: string): Promise<MempoolTx> {
  return fetchJson<MempoolTx>(`${BASE_URL}/tx/${txid}`);
}

/**
 * Obtém transações recentes do mempool ordenadas por taxa.
 *
 * A API mempool.space não fornece diretamente as top N transações,
 * então precisamos buscar os txids e depois os detalhes.
 *
 * @param topN - Número máximo de transações a coletar
 * @param onProgress - Callback opcional para progresso
 * @returns Array de transações normalizadas
 */
export async function collectTransactions(
  topN: number,
  onProgress?: (collected: number, total: number) => void
): Promise<Transaction[]> {
  console.log('Buscando lista de txids do mempool...');

  // Obtém lista de txids
  const txids = await getMempoolTxids();
  console.log(`Mempool contém ${txids.length} transações`);

  // Limita ao topN solicitado
  const targetTxids = txids.slice(0, topN);
  console.log(`Coletando detalhes de ${targetTxids.length} transações...`);

  const transactions: Transaction[] = [];
  const batchSize = 10; // Busca 10 por vez para evitar sobrecarga

  for (let i = 0; i < targetTxids.length; i += batchSize) {
    const batch = targetTxids.slice(i, i + batchSize);

    // Busca batch em paralelo
    const results = await Promise.allSettled(
      batch.map((txid) => getTransaction(txid))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const tx = result.value;
        // vsize = ceil(weight / 4) conforme especificação Bitcoin
        const vsize = Math.ceil(tx.weight / 4);
        transactions.push(createTransaction(tx.txid, vsize, tx.fee));
      }
    }

    // Reporta progresso
    if (onProgress) {
      onProgress(Math.min(i + batchSize, targetTxids.length), targetTxids.length);
    }

    // Pequeno delay para não sobrecarregar a API
    if (i + batchSize < targetTxids.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Ordena por fee rate decrescente
  transactions.sort((a, b) => b.feeRate - a.feeRate);

  console.log(`Coletadas ${transactions.length} transações com sucesso`);
  return transactions;
}

/**
 * Obtém o tamanho atual do mempool.
 *
 * @returns Número de transações no mempool
 */
export async function getMempoolSize(): Promise<number> {
  const info = await getMempoolInfo();
  return info.count;
}
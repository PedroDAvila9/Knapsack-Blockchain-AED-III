/**
 * Cliente da API Blockstream (Esplora)
 *
 * Coleta dados de transações do mempool Bitcoin usando a API pública
 * do Blockstream (https://blockstream.info/api).
 *
 * Documentação: https://github.com/Blockstream/esplora/blob/master/API.md
 */

import { Transaction, createTransaction } from '../model';

/** URL base da API Blockstream */
const BASE_URL = 'https://blockstream.info/api';

/** Tempo limite para requisições HTTP em ms */
const REQUEST_TIMEOUT = 30000;

/**
 * Estrutura de transação da API Blockstream.
 */
interface BlockstreamTx {
  txid: string;
  fee: number;
  weight: number;
  size: number;
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
 * Obtém lista de txids do mempool.
 *
 * @returns Array de txids
 */
export async function getMempoolTxids(): Promise<string[]> {
  return fetchJson<string[]>(`${BASE_URL}/mempool/txids`);
}

/**
 * Obtém transações recentes do mempool.
 * A API retorna as transações mais recentes.
 *
 * @returns Array de transações
 */
export async function getRecentTransactions(): Promise<BlockstreamTx[]> {
  return fetchJson<BlockstreamTx[]>(`${BASE_URL}/mempool/recent`);
}

/**
 * Obtém detalhes de uma transação específica.
 *
 * @param txid - ID da transação
 * @returns Dados da transação
 */
export async function getTransaction(txid: string): Promise<BlockstreamTx> {
  return fetchJson<BlockstreamTx>(`${BASE_URL}/tx/${txid}`);
}

/**
 * Converte weight units para vsize.
 * vsize = ceil(weight / 4)
 *
 * @param weight - Peso em weight units
 * @returns Tamanho virtual em vbytes
 */
function weightToVsize(weight: number): number {
  return Math.ceil(weight / 4);
}

/**
 * Coleta transações do mempool via API Blockstream.
 *
 * @param topN - Número máximo de transações a coletar
 * @param onProgress - Callback opcional para progresso
 * @returns Array de transações normalizadas
 */
export async function collectTransactions(
  topN: number,
  onProgress?: (collected: number, total: number) => void
): Promise<Transaction[]> {
  console.log('Buscando lista de txids do mempool (Blockstream)...');

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
        // Converte weight para vsize
        const vsize = weightToVsize(tx.weight);
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
  const txids = await getMempoolTxids();
  return txids.length;
}
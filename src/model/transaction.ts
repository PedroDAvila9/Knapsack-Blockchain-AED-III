/**
 * Modelo de Transação
 *
 * Representa uma transação do mempool Bitcoin para o problema da mochila.
 * Peso = vsize (tamanho virtual em vbytes)
 * Valor = taxa em satoshis
 */

import { z } from 'zod';

/**
 * Schema Zod para validar dados de transação das respostas da API.
 * Garante que todos os campos obrigatórios estão presentes e corretamente tipados.
 */
export const TransactionSchema = z.object({
  txid: z.string().length(64, 'ID da transação deve ter 64 caracteres hexadecimais'),
  vsize: z.number().int().positive('Tamanho virtual deve ser um inteiro positivo'),
  fee: z.number().int().nonnegative('Taxa deve ser um inteiro não-negativo'),
  feeRate: z.number().positive().optional(), // sats/vB
});

/**
 * Representa uma única transação do mempool como item da mochila.
 */
export interface Transaction {
  /** ID da transação (string hexadecimal de 64 caracteres) */
  txid: string;
  /** Tamanho virtual em vbytes (peso para a mochila) */
  vsize: number;
  /** Taxa em satoshis (valor para a mochila) */
  fee: number;
  /** Taxa por vbyte em sats/vB (derivado: fee/vsize) */
  feeRate: number;
}

/**
 * Cria um objeto Transaction com taxa calculada.
 *
 * @param txid - ID da transação
 * @param vsize - Tamanho virtual em vbytes
 * @param fee - Taxa em satoshis
 * @returns Objeto Transaction
 */
export function createTransaction(
  txid: string,
  vsize: number,
  fee: number
): Transaction {
  return {
    txid,
    vsize,
    fee,
    feeRate: fee / vsize,
  };
}

/**
 * Valida e parseia dados brutos de transação usando o schema Zod.
 *
 * @param data - Dados brutos da transação da API
 * @returns Objeto Transaction parseado
 * @throws ZodError se a validação falhar
 */
export function parseTransaction(data: unknown): Transaction {
  const parsed = TransactionSchema.parse(data);
  return {
    txid: parsed.txid,
    vsize: parsed.vsize,
    fee: parsed.fee,
    feeRate: parsed.feeRate ?? parsed.fee / parsed.vsize,
  };
}

/**
 * Valida um array de transações.
 * Retorna transações válidas e registra erros para as inválidas.
 *
 * @param data - Array de dados brutos de transação
 * @returns Array de objetos Transaction válidos
 */
export function parseTransactions(data: unknown[]): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < data.length; i++) {
    try {
      transactions.push(parseTransaction(data[i]));
    } catch (error) {
      console.warn(`Aviso: Pulando transação inválida no índice ${i}`);
    }
  }

  return transactions;
}

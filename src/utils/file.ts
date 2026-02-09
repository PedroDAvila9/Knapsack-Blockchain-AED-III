/**
 * Utilitários de Arquivo
 *
 * Funções para leitura e escrita de arquivos JSON.
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { SnapshotFile, SnapshotMetadata } from '../model';
import { Transaction } from '../model/transaction';

/**
 * Schema Zod para validar arquivo de snapshot.
 */
const SnapshotFileSchema = z.object({
  version: z.string(),
  metadata: z.object({
    source: z.enum(['mempoolspace', 'blockstream']),
    collectedAt: z.string(),
    totalMempoolSize: z.number().optional(),
    snapshotSize: z.number(),
  }),
  transactions: z.array(
    z.object({
      txid: z.string(),
      vsize: z.number(),
      fee: z.number(),
      feeRate: z.number(),
    })
  ),
});

/**
 * Carrega um arquivo de snapshot JSON.
 *
 * @param filePath - Caminho do arquivo
 * @returns Objeto SnapshotFile validado
 * @throws Error se o arquivo não existir ou for inválido
 */
export function loadSnapshot(filePath: string): SnapshotFile {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo de snapshot não encontrado: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Valida com Zod
  const parsed = SnapshotFileSchema.parse(data);

  return {
    version: parsed.version,
    metadata: parsed.metadata as SnapshotMetadata,
    transactions: parsed.transactions as Transaction[],
  };
}

/**
 * Salva um snapshot em arquivo JSON.
 *
 * @param filePath - Caminho do arquivo de saída
 * @param snapshot - Dados do snapshot
 */
export function saveSnapshot(filePath: string, snapshot: SnapshotFile): void {
  // Cria diretório se necessário
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Salva uma solução em arquivo JSON.
 *
 * @param filePath - Caminho do arquivo de saída
 * @param solution - Objeto com a solução
 */
export function saveSolution(
  filePath: string,
  solution: {
    algorithm: string;
    params: Record<string, unknown>;
    selectedTxids: string[];
    totalWeight: number;
    totalValue: number;
    txCount: number;
    fillRatio: number;
    runtimeMs: number;
    timestamp: string;
  }
): void {
  // Cria diretório se necessário
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = JSON.stringify(solution, null, 2);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Verifica se um caminho existe.
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Cria um diretório recursivamente se não existir.
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
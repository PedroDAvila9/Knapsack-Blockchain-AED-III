/**
 * Utilitários para Escrita de CSV
 *
 * Fornece funções para gerar arquivos CSV compatíveis com
 * ferramentas de análise de dados.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Opções para o escritor CSV.
 */
export interface CsvOptions {
  /** Delimitador de colunas (padrão: ',') */
  delimiter?: string;
  /** Incluir BOM para compatibilidade com Excel (padrão: false) */
  includeBom?: boolean;
  /** Caractere de nova linha (padrão: '\n') */
  newline?: string;
}

/**
 * Escapa um valor para uso em CSV.
 * Adiciona aspas se o valor contiver delimitador, aspas ou quebras de linha.
 *
 * @param value - Valor a ser escapado
 * @param delimiter - Delimitador usado no CSV
 */
function escapeValue(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Verifica se precisa de escape
  if (
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    // Escapa aspas duplas duplicando-as
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converte um array de objetos para string CSV.
 *
 * @param data - Array de objetos com os dados
 * @param columns - Lista de colunas a incluir (usa todas as chaves do primeiro objeto se não especificado)
 * @param options - Opções de formatação
 * @returns String no formato CSV
 */
export function toCsv(
  data: Record<string, unknown>[],
  columns?: string[],
  options: CsvOptions = {}
): string {
  const { delimiter = ',', includeBom = false, newline = '\n' } = options;

  if (data.length === 0) {
    return '';
  }

  // Determina colunas
  const cols = columns ?? Object.keys(data[0]);

  // Gera cabeçalho
  const header = cols.map((col) => escapeValue(col, delimiter)).join(delimiter);

  // Gera linhas de dados
  const rows = data.map((row) =>
    cols.map((col) => escapeValue(row[col], delimiter)).join(delimiter)
  );

  // Combina tudo
  const content = [header, ...rows].join(newline);

  // Adiciona BOM se solicitado
  if (includeBom) {
    return '\ufeff' + content;
  }

  return content;
}

/**
 * Escreve dados em formato CSV para um arquivo.
 *
 * Cria o diretório pai automaticamente se não existir.
 *
 * @param filePath - Caminho do arquivo de saída
 * @param data - Array de objetos com os dados
 * @param columns - Lista de colunas a incluir
 * @param options - Opções de formatação
 */
export function writeCsv(
  filePath: string,
  data: Record<string, unknown>[],
  columns?: string[],
  options: CsvOptions = {}
): void {
  // Cria diretório se necessário
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = toCsv(data, columns, options);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Interface para resultado de benchmark em formato CSV.
 */
export interface BenchmarkRow {
  algorithm: string;
  fee_total_sats: number;
  weight_used: number;
  fill_ratio: number;
  tx_count: number;
  runtime_ms: number;
  params: string;
  [key: string]: string | number; // Assinatura de índice para compatibilidade
}

/**
 * Colunas padrão para o CSV de benchmark.
 */
export const BENCHMARK_COLUMNS = [
  'algorithm',
  'fee_total_sats',
  'weight_used',
  'fill_ratio',
  'tx_count',
  'runtime_ms',
  'params',
];

/**
 * Escreve resultados de benchmark em CSV.
 *
 * @param filePath - Caminho do arquivo de saída
 * @param rows - Linhas de resultado
 */
export function writeBenchmarkCsv(filePath: string, rows: BenchmarkRow[]): void {
  writeCsv(filePath, rows, BENCHMARK_COLUMNS);
}
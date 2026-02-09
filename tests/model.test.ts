/**
 * Testes Unitários - Modelo
 *
 * Testa validação de transações e soluções.
 */

import {
  createTransaction,
  parseTransaction,
  validateSolution,
  KnapsackInstance,
  KnapsackSolution,
} from '../src/model';

describe('Criação de Transação', () => {
  test('deve criar transação com feeRate calculado', () => {
    const tx = createTransaction('a'.repeat(64), 100, 500);

    expect(tx.txid).toBe('a'.repeat(64));
    expect(tx.vsize).toBe(100);
    expect(tx.fee).toBe(500);
    expect(tx.feeRate).toBe(5);
  });

  test('deve calcular feeRate corretamente', () => {
    const tx = createTransaction('b'.repeat(64), 250, 1000);
    expect(tx.feeRate).toBe(4);
  });
});

describe('Parsing de Transação', () => {
  test('deve parsear dados válidos', () => {
    const data = {
      txid: 'c'.repeat(64),
      vsize: 200,
      fee: 800,
    };

    const tx = parseTransaction(data);

    expect(tx.txid).toBe(data.txid);
    expect(tx.vsize).toBe(200);
    expect(tx.fee).toBe(800);
    expect(tx.feeRate).toBe(4);
  });

  test('deve usar feeRate fornecido se disponível', () => {
    const data = {
      txid: 'd'.repeat(64),
      vsize: 200,
      fee: 800,
      feeRate: 10, // Valor diferente do calculado
    };

    const tx = parseTransaction(data);
    expect(tx.feeRate).toBe(10);
  });

  test('deve lançar erro para txid inválido', () => {
    const data = {
      txid: 'invalid',
      vsize: 200,
      fee: 800,
    };

    expect(() => parseTransaction(data)).toThrow();
  });

  test('deve lançar erro para vsize negativo', () => {
    const data = {
      txid: 'e'.repeat(64),
      vsize: -100,
      fee: 800,
    };

    expect(() => parseTransaction(data)).toThrow();
  });

  test('deve lançar erro para fee negativo', () => {
    const data = {
      txid: 'f'.repeat(64),
      vsize: 100,
      fee: -500,
    };

    expect(() => parseTransaction(data)).toThrow();
  });
});

describe('Validação de Solução', () => {
  const createTestInstance = (): KnapsackInstance => ({
    transactions: [
      createTransaction('1'.repeat(64), 100, 500),
      createTransaction('2'.repeat(64), 200, 1000),
      createTransaction('3'.repeat(64), 150, 750),
    ],
    capacity: 400,
  });

  test('deve validar solução correta', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['1'.repeat(64), '2'.repeat(64)],
      totalWeight: 300,
      totalValue: 1500,
      txCount: 2,
      fillRatio: 0.75,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('deve detectar peso excedendo capacidade', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['1'.repeat(64), '2'.repeat(64), '3'.repeat(64)],
      totalWeight: 450,
      totalValue: 2250,
      txCount: 3,
      fillRatio: 1.125,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('excede'))).toBe(true);
  });

  test('deve detectar txids duplicados', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['1'.repeat(64), '1'.repeat(64)],
      totalWeight: 200,
      totalValue: 1000,
      txCount: 2,
      fillRatio: 0.5,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicados'))).toBe(true);
  });

  test('deve detectar txid inexistente', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['9'.repeat(64)],
      totalWeight: 100,
      totalValue: 500,
      txCount: 1,
      fillRatio: 0.25,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('não encontrado'))).toBe(true);
  });

  test('deve detectar valor reportado incorreto', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['1'.repeat(64)],
      totalWeight: 100,
      totalValue: 9999, // Incorreto
      txCount: 1,
      fillRatio: 0.25,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Valor reportado'))).toBe(true);
  });

  test('deve detectar peso reportado incorreto', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['1'.repeat(64)],
      totalWeight: 9999, // Incorreto
      totalValue: 500,
      txCount: 1,
      fillRatio: 0.25,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Peso reportado'))).toBe(true);
  });

  test('deve detectar contagem incorreta', () => {
    const instance = createTestInstance();
    const solution: KnapsackSolution = {
      selectedTxids: ['1'.repeat(64), '2'.repeat(64)],
      totalWeight: 300,
      totalValue: 1500,
      txCount: 5, // Incorreto
      fillRatio: 0.75,
    };

    const result = validateSolution(instance, solution);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Contagem'))).toBe(true);
  });
});
/**
 * Testes Unitários - Algoritmos
 *
 * Testa os algoritmos de mochila em instâncias sintéticas pequenas.
 * Compara resultados com solução exata por força bruta.
 */

import {
  greedy,
  fptas,
  simulatedAnnealing,
  bruteForce,
  dynamicProgramming,
} from '../src/algorithms';
import { KnapsackInstance, createTransaction } from '../src/model';

/**
 * Cria uma instância de teste sintética.
 */
function createTestInstance(
  items: Array<{ vsize: number; fee: number }>,
  capacity: number
): KnapsackInstance {
  const transactions = items.map((item, i) =>
    createTransaction(
      `tx${i.toString().padStart(62, '0')}`, // txid de 64 chars
      item.vsize,
      item.fee
    )
  );

  return { transactions, capacity };
}

describe('Algoritmo Guloso', () => {
  test('deve selecionar itens de maior densidade primeiro', () => {
    // Item 0: densidade = 10/10 = 1
    // Item 1: densidade = 20/10 = 2 (maior)
    // Item 2: densidade = 15/20 = 0.75
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 10 },
        { vsize: 10, fee: 20 },
        { vsize: 20, fee: 15 },
      ],
      25
    );

    const solution = greedy(instance);

    // Deve selecionar item 1 (densidade 2) e item 0 (densidade 1)
    // Total: peso=20, valor=30
    expect(solution.totalWeight).toBeLessThanOrEqual(25);
    expect(solution.totalValue).toBe(30);
    expect(solution.txCount).toBe(2);
  });

  test('deve respeitar capacidade máxima', () => {
    const instance = createTestInstance(
      [
        { vsize: 100, fee: 1000 },
        { vsize: 50, fee: 400 },
      ],
      80
    );

    const solution = greedy(instance);

    expect(solution.totalWeight).toBeLessThanOrEqual(80);
  });

  test('deve retornar solução vazia para instância vazia', () => {
    const instance = createTestInstance([], 100);
    const solution = greedy(instance);

    expect(solution.selectedTxids).toHaveLength(0);
    expect(solution.totalValue).toBe(0);
  });
});

describe('Algoritmo Programação Dinâmica', () => {
  test('deve encontrar solução ótima', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
      ],
      50
    );

    const solution = dynamicProgramming(instance);

    expect(solution.totalWeight).toBeLessThanOrEqual(50);
    expect(solution.totalValue).toBe(220); // 100 + 120
  });

  test('deve retornar solução vazia para instância vazia', () => {
    const instance = createTestInstance([], 100);
    const solution = dynamicProgramming(instance);

    expect(solution.selectedTxids).toHaveLength(0);
    expect(solution.totalValue).toBe(0);
  });

  test('deve lançar erro para capacidade muito grande', () => {
    const instance = createTestInstance(
      [{ vsize: 10, fee: 100 }],
      200_000 // Maior que MAX_CAPACITY_DP
    );

    expect(() => dynamicProgramming(instance)).toThrow();
  });
});

describe('Algoritmo FPTAS', () => {
  test('deve produzir solução válida', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
      ],
      50
    );

    const solution = fptas(instance, { epsilon: 0.1 });

    expect(solution.totalWeight).toBeLessThanOrEqual(50);
    expect(solution.totalValue).toBeGreaterThan(0);
  });

  test('deve aproximar solução ótima com epsilon pequeno', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
      ],
      50
    );

    const exact = bruteForce(instance);
    const approx = fptas(instance, { epsilon: 0.01 });

    // Deve estar dentro de 1% do ótimo
    const gap =
      (exact.totalValue - approx.totalValue) / exact.totalValue;
    expect(gap).toBeLessThan(0.01);
  });

  test('deve retornar solução vazia para instância vazia', () => {
    const instance = createTestInstance([], 100);
    const solution = fptas(instance, { epsilon: 0.1 });

    expect(solution.selectedTxids).toHaveLength(0);
  });
});

describe('Algoritmo Simulated Annealing', () => {
  test('deve produzir solução válida', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
      ],
      50
    );

    const solution = simulatedAnnealing(instance, {
      seed: 42,
      maxIterations: 1000,
    });

    expect(solution.totalWeight).toBeLessThanOrEqual(50);
    expect(solution.totalValue).toBeGreaterThan(0);
  });

  test('deve ser determinístico com mesma semente', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
        { vsize: 15, fee: 80 },
      ],
      50
    );

    const solution1 = simulatedAnnealing(instance, {
      seed: 12345,
      maxIterations: 1000,
    });

    const solution2 = simulatedAnnealing(instance, {
      seed: 12345,
      maxIterations: 1000,
    });

    expect(solution1.totalValue).toBe(solution2.totalValue);
    expect(solution1.selectedTxids.sort()).toEqual(
      solution2.selectedTxids.sort()
    );
  });

  test('deve produzir resultados diferentes com sementes diferentes', () => {
    const instance = createTestInstance(
      Array.from({ length: 20 }, (_, i) => ({
        vsize: 10 + (i % 5) * 5,
        fee: 50 + i * 10,
      })),
      100
    );

    const solution1 = simulatedAnnealing(instance, {
      seed: 1,
      maxIterations: 5000,
    });

    const solution2 = simulatedAnnealing(instance, {
      seed: 999,
      maxIterations: 5000,
    });

    // Podem ter valores diferentes (não garantido, mas provável)
    // Pelo menos verifica que ambos são válidos
    expect(solution1.totalWeight).toBeLessThanOrEqual(100);
    expect(solution2.totalWeight).toBeLessThanOrEqual(100);
  });

  test('deve retornar solução vazia para instância vazia', () => {
    const instance = createTestInstance([], 100);
    const solution = simulatedAnnealing(instance, {
      seed: 42,
      maxIterations: 1000,
    });

    expect(solution.selectedTxids).toHaveLength(0);
    expect(solution.totalValue).toBe(0);
  });
});

describe('Solução Exata (Força Bruta)', () => {
  test('deve encontrar solução ótima', () => {
    // Problema clássico de mochila
    // Ótimo: itens 1 e 2, valor = 220, peso = 50
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },  // densidade 6
        { vsize: 20, fee: 100 }, // densidade 5
        { vsize: 30, fee: 120 }, // densidade 4
      ],
      50
    );

    const solution = bruteForce(instance);

    expect(solution.totalWeight).toBeLessThanOrEqual(50);
    expect(solution.totalValue).toBe(220); // 100 + 120
  });

  test('deve lançar erro para instâncias muito grandes', () => {
    const items = Array.from({ length: 30 }, () => ({
      vsize: 10,
      fee: 100,
    }));
    const instance = createTestInstance(items, 1000);

    expect(() => bruteForce(instance)).toThrow();
  });

  test('deve retornar solução vazia para instância vazia', () => {
    const instance = createTestInstance([], 100);
    const solution = bruteForce(instance);

    expect(solution.selectedTxids).toHaveLength(0);
    expect(solution.totalValue).toBe(0);
  });
});

describe('Comparação de Algoritmos', () => {
  test('todos os algoritmos devem produzir soluções válidas', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
        { vsize: 15, fee: 80 },
        { vsize: 25, fee: 90 },
      ],
      60
    );

    const algorithms = [
      { name: 'greedy', fn: () => greedy(instance) },
      {
        name: 'fptas',
        fn: () => fptas(instance, { epsilon: 0.1 }),
      },
      {
        name: 'sa',
        fn: () =>
          simulatedAnnealing(instance, { seed: 42, maxIterations: 1000 }),
      },
    ];

    for (const { name, fn } of algorithms) {
      const solution = fn();

      expect(solution.totalWeight).toBeLessThanOrEqual(60);
      expect(solution.totalValue).toBeGreaterThan(0);
      expect(solution.selectedTxids.length).toBe(solution.txCount);

      // Verifica que não há duplicatas
      const uniqueTxids = new Set(solution.selectedTxids);
      expect(uniqueTxids.size).toBe(solution.txCount);
    }
  });

  test('gap dos algoritmos em relação ao ótimo deve ser aceitável', () => {
    const instance = createTestInstance(
      [
        { vsize: 10, fee: 60 },
        { vsize: 20, fee: 100 },
        { vsize: 30, fee: 120 },
        { vsize: 15, fee: 80 },
      ],
      50
    );

    const exact = bruteForce(instance);

    const algorithms = [
      { name: 'greedy', solution: greedy(instance) },
      { name: 'fptas', solution: fptas(instance, { epsilon: 0.1 }) },
      {
        name: 'sa',
        solution: simulatedAnnealing(instance, {
          seed: 42,
          maxIterations: 5000,
        }),
      },
    ];

    for (const { name, solution } of algorithms) {
      const gap =
        ((exact.totalValue - solution.totalValue) / exact.totalValue) * 100;

      // Todos devem estar dentro de 20% do ótimo (relaxado para SA com poucas iterações)
      expect(gap).toBeLessThan(20);

      console.log(
        `${name}: valor=${solution.totalValue}, ótimo=${exact.totalValue}, gap=${gap.toFixed(2)}%`
      );
    }
  });
});
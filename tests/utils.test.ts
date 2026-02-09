/**
 * Testes Unitários - Utilitários
 *
 * Testa o gerador de números aleatórios, timing e CSV.
 */

import { createRng, timeExecution, toCsv } from '../src/utils';

describe('Gerador de Números Aleatórios (RNG)', () => {
  test('deve ser determinístico com mesma semente', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.random()).toBe(rng2.random());
    }
  });

  test('deve produzir sequências diferentes com sementes diferentes', () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);

    // Muito improvável que sejam iguais
    let allEqual = true;
    for (let i = 0; i < 10; i++) {
      if (rng1.random() !== rng2.random()) {
        allEqual = false;
        break;
      }
    }

    expect(allEqual).toBe(false);
  });

  test('random() deve retornar valores entre 0 e 1', () => {
    const rng = createRng(42);

    for (let i = 0; i < 1000; i++) {
      const value = rng.random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test('randomInt() deve retornar inteiros no intervalo especificado', () => {
    const rng = createRng(42);

    for (let i = 0; i < 1000; i++) {
      const value = rng.randomInt(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  test('randomBool() deve respeitar probabilidade', () => {
    const rng = createRng(42);
    const iterations = 10000;

    // Testa com p = 0.7
    let trueCount = 0;
    for (let i = 0; i < iterations; i++) {
      if (rng.randomBool(0.7)) {
        trueCount++;
      }
    }

    const ratio = trueCount / iterations;
    // Deve estar próximo de 0.7 (com margem de erro)
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.75);
  });

  test('randomChoice() deve selecionar elementos do array', () => {
    const rng = createRng(42);
    const array = ['a', 'b', 'c', 'd'];

    for (let i = 0; i < 100; i++) {
      const choice = rng.randomChoice(array);
      expect(array).toContain(choice);
    }
  });

  test('randomChoice() deve lançar erro para array vazio', () => {
    const rng = createRng(42);
    expect(() => rng.randomChoice([])).toThrow();
  });

  test('shuffle() deve embaralhar array in-place', () => {
    const rng = createRng(42);
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const array = [...original];

    rng.shuffle(array);

    // Deve conter os mesmos elementos
    expect(array.sort()).toEqual(original.sort());

    // Deve estar em ordem diferente (muito improvável estar igual)
    const rng2 = createRng(42);
    const array2 = [...original];
    rng2.shuffle(array2);

    // Verifica que pelo menos algum elemento mudou de posição
    let anyDifferent = false;
    for (let i = 0; i < array2.length; i++) {
      if (array2[i] !== original[i]) {
        anyDifferent = true;
        break;
      }
    }
    expect(anyDifferent).toBe(true);
  });

  test('shuffle() deve ser determinístico', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);

    const array1 = [1, 2, 3, 4, 5];
    const array2 = [1, 2, 3, 4, 5];

    rng1.shuffle(array1);
    rng2.shuffle(array2);

    expect(array1).toEqual(array2);
  });

  test('getSeed() deve retornar a semente original', () => {
    const rng = createRng(12345);
    expect(rng.getSeed()).toBe(12345);
  });
});

describe('Funções de Timing', () => {
  test('timeExecution deve medir tempo corretamente', () => {
    const { result, elapsedMs } = timeExecution(() => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return sum;
    });

    expect(result).toBe(499999500000);
    expect(elapsedMs).toBeGreaterThan(0);
  });

  test('timeExecution deve retornar resultado correto', () => {
    const { result } = timeExecution(() => {
      return 'test result';
    });

    expect(result).toBe('test result');
  });
});

describe('Gerador de CSV', () => {
  test('deve gerar CSV corretamente', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];

    const csv = toCsv(data);

    expect(csv).toContain('name,age');
    expect(csv).toContain('Alice,30');
    expect(csv).toContain('Bob,25');
  });

  test('deve escapar valores com vírgulas', () => {
    const data = [{ name: 'Doe, John', age: 30 }];

    const csv = toCsv(data);

    expect(csv).toContain('"Doe, John"');
  });

  test('deve escapar valores com aspas', () => {
    const data = [{ name: 'Say "Hello"', age: 30 }];

    const csv = toCsv(data);

    expect(csv).toContain('"Say ""Hello"""');
  });

  test('deve usar colunas especificadas', () => {
    const data = [{ name: 'Alice', age: 30, city: 'NYC' }];

    const csv = toCsv(data, ['name', 'city']);

    expect(csv).toContain('name,city');
    expect(csv).not.toContain('age');
  });

  test('deve retornar string vazia para array vazio', () => {
    const csv = toCsv([]);
    expect(csv).toBe('');
  });
});
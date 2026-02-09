/**
 * Utilitários de Temporização
 *
 * Fornece funções para medir tempo de execução com alta precisão.
 */

/**
 * Resultado de uma medição de tempo.
 */
export interface TimedResult<T> {
  /** Resultado da função executada */
  result: T;
  /** Tempo de execução em milissegundos */
  elapsedMs: number;
}

/**
 * Executa uma função e mede o tempo de execução.
 *
 * Usa performance.now() para medição de alta precisão.
 *
 * @param fn - Função a ser executada
 * @returns Resultado da função e tempo de execução
 *
 * @example
 * const { result, elapsedMs } = timeExecution(() => {
 *   return heavyComputation();
 * });
 * console.log(`Executado em ${elapsedMs}ms`);
 */
export function timeExecution<T>(fn: () => T): TimedResult<T> {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  return {
    result,
    elapsedMs: end - start,
  };
}

/**
 * Versão assíncrona de timeExecution.
 *
 * @param fn - Função assíncrona a ser executada
 * @returns Promise com resultado e tempo de execução
 */
export async function timeExecutionAsync<T>(
  fn: () => Promise<T>
): Promise<TimedResult<T>> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    elapsedMs: end - start,
  };
}

/**
 * Cria um cronômetro reutilizável.
 *
 * @example
 * const timer = createTimer();
 * timer.start();
 * // ... operação ...
 * const ms = timer.stop();
 */
export interface Timer {
  /** Inicia ou reinicia o cronômetro */
  start(): void;
  /** Para o cronômetro e retorna o tempo em ms */
  stop(): number;
  /** Retorna o tempo decorrido sem parar */
  elapsed(): number;
  /** Verifica se o cronômetro está rodando */
  isRunning(): boolean;
}

/**
 * Cria um novo cronômetro.
 */
export function createTimer(): Timer {
  let startTime: number | null = null;

  return {
    start(): void {
      startTime = performance.now();
    },

    stop(): number {
      if (startTime === null) {
        throw new Error('Cronômetro não foi iniciado');
      }
      const elapsed = performance.now() - startTime;
      startTime = null;
      return elapsed;
    },

    elapsed(): number {
      if (startTime === null) {
        throw new Error('Cronômetro não foi iniciado');
      }
      return performance.now() - startTime;
    },

    isRunning(): boolean {
      return startTime !== null;
    },
  };
}

/**
 * Formata milissegundos para string legível.
 *
 * @param ms - Tempo em milissegundos
 * @returns String formatada (ex: "1.23s", "456ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

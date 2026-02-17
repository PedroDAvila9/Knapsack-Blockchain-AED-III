/**
 * Simulated Annealing para o Problema da Mochila
 * Complexidade de Tempo: O(maxIterations × n)
 * Complexidade de Espaço: O(n)
 *
 * Referência:
 * Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983).
 * "Optimization by simulated annealing." Science, 220(4598), 671-680.
 */

import { Transaction, KnapsackInstance, KnapsackSolution, createEmptySolution } from '../model';
import { RandomGenerator, createRng } from '../utils';
import { greedy } from './greedy';

export interface SimulatedAnnealingParams {
  seed: number;
  // Número máximo de iterações
  maxIterations: number;
  // Temperatura inicial (padrão: automático baseado nos dados)
  initialTemperature?: number;
  // Taxa de resfriamento (padrão: 0.9995)
  coolingRate?: number;
  // Temperatura mínima antes de parar (padrão: 0.01)
  minTemperature?: number;
}

interface SolutionState {
  // Índices das transações selecionadas
  selected: Set<number>;
  // Peso total atual
  weight: number;
  // Valor total atual (fee)
  value: number;
}

type MoveType = 'add' | 'remove' | 'swap';

export function simulatedAnnealing(
  instance: KnapsackInstance,
  params: SimulatedAnnealingParams
): KnapsackSolution {
  const { transactions, capacity } = instance;
  const n = transactions.length;

  if (n === 0) return createEmptySolution();

  const rng = createRng(params.seed);

  const maxFee = Math.max(...transactions.map((tx) => tx.fee));
  const initialTemp = params.initialTemperature ?? maxFee * 0.5;
  const coolingRate = params.coolingRate ?? 0.9995;
  const minTemp = params.minTemperature ?? 0.01;

  const greedySolution = greedy(instance);
  const txidToIndex = new Map<string, number>();
  transactions.forEach((tx, i) => txidToIndex.set(tx.txid, i));

  // Estado atual
  const current: SolutionState = {
    selected: new Set(
      greedySolution.selectedTxids.map((txid: string) => txidToIndex.get(txid)!)
    ),
    weight: greedySolution.totalWeight,
    value: greedySolution.totalValue,
  };

  let best: SolutionState = {
    selected: new Set(current.selected),
    weight: current.weight,
    value: current.value,
  };

  let temperature = initialTemp;

  for (
    let iter = 0;
    iter < params.maxIterations && temperature > minTemp;
    iter++
  ) {
    const move = generateNeighborMove(
      current,
      transactions,
      capacity,
      rng
    );

    if (move === null) {
      temperature *= coolingRate;
      continue;
    }

    const delta = move.newValue - current.value;
    const accept =
      delta > 0 || rng.random() < Math.exp(delta / temperature);

    if (accept) {
      applyMove(current, move);

      if (current.value > best.value) {
        best = {
          selected: new Set(current.selected),
          weight: current.weight,
          value: current.value,
        };
      }
    }

    temperature *= coolingRate;
  }

  const selectedTxids = Array.from(best.selected).map(
    (i) => transactions[i].txid
  );

  return {
    selectedTxids,
    totalWeight: best.weight,
    totalValue: best.value,
    txCount: selectedTxids.length,
    fillRatio: best.weight / capacity,
  };
}


interface Move {
  type: MoveType;
  addIndex?: number;
  removeIndex?: number;
  newWeight: number;
  newValue: number;
}

function generateNeighborMove(
  state: SolutionState,
  transactions: Transaction[],
  capacity: number,
  rng: RandomGenerator
): Move | null {
  const n = transactions.length;
  const selected = Array.from(state.selected);
  const unselected = [];

  for (let i = 0; i < n; i++) {
    if (!state.selected.has(i)) {
      unselected.push(i);
    }
  }

  // Escolhe tipo de movimento aleatoriamente
  // Probabilidades: ADD 40%, REMOVE 20%, SWAP 40%
  const r = rng.random();
  let moveType: MoveType;

  if (r < 0.4 && unselected.length > 0) {
    moveType = 'add';
  } else if (r < 0.6 && selected.length > 0) {
    moveType = 'remove';
  } else if (selected.length > 0 && unselected.length > 0) {
    moveType = 'swap';
  } else if (unselected.length > 0) {
    moveType = 'add';
  } else if (selected.length > 0) {
    moveType = 'remove';
  } else {
    return null;
  }

  if (moveType === 'add') {
    // Tenta adicionar uma transação que caiba
    // Embaralha para variedade
    const shuffled = [...unselected];
    rng.shuffle(shuffled);

    for (const idx of shuffled) {
      const tx = transactions[idx];
      if (state.weight + tx.vsize <= capacity) {
        return {
          type: 'add',
          addIndex: idx,
          newWeight: state.weight + tx.vsize,
          newValue: state.value + tx.fee,
        };
      }
    }

    // Nenhuma transação cabe, tenta outro movimento
    if (selected.length > 0) {
      moveType = 'remove';
    } else {
      return null;
    }
  }

  if (moveType === 'remove') {
    // Remove uma transação aleatória
    const idx = rng.randomChoice(selected);
    const tx = transactions[idx];

    return {
      type: 'remove',
      removeIndex: idx,
      newWeight: state.weight - tx.vsize,
      newValue: state.value - tx.fee,
    };
  }

  if (moveType === 'swap') {
    const removeIdx = rng.randomChoice(selected);
    const removeTx = transactions[removeIdx];

    // Procura uma transação que caiba após remoção
    const capacityAfterRemoval = capacity - state.weight + removeTx.vsize;
    const shuffled = [...unselected];
    rng.shuffle(shuffled);

    for (const addIdx of shuffled) {
      const addTx = transactions[addIdx];
      if (addTx.vsize <= capacityAfterRemoval) {
        return {
          type: 'swap',
          addIndex: addIdx,
          removeIndex: removeIdx,
          newWeight: state.weight - removeTx.vsize + addTx.vsize,
          newValue: state.value - removeTx.fee + addTx.fee,
        };
      }
    }

    // Nenhum swap válido, faz remove
    return {
      type: 'remove',
      removeIndex: removeIdx,
      newWeight: state.weight - removeTx.vsize,
      newValue: state.value - removeTx.fee,
    };
  }

  return null;
}

function applyMove(state: SolutionState, move: Move): void {
  if (move.type === 'add' && move.addIndex !== undefined) {
    state.selected.add(move.addIndex);
  } else if (move.type === 'remove' && move.removeIndex !== undefined) {
    state.selected.delete(move.removeIndex);
  } else if (
    move.type === 'swap' &&
    move.addIndex !== undefined &&
    move.removeIndex !== undefined
  ) {
    state.selected.delete(move.removeIndex);
    state.selected.add(move.addIndex);
  }

  state.weight = move.newWeight;
  state.value = move.newValue;
}
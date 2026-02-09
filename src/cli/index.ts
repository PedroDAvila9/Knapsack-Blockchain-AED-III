#!/usr/bin/env node
/**
 * CLI Principal - Bitcoin Block Builder
 *
 * Interface de linha de comando para o construtor de blocos Bitcoin
 * usando o problema da mochila 0/1.
 *
 * Comandos disponíveis:
 * - collect: Coleta snapshot do mempool
 * - run: Executa algoritmo em um snapshot
 * - benchmark: Executa todos os algoritmos e compara
 */

import { Command } from 'commander';
import { collectCommand } from './commands/collect';
import { runCommand } from './commands/run';
import { benchmarkCommand } from './commands/benchmark';

const program = new Command();

program
  .name('blockbuilder')
  .description(
    'Construtor de blocos Bitcoin usando algoritmos de mochila 0/1\n' +
      'Projeto acadêmico - Algoritmos e Estruturas de Dados III'
  )
  .version('1.0.0');

// Registra comandos
program.addCommand(collectCommand);
program.addCommand(runCommand);
program.addCommand(benchmarkCommand);

// Executa
program.parse();
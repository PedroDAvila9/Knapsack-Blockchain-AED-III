# Bitcoin Block Builder

**Construtor de Blocos Bitcoin usando o Problema da Mochila 0/1**

Trabalho final para a disciplina de Algoritmos e Estruturas de Dados III.

Pedro Da Silva D'Ávila
Stephan Lubke Heidmann

---

## Índice

1. [Visão Geral](#visão-geral)
2. [O Problema](#o-problema)
3. [Algoritmos Implementados](#algoritmos-implementados)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Instalação e Uso](#instalação-e-uso)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Testes](#testes)

---

## Visão Geral

Este projeto simula o processo de construção de um bloco Bitcoin, onde um minerador precisa selecionar quais transações incluir no bloco para **maximizar as taxas (fees) coletadas**, respeitando o **limite de tamanho do bloco**.

Este é um problema clássico de otimização conhecido como **Problema da Mochila 0/1 (0/1 Knapsack Problem)**.

---

## O Problema

### Analogia com a Mochila

| Conceito da Mochila | Equivalente Bitcoin |
|---------------------|---------------------|
| Capacidade da mochila | Tamanho máximo do bloco |
| Peso do item | Tamanho virtual da transação (vsize) |
| Valor do item | Taxa (fee) da transação em satoshis |
| Itens disponíveis | Transações no mempool |

### Capacidade do Bloco Bitcoin

No Bitcoin, o limite é de **4.000.000 weight units**.
Como `vbytes = weight / 4`, isso corresponde a aproximadamente **1.000.000 vbytes**.

Este valor é adotado como padrão e é configurável via CLI (`--capacity`).

---

## Algoritmos Implementados

### Tabela Comparativa

| Algoritmo | Complexidade | Garantia | Descrição |
|-----------|-------------|----------|-----------|
| Força Bruta | O(2^n) | **Ótimo** | Apenas testes (n ≤ 25) |
| Guloso | O(n log n) | **Sem garantia** | Ordena por fee/vsize |
| DP Exato | O(n × W) | **Ótimo** | Pseudo-polinomial (W ≤ 100k) |
| Simulated Annealing | O(iter × n) | Heurístico (Monte Carlo) | Meta-heurística probabilística |
| **FPTAS** | O(n²/ε) | **≥ (1-ε) OPT** | Aproximação com garantia |

---

### 1. Força Bruta

Enumera todos os 2^n subconjuntos. **ÓTIMO garantido**.

```
Complexidade: O(2^n) - EXPONENCIAL
```

**USO**: APENAS testes unitários com n ≤ 25.

---
### 2. Guloso (greedy-density)

Ordena transações por `fee/vsize` decrescente e seleciona enquanto couber.

⚠️ **IMPORTANTE**: Este algoritmo SOZINHO **não garante** 50% do ótimo!

```
Complexidade: O(n log n)
Garantia: NENHUMA (apenas heurística rápida)
```

---

### 3. Programação Dinâmica (DP Exato)

Algoritmo clássico de Bellman (1957). Encontra solução **ÓTIMA**.

```
Complexidade: O(n × W) - pseudo-polinomial
```

**USO**: Instâncias pequenas para obter ótimo de referência e calcular gap das heurísticas.

⚠️ **LIMITAÇÃO**: Capacidade W deve ser ≤ 100.000.
Para W = 1.000.000 (bloco real), use FPTAS.

---

### 4. Simulated Annealing (Monte Carlo)

Meta-heurística probabilística inspirada no recozimento de metais.

**CLASSIFICAÇÃO**: Algoritmo Probabilístico / Monte Carlo

Usa amostragem aleatória e aceitação probabilística (Critério de Metropolis).

```
Algoritmo:
1. Inicia com solução gulosa
2. T = temperatura inicial (alta)
3. Enquanto T > T_min:
   a. Gera vizinho (add/remove/swap)
   b. Δ = valor_novo - valor_atual
   c. Se Δ > 0: aceita
      Senão: aceita com prob = exp(Δ/T)
   d. T = T × cooling_rate
4. Retorna melhor encontrada
```

⚠️ **Sem garantia teórica** - heurístico

```
Complexidade: O(iterações × n)
```

---
### 5. FPTAS ⭐

**Fully Polynomial-Time Approximation Scheme**

Esquema de aproximação que garante solução com valor ≥ (1-ε) do ótimo.

```
Algoritmo:
1. P_max = max{fee_i}
2. K = (ε × P_max) / n
3. fee'_i = floor(fee_i / K)   // Escala valores
4. Executa DP nos valores escalados
5. Reconstrói solução original
```

✅ **GARANTIA: Solução ≥ (1-ε) × OPT**

| Epsilon | Garantia | Velocidade |
|---------|----------|------------|
| 0.01 | ≥ 99% OPT | Lento |
| 0.1 | ≥ 90% OPT | Moderado |
| 0.5 | ≥ 50% OPT | Rápido |

```
Complexidade: O(n² / ε)
```

---




## Estrutura do Projeto

```
bitcoin-block-builder/
├── src/
│   ├── algorithms/           # Algoritmos
│   │   ├── greedy.ts         # Guloso
│   │   ├── fptas.ts          # FPTAS
│   │   ├── simulated-annealing.ts  # SA (Monte Carlo)
│   │   └── exact.ts          # DP + Força bruta
│   ├── collector/            # APIs mempool.space / Blockstream
│   ├── model/                # Tipos: Transaction, KnapsackInstance
│   ├── evaluator/            # Métricas e benchmark
│   ├── utils/                # RNG, timing, CSV
│   └── cli/                  # Comandos: collect, run, benchmark
├── tests/                    # Testes unitários
├── Dockerfile
└── README.md
```

---

## Instalação e Uso

### Requisitos
- Node.js 20+
- npm

### Instalação

```bash
npm install
npm run build
npm test
```

### Comandos CLI

```bash
# Ajuda
npm start -- --help

# Coletar snapshot do mempool
npm start -- collect \
  --source mempoolspace \
  --topN 3000 \
  --out snapshots/test.json

# Executar algoritmo específico
npm start -- run \
  -i snapshots/test.json \
  -a greedy-2approx \
  -c 1000000 \
  -o results/solucao

# Executar FPTAS com ε=0.1
npm start -- run \
  -i snapshots/test.json \
  -a fptas \
  -e 0.1 \
  -c 1000000

# Benchmark comparativo (todos algoritmos)
npm start -- benchmark \
  -i snapshots/test.json \
  -c 1000000 \
  -o results/benchmark.csv
```

### Docker

```bash
docker build -t blockbuilder .

docker run --rm -v $(pwd)/snapshots:/app/snapshots \
  blockbuilder collect --topN 2000 --out snapshots/docker.json

docker run --rm \
  -v $(pwd)/snapshots:/app/snapshots \
  -v $(pwd)/results:/app/results \
  blockbuilder benchmark -i snapshots/docker.json -o results/bench.csv
```

---

## Exemplos Práticos

```bash
# 1. Coletar 3000 transações
npm start -- collect --source mempoolspace --topN 3000 --out snapshots/exemplo.json

# 2. Executar 2-aproximação (garantia ≥50%)
npm start -- run -i snapshots/exemplo.json -a greedy-2approx

# 3. Executar FPTAS com ε=0.05 (garantia ≥95%)
npm start -- run -i snapshots/exemplo.json -a fptas -e 0.05

# 4. Simulated Annealing com seed fixo
npm start -- run -i snapshots/exemplo.json -a sa -s 42 -m 50000

# 5. Comparar todos os algoritmos
npm start -- benchmark -i snapshots/exemplo.json -o results/comparacao.csv
```

---

## Testes

```bash
npm test                 # Todos os testes
npm run test:coverage    # Com cobertura
```

### O que é testado

- **Algoritmos**: Soluções válidas, determinismo do SA, gap vs ótimo
- **Modelos**: Validação de transações e soluções
- **Utilitários**: PRNG Mulberry32, timing, CSV

---

## Referências

- Korte & Vygen, *Combinatorial Optimization*, Cap. 17 (2-aproximação)
- Ibarra & Kim (1975), *Fast approximation algorithms for knapsack* (FPTAS)
- Kirkpatrick et al. (1983), *Optimization by simulated annealing*
- [mempool.space API](https://mempool.space/docs/api)
- [Bitcoin Weight Units](https://en.bitcoin.it/wiki/Weight_units)

---

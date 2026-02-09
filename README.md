# Bitcoin Block Builder

**Construtor de Blocos Bitcoin usando o Problema da Mochila 0/1**

Projeto acadêmico para a disciplina de Algoritmos e Estruturas de Dados III.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [O Problema](#o-problema)
3. [Algoritmos Implementados](#algoritmos-implementados)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Instalação e Uso](#instalação-e-uso)
6. [Testes](#testes)

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

---

## Algoritmos Implementados

O projeto implementa **4 abordagens algorítmicas** distintas:

### Tabela Comparativa

| Algoritmo | Tipo | Complexidade | Garantia |
|-----------|------|--------------|----------|
| **Greedy** | Guloso | O(n log n) | Heurístico |
| **DP** | Programação Dinâmica | O(n × W) | Ótimo |
| **SA** | Monte Carlo | O(iter × n) | Heurístico |
| **FPTAS** | Aproximativo | O(n²/ε) | ≥ (1-ε) OPT |

---

### 1. Algoritmo Guloso (greedy)

Ordena transações por densidade (`fee/vsize`) decrescente e seleciona enquanto couber.

```
Complexidade: O(n log n)
Garantia: Nenhuma (heurística rápida)
```

**Uso:** Solução rápida para produção.

---

### 2. Programação Dinâmica (dp)

Algoritmo clássico de Bellman (1957). Encontra solução **ÓTIMA**.

```
Complexidade: O(n × W) - pseudo-polinomial
```

**Limitação:** Capacidade W deve ser ≤ 100.000.

**Uso:** Referência para calcular gap das heurísticas.

---

### 3. Simulated Annealing (sa)

Meta-heurística probabilística inspirada no recozimento de metais.

**Classificação:** Algoritmo Probabilístico / Monte Carlo

```
Algoritmo:
1. Inicia com solução gulosa
2. T = temperatura inicial
3. Enquanto T > T_min:
   a. Gera vizinho (add/remove/swap)
   b. Aceita se melhora ou com prob = exp(Δ/T)
   c. T = T × cooling_rate
4. Retorna melhor encontrada
```

```
Complexidade: O(iterações × n)
Garantia: Sem garantia teórica
```

**Uso:** Exploração do espaço de soluções. Reproduzível com seed fixo.

---

### 4. FPTAS

**Fully Polynomial-Time Approximation Scheme**

Esquema de aproximação que garante solução com valor ≥ (1-ε) do ótimo.

```
Algoritmo:
1. P_max = max{fee_i}
2. K = (ε × P_max) / n
3. Escala valores: fee'_i = floor(fee_i / K)
4. Executa DP nos valores escalados
5. Reconstrói solução original
```

| Epsilon | Garantia | Velocidade |
|---------|----------|------------|
| 0.01 | ≥ 99% OPT | Lento |
| 0.10 | ≥ 90% OPT | Moderado |
| 0.50 | ≥ 50% OPT | Rápido |

```
Complexidade: O(n² / ε)
```

---

## Estrutura do Projeto

```
bitcoin-block-builder/
├── src/
│   ├── algorithms/           # Algoritmos
│   │   ├── greedy.ts            # Guloso
│   │   ├── exact.ts             # DP + Força Bruta
│   │   ├── simulated-annealing.ts  # SA (Monte Carlo)
│   │   └── fptas.ts             # FPTAS
│   ├── collector/            # APIs mempool.space / Blockstream
│   ├── model/                # Tipos: Transaction, KnapsackInstance
│   ├── evaluator/            # Métricas e benchmark
│   ├── utils/                # RNG, timing, CSV
│   └── cli/                  # Comandos: collect, run, benchmark
├── tests/                    # Testes unitários
├── snapshots/                # Dados coletados do mempool
├── results/                  # Resultados de benchmark
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
  -a greedy \
  -c 1000000

# Executar FPTAS com ε=0.1
npm start -- run \
  -i snapshots/test.json \
  -a fptas \
  -e 0.1

# Simulated Annealing com seed fixo
npm start -- run \
  -i snapshots/test.json \
  -a sa \
  -s 42 \
  -m 50000

# Benchmark comparativo
npm start -- benchmark \
  -i snapshots/test.json \
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

## Testes

```bash
npm test                 # Todos os testes
npm run test:coverage    # Com cobertura
```

### Cobertura

- **49 testes** cobrindo todos os algoritmos
- Validação de soluções
- Determinismo do SA
- Gap vs ótimo

---

## Referências

- Bellman, R. (1957). *Dynamic Programming*
- Ibarra & Kim (1975). *Fast approximation algorithms for knapsack* (FPTAS)
- Kirkpatrick et al. (1983). *Optimization by simulated annealing*
- [mempool.space API](https://mempool.space/docs/api)
- [Bitcoin Weight Units](https://en.bitcoin.it/wiki/Weight_units)

---

## Licença

Projeto acadêmico para fins educacionais.

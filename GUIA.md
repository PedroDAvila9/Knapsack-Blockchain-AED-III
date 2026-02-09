# Guia de Apresentação - Bitcoin Block Builder

Este guia explica como executar cada parte do projeto e demonstrar na apresentação.

---

## 1. Preparação do Ambiente

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Verificar que tudo funciona
npm test
```

---

## 2. Coleta de Dados do Mempool (Demonstração Real)

### O que é o Mempool?

O **mempool** (memory pool) é onde ficam as transações Bitcoin aguardando confirmação. Mineradores escolhem quais transações incluir no próximo bloco.

### Coletando Transações Reais

```bash
# Coletar 1000 transações do mempool.space
npm start -- collect --source mempoolspace --topN 1000 --out snapshots/demo.json

# Ou do Blockstream
npm start -- collect --source blockstream --topN 1000 --out snapshots/demo.json
```

### O que explicar:
- "Estamos coletando transações REAIS que estão aguardando no mempool Bitcoin agora"
- "Cada transação tem um **tamanho (vsize)** e uma **taxa (fee)** que o usuário pagou"
- "O minerador quer maximizar as taxas coletadas respeitando o limite do bloco"

---

## 3. Conexão com o Problema da Mochila

### Analogia para explicar:

| Mochila | Bitcoin |
|---------|---------|
| Capacidade da mochila | Tamanho máximo do bloco (1.000.000 vbytes) |
| Peso de cada item | Tamanho da transação (vsize) |
| Valor de cada item | Taxa paga (fee em satoshis) |
| Objetivo | Maximizar taxas coletadas |

### Por que é NP-Difícil?

- Com N transações, existem **2^N combinações** possíveis
- 1000 transações = 2^1000 combinações (mais que átomos no universo)
- Não existe algoritmo polinomial conhecido que resolva otimamente

---

## 4. Executando os Algoritmos

### 4.1 Algoritmo Guloso por Densidade

```bash
npm start -- run -i snapshots/demo.json -a greedy-density -c 1000000
```

**O que explicar:**
- "Ordena transações por **fee/vsize** (taxa por byte)"
- "Seleciona da melhor para a pior enquanto couber"
- "Complexidade O(n log n) - muito rápido"
- "**NÃO garante** estar perto do ótimo sozinho"

### 4.2 Algoritmo Guloso 2-Aproximação

```bash
npm start -- run -i snapshots/demo.json -a greedy-2approx -c 1000000
```

**O que explicar:**
- "Combina guloso por densidade + melhor item único"
- "Retorna o melhor dos dois"
- "**GARANTIA**: resultado ≥ 50% do ótimo"
- "Ainda O(n log n) - mesma velocidade"

### 4.3 FPTAS (Esquema de Aproximação)

```bash
# Com 10% de erro máximo (rápido)
npm start -- run -i snapshots/demo.json -a fptas -e 0.1 -c 1000000

# Com 1% de erro máximo (mais lento)
npm start -- run -i snapshots/demo.json -a fptas -e 0.01 -c 1000000
```

**O que explicar:**
- "FPTAS = Fully Polynomial-Time Approximation Scheme"
- "Parâmetro ε (epsilon) controla precisão vs velocidade"
- "ε = 0.1 → resultado ≥ 90% do ótimo"
- "ε = 0.01 → resultado ≥ 99% do ótimo"
- "Complexidade O(n²/ε) - polinomial no tamanho E na precisão"

**Como funciona (simplificado):**
1. Escala os valores (fees) para inteiros menores
2. Roda programação dinâmica nos valores escalados
3. Reconstrói a solução original

### 4.4 Simulated Annealing (Monte Carlo)

```bash
# Com seed fixa (reproduzível)
npm start -- run -i snapshots/demo.json -a sa -s 42 -m 50000 -c 1000000

# Diferentes seeds dão resultados diferentes
npm start -- run -i snapshots/demo.json -a sa -s 123 -m 50000 -c 1000000
```

**O que explicar:**
- "Inspirado no recozimento de metais"
- "Começa com solução gulosa e faz perturbações"
- "Aceita movimentos ruins com probabilidade decrescente"
- "**Algoritmo probabilístico/Monte Carlo** - usa aleatoriedade"
- "Mesma seed = mesmo resultado (reproduzível)"
- "Sem garantia teórica, mas funciona bem na prática"

---

## 5. Benchmark Comparativo

### Executar todos os algoritmos de uma vez:

```bash
npm start -- benchmark -i snapshots/demo.json -c 1000000 -o results/comparacao.csv
```

### Saída esperada:

```
=== Iniciando Benchmark ===
Transações: 1000
Capacidade: 1,000,000 vbytes

Executando: Guloso por Densidade...
  Fee total: 12,345,678 sats
  Peso usado: 998,234 / 1,000,000 (99.82%)
  Tempo: 2.34 ms

Executando: FPTAS (ε=0.1)...
  Fee total: 12,567,890 sats
  Peso usado: 999,123 / 1,000,000 (99.91%)
  Tempo: 156.78 ms

=== Comparação ===
greedy-density: 1.80% abaixo do melhor
greedy-2approx: 1.20% abaixo do melhor
fptas: MELHOR
sa: 0.45% abaixo do melhor
```

**O que explicar:**
- "O CSV permite análise posterior dos resultados"
- "Comparamos fee total, tempo de execução, taxa de preenchimento"
- "FPTAS geralmente ganha em qualidade, guloso em velocidade"

---

## 6. Algoritmos Exatos (Para Demonstração)

### Programação Dinâmica

```bash
# APENAS com capacidade pequena (≤ 100.000)
npm start -- run -i snapshots/demo.json -a dp -c 10000
```

**O que explicar:**
- "Encontra solução **ÓTIMA** garantida"
- "Complexidade O(n × W) - pseudo-polinomial"
- "W = capacidade. Para W = 1.000.000, é inviável"
- "Usamos para validar que heurísticas estão próximas do ótimo"

### Força Bruta (Apenas nos testes)

```bash
npm test -- --grep "bruteForce"
```

**O que explicar:**
- "Testa TODAS as 2^n combinações"
- "Só funciona para n ≤ 25 itens"
- "Usado nos testes unitários para validar outros algoritmos"

---

## 7. Demonstração com Docker

```bash
# Construir imagem
docker build -t blockbuilder .

# Coletar dados
docker run --rm -v $(pwd)/snapshots:/app/snapshots \
  blockbuilder collect --topN 500 --out snapshots/docker.json

# Rodar benchmark
docker run --rm \
  -v $(pwd)/snapshots:/app/snapshots \
  -v $(pwd)/results:/app/results \
  blockbuilder benchmark -i snapshots/docker.json -o results/docker.csv
```

**O que explicar:**
- "Docker garante ambiente reproduzível"
- "Qualquer pessoa pode rodar exatamente o mesmo código"

---

## 8. Roteiro Sugerido para Apresentação

### Abertura (2 min)
1. "Vamos resolver um problema real: como mineradores Bitcoin escolhem transações"
2. Mostrar analogia Mochila ↔ Bitcoin

### Demonstração Prática (5 min)
1. Coletar transações reais do mempool
2. Rodar guloso - mostrar resultado rápido
3. Rodar FPTAS - mostrar resultado melhor
4. Rodar SA - mostrar variação com seeds diferentes

### Benchmark (3 min)
1. Executar benchmark completo
2. Analisar CSV gerado
3. Comparar trade-off qualidade vs tempo

### Teoria (5 min)
1. Explicar por que é NP-Difícil
2. Garantia do guloso 2-aproximação
3. Como FPTAS escala valores
4. Natureza probabilística do SA

### Conclusão (2 min)
1. "Na prática, FPTAS com ε=0.1 é ótimo custo-benefício"
2. "Guloso é suficiente quando velocidade é crítica"
3. "SA é útil quando queremos explorar soluções diferentes"

---

## 9. Perguntas Frequentes

### "Por que não usar sempre o DP exato?"
- Capacidade de 1M vbytes requer array de 1M posições × N transações
- Memória e tempo explodem para instâncias reais

### "O FPTAS sempre é melhor que guloso?"
- Em qualidade sim, mas é mais lento
- Para sistemas em tempo real, guloso pode ser preferível

### "Por que SA precisa de seed?"
- Para reprodutibilidade científica
- Mesma seed = mesmos números aleatórios = mesmo resultado

### "Isso é usado no Bitcoin real?"
- Mineradores usam heurísticas similares
- Bitcoin Core usa algoritmo baseado em "ancestor fee rate"
- Nosso modelo é simplificado (ignora dependências entre transações)

---

## 10. Arquivos Importantes para Mostrar

| Arquivo | O que contém |
|---------|--------------|
| `src/algorithms/greedy.ts` | Implementação do guloso e 2-aproximação |
| `src/algorithms/fptas.ts` | Implementação do FPTAS com escalonamento |
| `src/algorithms/simulated-annealing.ts` | SA com critério de Metropolis |
| `src/algorithms/exact.ts` | DP e força bruta |
| `tests/algorithms.test.ts` | Testes que validam os algoritmos |
| `snapshots/*.json` | Dados reais coletados |
| `results/*.csv` | Resultados dos benchmarks |
# Bitcoin Block Builder - Dockerfile
#
# Imagem Docker para executar o construtor de blocos Bitcoin
# usando algoritmos de mochila 0/1.

# Usa Node.js 20 Alpine para imagem pequena
FROM node:20-alpine AS builder

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY tsconfig.json ./
COPY src ./src

# Compila TypeScript
RUN npm run build

# Imagem de produção
FROM node:20-alpine AS runner

# Labels
LABEL maintainer="Projeto Acadêmico - Algoritmos e Estruturas de Dados III"
LABEL description="Bitcoin Block Builder usando 0/1 Knapsack"

# Define diretório de trabalho
WORKDIR /app

# Copia dependências de produção
COPY package*.json ./
RUN npm ci --production

# Copia código compilado
COPY --from=builder /app/dist ./dist

# Cria diretórios para snapshots e resultados
RUN mkdir -p snapshots results

# Define variáveis de ambiente
ENV NODE_ENV=production

# Entrypoint
ENTRYPOINT ["node", "dist/cli/index.js"]

# Comando padrão (mostra ajuda)
CMD ["--help"]

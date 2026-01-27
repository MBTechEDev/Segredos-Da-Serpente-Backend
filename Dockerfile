# --- Fase 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Instala dependências do sistema operacional (necessário para módulos nativos como Sharp/Bcrypt)
RUN apk add --no-cache python3 make g++

# 2. Copia arquivos de configuração de dependências
COPY package.json yarn.lock .yarnrc.yml* ./

# 3. Habilita o Corepack e FORÇA a criação da pasta node_modules (Essencial para Medusa)
RUN corepack enable
ENV YARN_NODE_LINKER=node-modules

# 4. Instala dependências (Fail-fast se o lockfile estiver errado)
RUN yarn install --immutable

# 5. Copia o código fonte
COPY . .

# 6. Build do Medusa v2 (Gera a pasta .medusa/server)
RUN yarn build

# --- Fase 2: Runner (Produção) ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# 1. Copia apenas o necessário do estágio de build
# Nota: Copiamos o node_modules inteiro para garantir que todas as deps de prod estejam lá
COPY --from=builder /app/.medusa/server ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 9000

# 2. O COMANDO MÁGICO:
# Usamos 'sh -c' para rodar dois comandos em sequência:
# A. npx medusa db:migrate -> Tenta atualizar o banco
# B. npm run start -> Se a migração passar, sobe o servidor
CMD sh -c "npx medusa db:migrate && npm run start"
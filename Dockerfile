FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências do sistema necessárias para compilação (opcional, mas bom pra python/gyp)
RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./

# Habilita Corepack para usar a versão certa do Yarn
RUN corepack enable
RUN yarn install --frozen-lockfile

COPY . .

# Build do Medusa v2
RUN yarn build

# --- Runner ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copia arquivos essenciais do builder
COPY --from=builder /app/.medusa/server ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 9000

CMD ["npm", "run", "start"]
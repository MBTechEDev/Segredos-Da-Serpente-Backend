import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    databaseDriverOptions: {
      ssl: false
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        redisOptions: {
          connectTimeout: 10000,
          pingInterval: 10000,
          keepAlive: 10000,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        redisOptions: {
          connectTimeout: 10000,
          pingInterval: 10000,
          keepAlive: 10000,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
          options: {
            connectTimeout: 10000,
            pingInterval: 10000,
            keepAlive: 10000,
          },
        }
      },
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/melhor-envio", // Caminho para o diretório do seu módulo
            id: "melhor-envio",
            options: {
              api_token: process.env.MELHORENVIO_API_TOKEN,
              sandbox: process.env.MELHORENVIO_SANDBOX === "true",
              contact_email: process.env.MELHORENVIO_CONTACT_EMAIL,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/providers/mercadopago",
            id: "mercadopago",
            options: {
              accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
              publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
              webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
            }
          }
        ]
      }

    }
  ]
})

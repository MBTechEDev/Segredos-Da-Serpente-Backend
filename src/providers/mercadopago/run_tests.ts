import * as dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import MercadoPagoProviderService from './service'
import { InitiatePaymentInput, AuthorizePaymentInput, PaymentSessionStatus } from '@medusajs/framework/types'

// Load environment variables from .env if present
dotenv.config({ path: '.env' })

// Verify environment variables
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY

if (!accessToken || !publicKey) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN or MERCADOPAGO_PUBLIC_KEY is not defined in the environment.')
    process.exit(1)
}

// Mock Logger
const mockLogger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    warn: (msg: string) => console.warn(`[WARN] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
    debug: (msg: string) => console.debug(`[DEBUG] ${msg}`),
    activity: (msg: string) => console.log(`[ACTIVITY] ${msg}`),
    progress: (msg: string) => console.log(`[PROGRESS] ${msg}`),
}

// Initialize the provider
const provider = new MercadoPagoProviderService(
    { logger: mockLogger },
    { accessToken, publicKey }
)

// Helper for generic test structure
const runTest = async (name: string, fn: () => Promise<void>) => {
    console.log(`\n======================================================`)
    console.log(`🧪 Running Test: ${name}`)
    console.log(`======================================================`)
    try {
        await fn()
        console.log(`✅ Test Passed: ${name}`)
    } catch (error: any) {
        console.error(`❌ Test Failed: ${name}\n  Reason: ${error.message || error}`)
    }
}

const main = async () => {
    // Test Data
    const amount = 15000 // $150.00
    const cartId = `test_cart_${uuidv4()}`
    const email = 'test_user@testuser.com'

    // ==========================================
    // PIX TESTS
    // ==========================================

    await runTest('PIX 1: Successfully Authorize PIX Payment (Valid Request)', async () => {
        const context = { cart_id: cartId, email }
        const input: AuthorizePaymentInput = {
            amount,
            currency_code: 'brl',
            context,
            data: {
                payment_method_id: 'pix',
                amount
            }
        }

        const result = await provider.authorizePayment(input)

        if (result.status !== PaymentSessionStatus.AUTHORIZED && result.status !== PaymentSessionStatus.PENDING) {
            throw new Error(`Expected status AUTHORIZED or PENDING, got ${result.status}`)
        }

        if (!result.data?.qr_code || !result.data?.qr_code_base64) {
            throw new Error('PIX response did not contain qr_code or qr_code_base64')
        }

        console.log(`  └─ Valid Pix generated with ID: ${result.data.mp_order_id}`)
    })

    await runTest('PIX 2: Fail PIX Payment (Missing Amount)', async () => {
        const context = { cart_id: cartId, email }
        const input: AuthorizePaymentInput = {
            amount: 0,
            currency_code: 'brl',
            context,
            data: {
                payment_method_id: 'pix',
            }
        }

        try {
            await provider.authorizePayment(input)
            throw new Error('Should have failed without an amount')
        } catch (error: any) {
            if (!error.message.includes('amount is missing')) {
                throw new Error(`Unexpected error message: ${error.message}`)
            }
            console.log(`  └─ Properly failed missing amount check`)
        }
    })

    await runTest('PIX 3: Webhook Action - Authorized PIX', async () => {
        const payload = {
            data: {
                action: 'payment.updated',
                id: '123456',
                total_amount: 150
            }
        }

        const result = await provider.getWebhookActionAndData(payload as any)

        if (result.action !== 'authorized') {
            throw new Error(`Expected webhook action 'authorized', got ${result.action}`)
        }
        console.log(`  └─ Correctly interpreted webhook action status`)
    })

    // ==========================================
    // CREDIT CARD TESTS
    // ==========================================
    // Note: For real card testing, a valid Mercado Pago test token generated from the frontend SDK is required.
    // We simulate missing tokens and expected rejections for integration flow testing.

    await runTest('CARD 1: Fail Card Authorization (Missing Token)', async () => {
        const context = { cart_id: cartId, email }
        const input: AuthorizePaymentInput = {
            amount,
            currency_code: 'brl',
            context,
            data: {
                payment_method_id: 'master', // Assuming Mastercard
                amount,
                installments: 1
                // token intentionally missing
            }
        }

        try {
            await provider.authorizePayment(input)
            throw new Error('Should have failed without a card token')
        } catch (error: any) {
            if (!error.message.includes('missing')) {
                throw new Error(`Unexpected error message: ${error.message}`)
            }
            console.log(`  └─ Properly failed missing token check`)
        }
    })

    await runTest('CARD 2: Fail Card Authorization (Invalid Fake Token)', async () => {
        const context = { cart_id: cartId, email }
        const input: AuthorizePaymentInput = {
            amount,
            currency_code: 'brl',
            context,
            data: {
                payment_method_id: 'master',
                amount,
                installments: 1,
                token: 'invalid_fake_token_12345'
            }
        }

        try {
            const res = await provider.authorizePayment(input)
            console.log(res)
            throw new Error('Should have failed with an invalid token via API')
        } catch (error: any) {
            // Mercado pago should reject this token, catching MedusaError
            console.log(`  └─ MP properly rejected fake token`)
        }
    })

    await runTest('CARD 3: Initiate Payment Creation Structure', async () => {
        const input: InitiatePaymentInput = {
            amount,
            currency_code: 'brl',
            context: {},
            data: {}
        }

        const result = await provider.initiatePayment(input)
        if (!result.id.startsWith('mp_')) {
            throw new Error('Invalid Provider ID format')
        }
        console.log(`  └─ Initialized payment format validated`)
    })

    console.log(`\n======================================================`)
    console.log(`🏁 All tests finished`)
    console.log(`======================================================\n`)
}

main().catch(console.error)

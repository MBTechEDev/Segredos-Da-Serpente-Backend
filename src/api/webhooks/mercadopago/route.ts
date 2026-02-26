import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import crypto from "crypto"

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    try {
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET

        // Validação HMAC (Regra 4)
        if (webhookSecret) {
            const signature = req.headers["x-signature"] as string
            const requestId = req.headers["x-request-id"] as string

            if (!signature || !requestId) {
                return res.status(400).json({ error: "Missing signatures" })
            }

            const parts = signature.split(',')
            let ts = ''
            let v1 = ''

            for (const part of parts) {
                const [key, value] = part.split('=')
                if (key === 'ts') ts = value
                if (key === 'v1') v1 = value
            }

            const queryData = req.query as any
            const dataID = (queryData['data.id'] || (req.body as any)?.data?.id || "").toLowerCase()

            const manifest = `id:${dataID};request-id:${requestId};ts:${ts};`
            const hmac = crypto.createHmac('sha256', webhookSecret)
            hmac.update(manifest)
            const digest = hmac.digest('hex')

            if (digest !== v1) {
                return res.status(403).json({ error: "Invalid signature" })
            }
        }

        // Despachando evento para o fluxo Core do Medusa V2
        try {
            const paymentModule = req.scope.resolve("payment")
            const { processPaymentWorkflow } = await import("@medusajs/core-flows")

            const actionAndData = await paymentModule.getWebhookActionAndData({
                provider: "mercadopago_mercadopago",
                payload: {
                    data: req.body as Record<string, unknown>,
                    rawData: req.body as unknown as string | Buffer,
                    headers: req.headers as any,
                }
            })

            if (actionAndData.action !== "not_supported" && actionAndData.action !== "failed") {
                await processPaymentWorkflow(req.scope).run({
                    input: actionAndData as any
                })
            }
        } catch (err) {
            console.error("Error processing webhook in Medusa:", err)
        }

        // Respondendo com 200 OK imediatamente (até 22 segundos)
        res.status(200).send("OK")
    } catch (e: any) {
        res.status(500).json({ error: e.message })
    }
}

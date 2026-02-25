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
            const dataID = queryData['data.id'] || (req.body as any)?.data?.id

            const manifest = `id:${dataID};request-id:${requestId};ts:${ts}`
            const hmac = crypto.createHmac('sha256', webhookSecret)
            hmac.update(manifest)
            const digest = hmac.digest('hex')

            if (digest !== v1) {
                return res.status(403).json({ error: "Invalid signature" })
            }
        }

        // TODO: Aqui é possível despachar o evento de pagamento capturado via modules ou workflow do medusa. 
        // Por ora, as regras determinam o envio imediato do status 200.

        // Respondendo com 200 OK imediatamente (até 22 segundos)
        res.status(200).send("OK")
    } catch (e: any) {
        res.status(500).json({ error: e.message })
    }
}

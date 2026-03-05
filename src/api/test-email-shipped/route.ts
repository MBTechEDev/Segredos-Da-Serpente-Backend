import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

    const { to } = req.body as any

    if (!to) {
        return res.status(400).json({
            success: false,
            message: "O campo 'to' é obrigatório."
        })
    }

    try {
        await notificationModuleService.createNotifications({
            to: to,
            channel: "email",
            template: "order-shipped",
            data: {
                order: {
                    id: "order_test_456",
                    display_id: "7777",
                    email: to,
                    shipping_address: { first_name: "Adepto" },
                },
                tracking_numbers: ["BR123456789XP"],
                tracking_urls: ["https://melhorenvio.com.br/rastreio/BR123456789XP"]
            }
        })

        res.json({
            success: true,
            message: "E-mail de teste 'order-shipped' enviado com sucesso!",
            details: { to, template: "order-shipped" }
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Erro ao enviar e-mail de teste.",
            error: error.message
        })
    }
}

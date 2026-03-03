import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

    const { to, template } = req.body as any

    try {
        await notificationModuleService.createNotifications({
            to: to,
            channel: "email",
            template: template || "order-placed",
            data: {
                // Dados mocado genéricos para o template não quebrar
                order: {
                    id: "order_test_123",
                    display_id: "1001",
                    email: to,
                    total: 10000, // $100.00
                    currency_code: "BRL",
                    items: [{ title: "Produto Teste", quantity: 1, unit_price: 10000 }],
                    shipping_address: { first_name: "Cliente", last_name: "Teste" },
                },
                reset_url: "https://segredosdaserpente.com/reset?token=test",
                invite_url: "https://segredosdaserpente.com/invite?token=test"
            }
        })

        res.json({
            success: true,
            message: "E-mail de teste enviado com sucesso!",
            details: { to, template: template || "order-placed" }
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Erro ao enviar e-mail de teste.",
            error: error.message
        })
    }
}

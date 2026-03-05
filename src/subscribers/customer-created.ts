import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function customerCreatedHandler({
    event: { data },
    container,
}: SubscriberArgs<{
    id: string
}>) {
    const query = container.resolve("query")
    const notificationModuleService = container.resolve("notification")

    // Buscamos os dados do customer recém-criado
    const { data: [customer] } = await query.graph({
        entity: "customer",
        fields: [
            "email",
            "first_name",
            "last_name",
            "has_account"
        ],
        filters: {
            id: data.id,
        }
    })

    if (!customer || !customer.email) {
        console.warn(`[customer-created] Customer ${data.id} não possui email ou não foi encontrado.`);
        return
    }

    try {
        await notificationModuleService.createNotifications({
            to: customer.email,
            template: "customer-created",
            channel: "email",
            data: {
                customer,
            }
        })
        console.log(`✅ [customer-created] Email de boas-vindas enviado para ${customer.email}`);
    } catch (error: any) {
        console.error("❌ Falha ao enviar email do customer-created:", error?.message || error)
    }
}

export const config: SubscriberConfig = {
    event: "customer.created",
}

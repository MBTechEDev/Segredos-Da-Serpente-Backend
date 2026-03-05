import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function shipmentCreatedHandler({
    event: { data },
    container,
}: SubscriberArgs<{
    id: string
}>) {
    console.log("==========================================")
    console.log("🔥 SUBSCRIBER INVOCADO: shipment.created -> ", data.id);
    console.log("==========================================")

    const query = container.resolve("query")
    const notificationModuleService = container.resolve("notification")

    try {
        // O evento shipment.created manda o ID do fulfillment
        const { data: [fulfillment] } = await query.graph({
            entity: "fulfillment",
            fields: [
                "id",
                "labels.tracking_number",
                "labels.tracking_url",
                "order.email",
                "order.id",
                "order.display_id",
                "order.shipping_address.first_name"
            ],
            filters: {
                id: data.id,
            }
        })

        if (!fulfillment || !fulfillment.order || !fulfillment.order.email) {
            console.warn(`[shipment-created] Fulfillment ${data.id} ignorado, ou não possui order atrelado com email.`);
            return
        }

        const tracking_numbers = fulfillment.labels?.map((l: any) => l.tracking_number).filter(Boolean) || []
        const tracking_urls = fulfillment.labels?.map((l: any) => l.tracking_url).filter(Boolean) || []

        await notificationModuleService.createNotifications({
            to: fulfillment.order.email,
            template: "order-shipped",
            channel: "email",
            data: {
                order: fulfillment.order,
                tracking_numbers,
                tracking_urls
            }
        })
        console.log(`✅ [shipment-created] Email de despacho enviado para ${fulfillment.order.email} do pedido ${fulfillment.order.display_id}`);
    } catch (error: any) {
        console.error("❌ Falha ao enviar email do shipment-created:", error?.message || error)
    }
}

export const config: SubscriberConfig = {
    event: "shipment.created",
}

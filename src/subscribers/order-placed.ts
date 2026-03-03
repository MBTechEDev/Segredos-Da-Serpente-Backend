import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    console.log("==========================================")
    console.log("🔥 SUBSCRIBER INVOCADO: order.placed -> ", data.id);
    console.log("==========================================")

    try {
        const { result, errors } = await sendOrderConfirmationWorkflow(container)
            .run({
                input: {
                    id: data.id
                },
                throwOnError: false // garante que pegamos erros via destruturação em V2
            })

        if (errors?.length > 0) {
            console.error("❌ Erros na execução do workflow de confirmação de pedido:", errors);
        } else {
            console.log("✅ Confirmação de pedido enviada com sucesso! Resultado:", result);
        }
    } catch (err: any) {
        console.error("❌ Exceção ao invocar o sendOrderConfirmationWorkflow:", err?.message || err)
    }
}

export const config: SubscriberConfig = {
    event: "order.placed",
}
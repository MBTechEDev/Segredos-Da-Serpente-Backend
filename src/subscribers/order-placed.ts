import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    console.log("🔥 SUBSCRIBER INVOCADO: order.placed -> ", data.id);

    await sendOrderConfirmationWorkflow(container)
        .run({
            input: {
                id: data.id
            }
        })
}

export const config: SubscriberConfig = {
    event: "order.placed",
}
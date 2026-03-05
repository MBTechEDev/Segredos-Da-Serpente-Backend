import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    try {
        const { result, errors } = await sendOrderConfirmationWorkflow(container)
            .run({
                input: {
                    id: data.id
                },
                throwOnError: false // garante que pegamos erros via destruturação em V2
            })

        if (errors?.length > 0) {
            throw errors
        }
    } catch (err: any) {
        throw err
    }
}

export const config: SubscriberConfig = {
    event: "order.placed",
}
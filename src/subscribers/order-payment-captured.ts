import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

export default async function orderPaymentCapturedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    try {
        const { errors } = await sendOrderConfirmationWorkflow(container)
            .run({
                input: {
                    id: data.id
                },
                throwOnError: false
            })

        if (errors?.length > 0) {
            throw errors;
        }

    }
    catch (err: any) {
        throw err
    }
}

export const config: SubscriberConfig = {
    event: "order.payment_captured"
}
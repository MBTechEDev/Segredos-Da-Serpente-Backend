import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { autoCapturePaymentWorkflow } from "../workflows/auto-capture-payment"

export default async function paymentAuthorizedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    try {
        const { result, errors } = await autoCapturePaymentWorkflow(container)
            .run({
                input: {
                    payment_id: data.id
                },
                throwOnError: false
            })

        if (errors?.length > 0) {
            throw errors
        }
    } catch (err: any) {
        throw err
    }
}

export const config: SubscriberConfig = {
    event: "payment.authorized",
}

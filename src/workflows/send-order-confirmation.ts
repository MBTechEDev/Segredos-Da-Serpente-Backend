import { createWorkflow, when, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
    id: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
    "send-order-confirmation",
    ({ id }: WorkflowInput) => {
        const { data: orders } = useQueryGraphStep({
            entity: "order",
            fields: [
                "id",
                "display_id",
                "email",
                "currency_code",
                "total",
                "items.*",
                "shipping_address.*",
                "billing_address.*",
                "shipping_methods.*",
                "customer.*",
                "total",
                "subtotal",
                "discount_total",
                "shipping_total",
                "tax_total",
                "item_subtotal",
                "item_total",
                "item_tax_total",
            ],
            filters: {
                id
            },
            options: {
                throwIfKeyNotFound: true
            }
        })

        // Resolvemos o `orders[0]` de forma segura pelo Workflow execution (remove proxy array indexing)
        const order = transform({ orders }, (data: any) => data.orders[0] as any)

        const notification = when({ order }, (data: any) => !!data.order?.email)
            .then(() => {
                return sendNotificationStep([{
                    to: order.email,
                    channel: "email",
                    template: "order-placed",
                    data: { order } as any
                }])
            })

        return new WorkflowResponse({
            notification
        })
    }
)
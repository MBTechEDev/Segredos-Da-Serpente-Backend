import { Modules } from "@medusajs/framework/utils"
// Script to see how fulfillment data looks
export default async function ({ container }) {
    const query = container.resolve("query")
    const { data: fulfillments } = await query.graph({
        entity: "fulfillment",
        fields: [
            "id",
            "shipped_at",
            "labels.tracking_number",
            "labels.tracking_url",
            "order.email",
            "order.id",
            "order.display_id",
            "order.shipping_address.first_name"
        ],
        take: 1
    })

    console.log(JSON.stringify(fulfillments, null, 2))
}

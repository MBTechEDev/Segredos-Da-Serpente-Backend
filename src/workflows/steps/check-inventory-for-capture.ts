import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const checkInventoryForCaptureStep = createStep(
    "check-inventory-for-capture",
    async ({ payment_id }: { payment_id: string }, { container }) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const logger = container.resolve("logger")

        // Fetch the payment along with order and variant inventory data
        const { data: payments } = await query.graph({
            entity: "payment",
            fields: [
                "id",
                "amount",
                "payment_collection.order.id",
                "payment_collection.order.items.*",
                "payment_collection.order.items.variant.*",
            ],
            filters: { id: payment_id }
        })

        const payment: any = payments?.[0]

        if (!payment || !payment.payment_collection?.order) {
            logger.warn(`Auto-Capture: Ordem não encontrada para o pagamento ${payment_id}`);
            return new StepResponse({ can_capture: false, reason: "Order not found", payment_id })
        }

        const order = payment.payment_collection.order

        const variantIds: string[] = order.items.map((i: any) => i.variant_id).filter(Boolean)

        if (variantIds.length === 0) {
            logger.info(`Auto-Capture: Produtos sem variante. Procedendo com a captura. (Pagamento: ${payment_id})`);
            return new StepResponse({ can_capture: true, payment_id })
        }

        const { data: variants } = await query.graph({
            entity: "variant",
            fields: [
                "id",
                "manage_inventory",
                "inventory_items.inventory_item.location_levels.available_quantity"
            ],
            filters: { id: variantIds }
        })

        let hasLackOfStock = false

        for (const variant of variants as any[]) {
            if (!variant.manage_inventory) continue

            const levels = variant.inventory_items?.flatMap(
                (ii: any) => ii.inventory_item?.location_levels || []
            ) || []

            const totalAvailable = levels.reduce((acc: number, level: any) => acc + (level.available_quantity || 0), 0)

            // Se available_quantity < 0, significa que vendemos algo no qual ficamos sem estoque (Backorder).
            if (totalAvailable < 0) {
                logger.info(`Auto-Capture: Variante fora de estoque (Backorder detectado) ${variant.id}. Ação manual requerida.`)
                hasLackOfStock = true
                break
            }
        }

        if (hasLackOfStock) {
            logger.info(`Auto-Capture: Falta de estoque detectada. Não efetuando capture de dinheiro. Pagamento ${payment_id} deixado como Auth.`);
            return new StepResponse({ can_capture: false, reason: "Lack of stock (Manual Review)", payment_id })
        }

        logger.info(`Auto-Capture: Estoque ok. Enviando para captura. (Pagamento: ${payment_id})`)
        return new StepResponse({ can_capture: true, payment_id })
    }
)

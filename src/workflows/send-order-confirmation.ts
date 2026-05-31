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
                "payment_status",
                "payment_collections.payments.*", // <-- Buscando dados profundos do pagamento
            ],
            filters: {
                id
            },
            options: {
                throwIfKeyNotFound: true
            }
        })

        const order = transform({ orders }, (data: any) => data.orders[0] as any)

        // Inteligência de roteamento do e-mail
        const notificationData = transform({ order }, (data: any) => {
            const orderObj = data.order;
            if (!orderObj?.email) return [];

            // Localiza o nó de pagamento do Mercado Pago
            const payment = orderObj.payment_collections?.[0]?.payments?.[0];
            const paymentData = payment?.data || {};

            // Identifica se é PIX pelas propriedades retornadas pelo seu Service
            const isPix = !!(paymentData.qr_code || paymentData.ticket_url);
            const isPaid = orderObj.payment_status === "captured" || paymentData.mp_status === "approved";

            // CASO 1: É PIX e ainda não foi pago -> Envia instruções de pagamento
            if (isPix && !isPaid) {
                return [{
                    to: orderObj.email,
                    channel: "email",
                    template: "pix-reminder",
                    data: {
                        order: orderObj,
                        qr_code: paymentData.qr_code,              // Copia e Cola
                        qr_code_base64: paymentData.qr_code_base64,  // Imagem do QR Code
                        ticket_url: paymentData.ticket_url          // Link externo MP
                    }
                }];
            }

            // CASO 2: Não é PIX (ex: Cartão aprovado) OU PIX que acabou de ser pago -> Envia confirmação padrão
            return [{
                from: 'nao-responda@segredosdaserpente.com.br',
                to: orderObj.email,
                bcc: ['contato@segredosdaserpente.com.br'],
                channel: "email",
                template: "order-placed",
                data: { order: orderObj }
            }];
        });

        const notification = when({ notificationData }, (data: any) => data.notificationData.length > 0)
            .then(() => {
                return sendNotificationStep(notificationData);
            })

        return new WorkflowResponse({
            notification
        })
    }
)
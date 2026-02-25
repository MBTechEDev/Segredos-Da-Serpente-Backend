import {
    AbstractPaymentProvider,
    MedusaError,
    PaymentSessionStatus,
    BigNumber
} from "@medusajs/framework/utils"
import {
    Logger,
    InitiatePaymentInput,
    InitiatePaymentOutput,
    AuthorizePaymentInput,
    AuthorizePaymentOutput,
    GetPaymentStatusInput,
    GetPaymentStatusOutput,
    CapturePaymentInput,
    CapturePaymentOutput,
    RefundPaymentInput,
    RefundPaymentOutput,
    CancelPaymentInput,
    CancelPaymentOutput,
    DeletePaymentInput,
    DeletePaymentOutput,
    RetrievePaymentInput,
    RetrievePaymentOutput,
    UpdatePaymentInput,
    UpdatePaymentOutput,
    ProviderWebhookPayload,
    WebhookActionResult
} from "@medusajs/framework/types"
import { MercadoPagoConfig, Order } from "mercadopago"

type Options = {
    accessToken: string
    publicKey: string
    webhookSecret?: string
}

type InjectedDependencies = {
    logger: Logger
}

export default class MercadoPagoProviderService extends AbstractPaymentProvider<Options> {
    static identifier = "mercadopago"

    protected mpClient: MercadoPagoConfig
    protected logger: Logger
    protected orderClient: Order

    constructor(container: InjectedDependencies, options: Options) {
        super(container, options)
        this.logger = container.logger

        this.mpClient = new MercadoPagoConfig({
            accessToken: options.accessToken,
        })
        this.orderClient = new Order(this.mpClient)
    }

    private formatAmount(amount: any): string {
        const rawValue = typeof amount === "object" && "numeric" in amount ? amount.numeric : amount;
        return (Number(rawValue) / 100).toFixed(2);
    }

    async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
        return {
            id: `mp_${Date.now()}`,
            data: {
                status: "pending",
                amount: input.amount
            }
        }
    }

    async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
        const { data, context } = input

        const amount = data?.amount
        const token = data?.token as string
        const cartId = (context as any)?.cart_id || "medusa-cart"
        const email = (context as any)?.email || "customer@testuser.com"
        const deviceId = (data?.device_id as string) || undefined

        const paymentMethodId = (data?.payment_method_id as string) || "master"
        const isPix = paymentMethodId === "pix"

        if (!isPix && !token) {
            throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart Token is missing")
        }

        if (!amount) {
            throw new MedusaError(MedusaError.Types.INVALID_DATA, "Payment amount is missing in session data")
        }

        try {
            const totalAmountStr = this.formatAmount(amount)

            const paymentMethodConfig: any = {
                id: isPix ? "pix" : paymentMethodId,
                type: isPix ? "bank_transfer" : "credit_card",
            }

            if (!isPix) {
                paymentMethodConfig.token = token
                paymentMethodConfig.installments = Number(data?.installments) || 1
            }

            // Excluir propriedades sensíveis (Regra 5)
            const safeData = { ...data }
            delete safeData.token
            delete safeData.cvv

            // Gerar X-Idempotency-Key
            const idempotencyKey = ((context as any)?.idempotency_key as string) || `mp_${cartId}_${Date.now()}`

            const orderRequest = {
                body: {
                    type: "online",
                    processing_mode: "automatic",
                    external_reference: cartId,
                    total_amount: totalAmountStr,
                    payer: { email },
                    transactions: {
                        payments: [{
                            amount: totalAmountStr,
                            payment_method: paymentMethodConfig
                        }]
                    },
                    additional_info: {
                        ip_address: (context as any)?.ip || undefined,
                    },
                    ...(deviceId && { device_id: deviceId })
                },
                requestOptions: {
                    idempotencyKey: idempotencyKey
                }
            }

            const response = await this.orderClient.create(orderRequest)
            const payment = response.transactions?.payments?.[0]

            if (payment?.status === "rejected") {
                throw new MedusaError(
                    MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
                    `Mercado Pago: ${payment.status_detail}`
                )
            }

            let medusaStatus = PaymentSessionStatus.PENDING
            if (
                payment?.status === "approved" ||
                payment?.status === "pending" ||
                payment?.status === "action_required"
            ) {
                medusaStatus = PaymentSessionStatus.AUTHORIZED
            }

            const transactionData = (payment as any)?.point_of_interaction?.transaction_data;
            const qrCode = transactionData?.qr_code || payment?.payment_method?.qr_code
            const qrCodeBase64 = transactionData?.qr_code_base64 || payment?.payment_method?.qr_code_base64
            const ticketUrl = transactionData?.ticket_url || payment?.payment_method?.ticket_url

            return {
                status: medusaStatus,
                data: {
                    ...safeData,
                    mp_order_id: response.id,
                    mp_status: payment?.status,
                    mp_status_detail: payment?.status_detail,
                    ...(isPix && {
                        qr_code: qrCode,
                        qr_code_base64: qrCodeBase64,
                        ticket_url: ticketUrl
                    })
                }
            }
        } catch (error: any) {
            this.logger.error(`[MercadoPago] Full Error in authorizePayment: ${JSON.stringify(error)}`);
            if (error.cause) {
                this.logger.error(`[MercadoPago] Error Cause: ${JSON.stringify(error.cause)}`);
            }
            if (error.response || error.api_response) {
                this.logger.error(`[MercadoPago] API Response: ${JSON.stringify(error.response || error.api_response)}`);
            }
            const detailedMessage = error.cause?.message || error.message || "Unknown error";
            throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, detailedMessage)
        }
    }

    async getWebhookActionAndData(
        payload: ProviderWebhookPayload["payload"]
    ): Promise<WebhookActionResult> {
        const { data } = payload
        const action = data?.action as string || "payment.updated"

        try {
            const amountVal = Number(data?.total_amount) || Number(data?.transaction_amount) || 0;
            // No v2, WebhookActionResult exige session_id e amount para ações válidas 
            return {
                action: action === "payment.updated" || action === "payment.created" ? "authorized" : "failed",
                data: {
                    session_id: (data?.id as string) || "unknown",
                    amount: new BigNumber(amountVal)
                }
            }
        } catch (e) {
            return {
                action: "failed",
                data: { session_id: "error", amount: new BigNumber(0) }
            }
        }
    }

    async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
        const orderId = input.data?.mp_order_id as string
        if (!orderId) return { status: PaymentSessionStatus.PENDING }

        try {
            const response = await (this.orderClient as any).get({ id: orderId });

            const payment = response.transactions?.payments?.[0];
            const mpStatus = payment?.status || response.status;

            let medusaStatus = PaymentSessionStatus.PENDING;

            if (mpStatus === 'approved' || mpStatus === 'accredited') {
                medusaStatus = PaymentSessionStatus.AUTHORIZED;
            } else if (mpStatus === 'cancelled' || mpStatus === 'refunded') {
                medusaStatus = PaymentSessionStatus.CANCELED;
            } else if (mpStatus === 'rejected') {
                medusaStatus = PaymentSessionStatus.ERROR;
            } else if (mpStatus === 'pending' || mpStatus === 'in_process' || mpStatus === 'waiting_payment') {
                medusaStatus = PaymentSessionStatus.PENDING;
            }

            return { status: medusaStatus };
        } catch (error) {
            this.logger.error(`Error fetching MP order status: ${error}`);
            return { status: PaymentSessionStatus.ERROR }
        }
    }

    async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> { return { data: input.data || {} } }
    async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> { return { data: input.data || {} } }
    async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> { return { data: input.data || {} } }
    async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> { return { data: {} } }
    async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> { return input.data || {} }
    async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> { return { data: input.data || {} } }
}

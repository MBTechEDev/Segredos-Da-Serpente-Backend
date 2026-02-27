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
import { MercadoPagoConfig, Order, Payment } from "mercadopago"

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
    protected paymentClient: Payment
    protected accessToken: string

    constructor(container: InjectedDependencies, options: Options) {
        super(container, options)
        this.logger = container.logger

        this.mpClient = new MercadoPagoConfig({
            accessToken: options.accessToken,
        })
        this.orderClient = new Order(this.mpClient)
        this.paymentClient = new Payment(this.mpClient)
        this.accessToken = options.accessToken
    }

    private formatAmount(amount: any): string {
        const rawValue = typeof amount === "object" && "numeric" in amount ? amount.numeric : amount;
        return Number(rawValue).toFixed(2);
    }

    async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
        const cartId = ((input.context as any)?.cart_id as string) || `mp_${Date.now()}`;
        return {
            id: cartId,
            data: {
                ...(input.data ?? {}),
                status: "pending",
                session_id: cartId,
                amount: input.amount
            }
        }
    }

    async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
        const { data, context } = input

        this.logger.info(`[MercadoPago] authorizePayment INICIADO - Data Recebida: ${JSON.stringify(data, null, 2)}`);
        this.logger.info(`[MercadoPago] authorizePayment INICIADO - Context Recebido: ${JSON.stringify(context, null, 2)}`);

        const amount = data?.amount
        const token = data?.token as string
        const cartId = (context as any)?.cart_id || (data as any)?.session_id
        if (!cartId) {
            throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart ID ou Session ID é obrigatório.")
        }
        const email = (context as any)?.email
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
            }

            if (!isPix) {
                paymentMethodConfig.type = "credit_card"
                paymentMethodConfig.token = token
                paymentMethodConfig.installments = Number(data?.installments) || 1
                // NOTA: A API /v1/orders não suporta a propriedade 'issuer_id' dentro de payment_method.
                // O token gerado no frontend já carrega o contexto do banco emissor.
            } else {
                paymentMethodConfig.type = "bank_transfer"
            }

            // Excluir propriedades sensíveis (Regra 5)
            const safeData = { ...data }
            delete safeData.token
            delete safeData.cvv
            delete safeData.payer

            // Gerar X-Idempotency-Key
            const idempotencyKey = ((context as any)?.idempotency_key as string) || `mp_${cartId}_${Date.now()}`

            const frontendPayer = data?.payer as any || {};
            const customerEmail = frontendPayer.email || email;

            if (!customerEmail) {
                throw new MedusaError(MedusaError.Types.INVALID_DATA, "E-mail do cliente é obrigatório para o Mercado Pago.")
            }

            const customerName = frontendPayer.first_name || (context as any)?.first_name
            const customerLastName = frontendPayer.last_name || (context as any)?.last_name

            if (!customerName || !customerLastName) {
                throw new MedusaError(MedusaError.Types.INVALID_DATA, "Nome e sobrenome do cliente são obrigatórios para o Mercado Pago.")
            }

            const identificationType = frontendPayer.identification?.type
            const identificationNumber = frontendPayer.identification?.number

            if (!identificationType || !identificationNumber) {
                throw new MedusaError(MedusaError.Types.INVALID_DATA, "Tipo e número do documento de identificação são obrigatórios para o Mercado Pago.")
            }

            let paymentResponse: any = {}
            let isOrder = true

            const orderRequest: any = {
                body: {
                    type: "online",
                    external_reference: cartId,
                    total_amount: totalAmountStr,
                    payer: {
                        email: customerEmail,
                        first_name: customerName,
                        last_name: customerLastName,
                        identification: {
                            type: identificationType,
                            number: identificationNumber
                        }
                    },
                    transactions: {
                        payments: [{
                            amount: totalAmountStr,
                            payment_method: paymentMethodConfig
                        }]
                    }
                }
            }

            // A idempotency key do Medusa não muda por sessão. Se trocarmos informações no checkout 
            // e tentarmos a mesma key, o Mercado Pago retorna 500 Internal Error ou key_already_used.
            // Para não travar seus testes de Frontend com o mesmo ID do carrinho, incluimos o Timestamp do clique final
            const payloadHash = Buffer.from(JSON.stringify(orderRequest.body)).toString('base64').substring(0, 10);
            const finalIdempotencyKey = `${idempotencyKey}_${payloadHash}_${Date.now()}`

            orderRequest.requestOptions = {
                idempotencyKey: finalIdempotencyKey
            }

            if (!isPix) {
                orderRequest.body.processing_mode = "automatic"
                orderRequest.body.capture_mode = "manual"
            }

            const response = await this.orderClient.create(orderRequest)
            paymentResponse = response.transactions?.payments?.[0] || {}
            paymentResponse.order_id = response.id
            paymentResponse.order_status = response.status

            if (paymentResponse?.status === "rejected") {
                throw new MedusaError(
                    MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
                    `Mercado Pago: ${paymentResponse.status_detail}`
                )
            }

            let medusaStatus = PaymentSessionStatus.PENDING
            const validPaymentStatuses = ["approved", "pending", "action_required", "in_process", "processed", "accredited"]
            const validOrderStatuses = ["processed", "opened", "testing"]

            if (paymentResponse?.status && validPaymentStatuses.includes(paymentResponse.status as string)) {
                medusaStatus = PaymentSessionStatus.AUTHORIZED
            } else if (isOrder && paymentResponse?.order_status && validOrderStatuses.includes(paymentResponse.order_status as string)) {
                medusaStatus = PaymentSessionStatus.AUTHORIZED
            }

            // Na API de Payments antiga ficava em point_of_interaction.
            // Na API de Orders, as infos do PIX ficam em payment_method
            const transactionData = paymentResponse?.point_of_interaction?.transaction_data;
            const pmData = paymentResponse?.payment_method;

            const qrCode = transactionData?.qr_code || pmData?.qr_code
            const qrCodeBase64 = transactionData?.qr_code_base64 || pmData?.qr_code_base64
            const ticketUrl = transactionData?.ticket_url || pmData?.ticket_url

            return {
                status: medusaStatus,
                data: {
                    ...safeData,
                    session_id: cartId,
                    mp_id: paymentResponse?.id,
                    mp_order_id: paymentResponse?.order_id,
                    mp_status: paymentResponse?.status,
                    mp_status_detail: paymentResponse?.status_detail,
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
        const { data } = payload as any;
        const resourceType = data?.type as string; // 'payment' ou 'order'
        const resourceId = data?.data?.id as string;

        if (!resourceId) {
            return { action: "not_supported" }
        }

        let mpStatus = "";
        let externalReference = "unknown";
        let amountVal = 0;

        try {
            if (resourceType === "order") {
                const response = await this.orderClient.get({ id: resourceId });
                const payment = response.transactions?.payments?.[0];
                mpStatus = payment?.status || response.status || "";
                amountVal = Number(response.total_amount) || 0;
                externalReference = response.external_reference || "unknown";
            } else if (resourceType === "payment") {
                const response = await this.paymentClient.get({ id: resourceId });
                mpStatus = response.status || "";
                amountVal = Number(response.transaction_amount) || 0;
                externalReference = response.external_reference || "unknown";
            } else {
                return { action: "not_supported" }
            }

            let action: WebhookActionResult["action"] = "not_supported";
            if (mpStatus === 'approved' || mpStatus === 'accredited') {
                action = "authorized";
            } else if (mpStatus === 'cancelled' || mpStatus === 'refunded') {
                action = "canceled";
            } else if (mpStatus === 'rejected') {
                action = "failed";
            }

            return {
                action,
                data: {
                    session_id: externalReference,
                    amount: new BigNumber(amountVal)
                }
            }
        } catch (error: any) {
            this.logger.error(`[MercadoPago] Error fetching webhook resource details: ${error.message}`);
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

    async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
        const orderId = input.data?.mp_order_id as string
        if (!orderId) {
            throw new MedusaError(MedusaError.Types.INVALID_DATA, "mp_order_id not found in payment data")
        }

        try {
            // Utiliza idempotency key para evitar captura duplicada
            const idempotencyKey = `capture_${orderId}_${Date.now()}`

            const responseData = await this.orderClient.capture({
                id: orderId,
                requestOptions: {
                    idempotencyKey: idempotencyKey
                }
            })

            return {
                data: {
                    ...input.data,
                    mp_capture_status: responseData.status,
                    mp_capture_detail: responseData.status_detail
                }
            }
        } catch (error: any) {
            this.logger.error(`[MercadoPago] Error in capturePayment: ${error.message}`)
            throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Error capturing payment: ${error.message}`)
        }
    }

    async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> { return { data: input.data || {} } }
    async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
        const orderId = input.data?.mp_order_id as string
        if (!orderId) {
            return { data: input.data || {} }
        }

        try {
            const idempotencyKey = `cancel_${orderId}_${Date.now()}`

            const responseData = await this.orderClient.cancel({
                id: orderId,
                requestOptions: {
                    idempotencyKey: idempotencyKey
                }
            })

            return {
                data: {
                    ...input.data,
                    mp_cancel_status: responseData.status,
                    mp_cancel_detail: responseData.status_detail
                }
            }
        } catch (error: any) {
            this.logger.error(`[MercadoPago] Error in cancelPayment: ${error.message}`)
            throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Error canceling payment: ${error.message}`)
        }
    }
    async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> { return { data: {} } }
    async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> { return input.data || {} }
    async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> { return { data: input.data || {} } }
}

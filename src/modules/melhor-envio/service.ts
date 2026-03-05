import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import {
    FulfillmentOption,
    CalculateShippingOptionPriceDTO,
    CalculatedShippingOptionPrice
} from "@medusajs/framework/types"
import { MelhorEnvioClient, MelhorEnvioOptions } from "./client"

class MelhorEnvioProviderService extends AbstractFulfillmentProviderService {
    static identifier = "melhor-envio" // Identificador único do provedor [cite: 53]
    protected client: MelhorEnvioClient
    protected options_: MelhorEnvioOptions

    constructor({ }, options: MelhorEnvioOptions) {
        super()
        this.options_ = options
        this.client = new MelhorEnvioClient(options)
    }

    /**
     * Retorna as modalidades de envio disponíveis no Melhor Envio.
     */
    async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
        return [
            { id: "1", name: "Correios PAC" },
            { id: "2", name: "Correios SEDEX" },
            { id: "17", name: "Jadlog Package" },
            { id: "18", name: "Jadlog .COM" }
        ]
    }

    /**
     * [cite_start]Valida se o provedor suporta preços calculados[cite: 102].
     */
    async canCalculate(data: any): Promise<boolean> {
        return true
    }

    /**
     * Método central para o Checkout. [cite_start]Calcula o frete em tempo real[cite: 106, 421].
     */
    async calculatePrice(
        optionData: Record<string, any>,
        data: Record<string, any>,
        context: CalculateShippingOptionPriceDTO["context"]
    ): Promise<CalculatedShippingOptionPrice> {
        const { items, shipping_address, from_location } = context

        // Type Guard: Garante que os CEPs existam e limpa caracteres não numéricos
        if (!shipping_address?.postal_code || !from_location?.address?.postal_code) {
            return { calculated_amount: 0, is_calculated_price_tax_inclusive: false }
        }

        const fromPostalCode = from_location.address.postal_code.replace(/\D/g, '')
        const toPostalCode = shipping_address.postal_code.replace(/\D/g, '')

        // Mapeia itens do Medusa para o formato de produtos do Melhor Envio [cite: 156, 624]
        const products = items.map((item: any) => ({
            id: String(item.variant_sku || item.title).substring(0, 50),
            width: Number(item.variant?.width) || 10,
            height: Number(item.variant?.height) || 10,
            length: Number(item.variant?.length) || 10,
            weight: Math.max(0.001, (Number(item.variant?.weight) || 200) / 1000), // Converte g para kg
            // CORREÇÃO: unit_price do Medusa é centavo, Melhor Envio quer real (R$)
            insurance_value: Number(item.unit_price) / 100,
            quantity: Number(item.quantity)
        }))

        const payload = {
            from: { postal_code: fromPostalCode },
            to: { postal_code: toPostalCode },
            products,
            services: String(optionData.id) // ID do serviço (ex: "1" para PAC)
        }

        try {
            const rates = await this.client.calculate(payload);

            // ... (lógica de selectedRate igual ao anterior)
            let selectedRate: any = null;
            if (Array.isArray(rates)) {
                selectedRate = rates.find((r: any) => String(r.id) === String(optionData.id));
            } else if (rates && typeof rates === 'object') {
                selectedRate = String(rates.id) === String(optionData.id) ? rates : null;
            }

            /**
             * TRAVA DE SEGURANÇA (BACKEND):
             * Em vez de retornar 0, lançamos um erro.
             * Isso garante que se alguém tentar forçar este ID via API, o Medusa rejeitará a requisição.
             */
            if (!selectedRate || selectedRate.error) {
                const errorMessage = selectedRate?.error || 'Serviço não retornado pela transportadora';
                console.warn(`⛔ [Melhor Envio] Bloqueando seleção do serviço ${optionData.id}: ${errorMessage}`);

                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    `O método de entrega escolhido não está disponível para este trecho: ${errorMessage}`
                );
            }

            // CORREÇÃO DE ESCALA MANTIDA:
            const finalPrice = parseFloat(selectedRate.price);

            return {
                calculated_amount: finalPrice,
                is_calculated_price_tax_inclusive: true
            }

        } catch (error: any) {
            // Se o erro já for do tipo MedusaError (lançado acima), apenas repassamos
            if (error.type) {
                throw error;
            }

            // Erros de conexão ou outros inesperados
            console.error("❌ [Melhor Envio] Erro crítico no calculatePrice:", error);
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                "Não foi possível calcular o frete neste momento."
            );
        }
    }

    /**
     *Valida os dados antes da criação do método de envio[cite: 186, 387].
     */
    async validateFulfillmentData(
        optionData: Record<string, unknown>,
        data: Record<string, unknown>,
        context: Record<string, unknown>
    ): Promise<any> {
        return {
            ...data,
            service_id: optionData.id // Garante que o ID do serviço persista [cite: 199]
        }
    }

    /**
     *Executado na criação do fulfillment[cite: 201, 432].
     */
    async createFulfillment(
        data: any,
        items: any[],
        order: any,
        fulfillment: any
    ): Promise<any> {
        return {
            data: {
                ...fulfillment.data,
                status: "queued_in_melhor_envio"
            }
        }
    }

    /**
     *Cancelamento de fulfillments[cite: 230, 442].
     */
    async cancelFulfillment(data: any): Promise<any> {
        return {}
    }
}

export default MelhorEnvioProviderService
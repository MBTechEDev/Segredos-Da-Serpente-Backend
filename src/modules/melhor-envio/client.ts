import axios, { AxiosInstance } from "axios";
import { MedusaError } from "@medusajs/framework/utils";

export type MelhorEnvioOptions = {
    api_token: string;
    sandbox?: boolean;
    contact_email: string;
};

export class MelhorEnvioClient {
    private axiosClient: AxiosInstance;
    private options: MelhorEnvioOptions;

    constructor(options: MelhorEnvioOptions) {
        this.options = options;

        const baseURL = options.sandbox
            ? "https://sandbox.melhorenvio.com.br"
            : "https://melhorenvio.com.br";

        this.axiosClient = axios.create({
            baseURL,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${options.api_token}`, // Injeção direta conforme Postman
                'User-Agent': `MedusaV2-Integration (${options.contact_email})`
            }
        });

    }

    /**
     * [cite_start]Cálculo de Fretes [cite: 340]
     */
    async calculate(payload: any) {
        try {
            const { data } = await this.axiosClient.post("/api/v2/me/shipment/calculate", payload);
            return data;
        } catch (error: any) {
            this.handleError("Erro na cotação", error);
        }
    }

    /**
     * [cite_start]Inserir fretes no carrinho [cite: 350]
     */
    async addToCart(payload: any) {
        try {
            const { data } = await this.axiosClient.post("/api/v2/me/cart", payload);
            return data;
        } catch (error: any) {
            this.handleError("Erro ao inserir no carrinho", error);
        }
    }

    /**
     * [cite_start]Compra de fretes (Checkout) [cite: 345]
     */
    async checkout(orderIds: string[]) {
        try {
            const { data } = await this.axiosClient.post("/api/v2/me/shipment/checkout", { orders: orderIds });
            return data;
        } catch (error: any) {
            this.handleError("Erro no checkout", error);
        }
    }

    /**
     * [cite_start]Geração de etiquetas [cite: 319]
     */
    async generateLabel(orderIds: string[]) {
        try {
            const { data } = await this.axiosClient.post("/api/v2/me/shipment/generate", { orders: orderIds });
            return data;
        } catch (error: any) {
            this.handleError("Erro na geração de etiquetas", error);
        }
    }

    private handleError(message: string, error: any) {
        const status = error.response?.status;
        const data = error.response?.data;

        console.error(`❌ [Melhor Envio] ${message} | Status: ${status}`, JSON.stringify(data, null, 2));

        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `${message}: ${status === 401 ? "Token Inválido ou Expirado" : JSON.stringify(data)}`
        );
    }
}
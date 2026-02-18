/**
 * Opções de configuração do módulo injetadas via medusa-config.ts
 */
export type MelhorEnvioOptions = {
    api_token: string;
    sandbox?: boolean;
    contact_email: string; // Exigido para o User-Agent da API [cite: 599]
};

/**
 * Representação de um produto para cálculo de frete no Melhor Envio
 */
export type MelhorEnvioProduct = {
    id: string;
    width: number;  // cm
    height: number; // cm
    length: number; // cm
    weight: number; // kg
    insurance_value: number;
    quantity: number;
};

/**
 * Payload para o endpoint de cálculo (/api/v2/me/shipment/calculate)
 */
export type CalculateDeadlineRequest = {
    from: {
        postal_code: string;
    };
    to: {
        postal_code: string;
    };
    products: MelhorEnvioProduct[];
    services?: string; // IDs dos serviços separados por vírgula (ex: "1,2") [cite: 624]
};

/**
 * Resposta de uma cotação individual da API
 */
export type MelhorEnvioQuote = {
    id: number;
    name: string;
    price: number;
    custom_price: number;
    discount: number;
    currency: string;
    delivery_time: number;
    error?: string;
};

/**
 * Estrutura para persistência de dados no Fulfillment do Medusa
 */
export type FulfillmentData = {
    service_id: string;
    cart_id?: string;
    label_id?: string;
    tracking_code?: string;
};

/**
 * Interface para a etiqueta (Label) após a geração
 */
export type MelhorEnvioLabel = {
    id: string;
    status: string;
    tracking?: string;
    price: number;
    created_at: string;
};
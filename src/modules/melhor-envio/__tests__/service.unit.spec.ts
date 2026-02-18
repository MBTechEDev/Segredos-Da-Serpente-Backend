import { MedusaContainer } from "@medusajs/framework/types"
import MelhorEnvioProviderService from "../service"

// Mock do Cliente para evitar chamadas reais à API durante os testes
const mockCalculate = jest.fn()
jest.mock("../client", () => ({
    MelhorEnvioClient: jest.fn().mockImplementation(() => ({
        calculate: mockCalculate
    }))
}))

describe("MelhorEnvioProviderService", () => {
    let service: MelhorEnvioProviderService

    beforeEach(() => {
        jest.clearAllMocks()
        // Inicializa o serviço com opções de teste conforme exigido pelo construtor [cite: 57, 71]
        service = new MelhorEnvioProviderService({}, {
            api_token: "fake_token",
            sandbox: true,
            contact_email: "test@example.com"
        })
    })

    it("deve retornar as opções de fulfillment configuradas", async () => {
        const options = await service.getFulfillmentOptions()
        expect(options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "1", name: "Correios SEDEX" })
            ])
        ) //[cite: 75, 93]
    })

    it("deve calcular o preço corretamente convertendo para centavos", async () => {
        // Mock de retorno da API do Melhor Envio (em Reais)
        mockCalculate.mockResolvedValue([
            { id: 1, price: 25.50, error: null }
        ])

        const context = {
            items: [{ unit_price: 100, quantity: 1, variant: { weight: 1000 } }],
            shipping_address: { postal_code: "01018020" },
            from_location: { address: { postal_code: "96020360" } },
            currency_code: "brl"
        } as any

        const result = await service.calculatePrice({ id: "1" }, {}, context)

        // O Medusa espera o valor em centavos (25.50 * 100 = 2550) [cite: 181]
        expect(result.calculated_amount).toBe(2550)
        expect(mockCalculate).toHaveBeenCalledTimes(1)
    })
})
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import setupMelhorEnvio from "../../../scripts/setup-melhor-envio";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        // Executa o script passando o scope do container
        await setupMelhorEnvio({ container: req.scope });

        // Sucesso: Tratamos 'res' como 'any' para garantir acesso ao .json()
        return (res as any).json({
            success: true,
            message: "Configuração do Melhor Envio executada com sucesso!"
        });

    } catch (error: any) {
        // Erro: Tratamos 'res' como 'any' para garantir acesso ao .status() e .json()
        return (res as any).status(500).json({
            success: false,
            message: "Erro ao executar o setup",
            error: error.message
        });
    }
};
import { MercadoPagoConfig, Order, Payment } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

if (!accessToken || !publicKey) {
    console.error("ERRO: Credenciais ausentes no .env");
    process.exit(1);
}

const mpClient = new MercadoPagoConfig({ accessToken });
const paymentClient = new Payment(mpClient);

// Extraído da screenshot do usuário
const TEST_USER_EMAIL = "TESTUSER6802714788342186304@testuser.com";

const TEST_CARDS = [
    { brand: "Mastercard", number: "5031433215406351", cvv: "123", expMonth: 11, expYear: 2030, methodId: "master" },
    { brand: "Visa", number: "4235647728025682", cvv: "123", expMonth: 11, expYear: 2030, methodId: "visa" },
    { brand: "American Express", number: "375365153556885", cvv: "1234", expMonth: 11, expYear: 2030, methodId: "amex" },
    { brand: "Elo Debito", number: "5067766783888311", cvv: "123", expMonth: 11, expYear: 2030, methodId: "elo" }
];

const TEST_SCENARIOS = [
    { code: "APRO", statusExpected: "approved", descricao: "Pagamento aprovado", doc: "12345678909" },
    { code: "OTHE", statusExpected: "rejected", descricao: "Recusado por erro geral", doc: "12345678909" },
    { code: "CONT", statusExpected: "pending", descricao: "Pagamento pendente", doc: "" },
    { code: "CALL", statusExpected: "rejected", descricao: "Recusado com validação para autorizar", doc: "" },
    { code: "FUND", statusExpected: "rejected", descricao: "Recusado por quantia insuficiente", doc: "" },
    { code: "SECU", statusExpected: "rejected", descricao: "Recusado por código de segurança", doc: "" },
    { code: "EXPI", statusExpected: "rejected", descricao: "Recusado por validade expirada", doc: "" },
    { code: "FORM", statusExpected: "rejected", descricao: "Recusado por erro no formulário", doc: "" },
];

async function tokenizeCard(card: any, scenario: any) {
    console.log(`[Frontend Mock] Gerando Token para o cartão ${card.brand} (Cenário: ${scenario.code})...`);

    // Na API de card_tokens, o Mercado Pago instrui a enviar o código (APRO, OTHE) no "cardholder.name"
    // para forçar os status de rejeição em Sandbox quando não se envia o CPF.
    const nameToUse = scenario.code;

    const body = {
        cardNumber: card.number,
        securityCode: card.cvv,
        expirationMonth: card.expMonth,
        expirationYear: card.expYear,
        cardholder: {
            name: nameToUse,
            ...(scenario.doc && {
                identification: {
                    type: "CPF",
                    number: scenario.doc
                }
            })
        }
    };

    try {
        const response = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${publicKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.id) {
            console.log(`[Frontend Mock] Token Gerado: ${data.id}`);
            return data.id;
        } else {
            console.error(`[Frontend Mock] Falha ao gerar token:`, JSON.stringify(data));
            return null;
        }
    } catch (e) {
        console.error(`[Frontend Mock] Erro de requisição no token:`, e);
        return null;
    }
}

async function runTests() {
    console.log("==========================================================");
    console.log("TESTES MP: FRONTEND (Tokenização) + BACKEND (Autorização)");
    console.log("==========================================================");

    // Vamos testar apenas o Mastercard para rodar todos os cenários rapidamente
    const card = TEST_CARDS[0];

    for (const scenario of TEST_SCENARIOS) {
        console.log(`\n------------------------------------------------`)
        console.log(`Testando Cenário: [${card.brand}] -> [Status Esperado: ${scenario.code} - ${scenario.descricao}]`);

        // 1. O Frontend gera o Token usando a Public Key e o cartão de teste
        const cardToken = await tokenizeCard(card, scenario);
        if (!cardToken) {
            console.log(`⚠️ Skiping scenario devio à falha no token...`);
            continue;
        }

        // 2. O Backend recebe o token e tenta criar o pagamento
        console.log(`[Backend Mock] Chamando API de Pagamento com o token obtido...`);
        const payload = {
            body: {
                transaction_amount: 50.00,
                description: `Teste E2E - ${scenario.code}`,
                payment_method_id: card.methodId,
                token: cardToken,
                installments: 1,
                payer: {
                    email: TEST_USER_EMAIL,
                    identification: {
                        type: "CPF",
                        number: scenario.doc || "12345678909"
                    }
                }
            },
            requestOptions: {
                idempotencyKey: `teste2e_${Date.now()}_${Math.random()}`
            }
        };

        try {
            const response = await paymentClient.create(payload);
            console.log(`✅ Sucesso na Chamada API de Pagamento (Credencial aceitou!)`);
            console.log(`Status Resultante: ${response.status} | Detalhe: ${response.status_detail}`);

            if (response.status === scenario.statusExpected) {
                console.log(`--> MATCH! O MP respondeu exatamente conforme o status (${scenario.statusExpected}) do cenário ${scenario.code}.`);
            } else {
                console.log(`--> ALERTA: Esperado ${scenario.statusExpected}, mas retornou ${response.status}`);
            }
        } catch (error: any) {
            console.log(`❌ ERRO NA CHAMADA API DE PAGAMENTO`);
            if (error.response || error.api_response) {
                const apiError = error.response || error.api_response;
                if (apiError.cause && apiError.cause.length > 0) {
                    console.error(`- Detalhe Mercado Pago:`, apiError.cause[0].description);
                } else if (apiError.message) {
                    console.error(`- Resposta:`, apiError.message);
                }
            } else {
                console.error(`- Mensagem base: ${error.message}`);
            }
        }
    }
}

runTests();

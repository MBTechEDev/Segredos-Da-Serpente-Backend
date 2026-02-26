import { MercadoPagoConfig, Order } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
        console.error("No access token");
        return;
    }

    const mpClient = new MercadoPagoConfig({ accessToken });
    const orderClient = new Order(mpClient);

    const orderRequest = {
        body: {
            type: "online",
            processing_mode: "automatic",
            external_reference: "medusa-cart-" + Date.now(),
            total_amount: "10.00",
            payer: { email: "test@testuser.com" },
            transactions: {
                payments: [{
                    amount: "10.00",
                    payment_method: {
                        id: "pix",
                        type: "bank_transfer"
                    }
                }]
            }
        },
        requestOptions: {
            idempotencyKey: "test-idempotency-" + Date.now()
        }
    };

    try {
        console.log("Sending order request");
        const res = await orderClient.create(orderRequest);
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch (e: any) {
        console.error("Error stringified:", JSON.stringify(e));
        if (e.cause) console.error("Cause:", e.cause);
        if (e.response) console.error("Response:", e.response);
        if (e.message) console.error("Message:", e.message);
    }
}

test();

// src/modules/email/templates/pix-reminder.tsx

import {
    Body,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
} from "@react-email/components"
import { BigNumberValue, CustomerDTO, OrderDTO } from "@medusajs/framework/types"

type PixReminderEmailProps = {
    order: OrderDTO & {
        customer: CustomerDTO
    }
    qr_code: string
    qr_code_base64: string
    ticket_url: string
}

export function PixReminderEmailComponent({ order, qr_code, qr_code_base64, ticket_url }: PixReminderEmailProps) {
    const formatter = new Intl.NumberFormat([], {
        style: "currency",
        currencyDisplay: "narrowSymbol",
        currency: order.currency_code,
    })

    const formatPrice = (price: BigNumberValue) => {
        if (typeof price === "number") return formatter.format(price)
        if (typeof price === "string") return formatter.format(parseFloat(price))
        return price?.toString() || ""
    }

    return (
        <Html>
            <Head />
            <Preview>Aguardando o ritual de pagamento. Garanta seu pedido #{String(order.display_id)} no PIX!</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#10b981",
                                gold: "#D4AF37",
                                dark: "#0a0a0a",
                                "dark-muted": "#1a1a1a",
                            },
                        },
                    },
                }}
            >
                <Body className="bg-[#050505] my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#1a1a1a] rounded my-[40px] mx-auto max-w-[600px] overflow-hidden">

                        {/* Header */}
                        <Section className="bg-dark p-[40px] text-center border-b border-[#D4AF37]/30">
                            <Heading className="text-gold text-[28px] font-serif m-0 p-0 uppercase tracking-[4px]">
                                Segredos da Serpente
                            </Heading>
                            <Text className="text-brand text-[12px] tracking-[2px] uppercase mt-2">
                                Reserva de Artefatos
                            </Text>
                        </Section>

                        {/* Message */}
                        <Section className="px-[40px] py-[30px] bg-dark text-center">
                            <Heading className="text-white text-[22px] font-bold">
                                Falta pouco para iniciar sua jornada, {order.customer?.first_name || order.shipping_address?.first_name}.
                            </Heading>
                            <Text className="text-gray-400 text-[15px] leading-[24px] mt-4">
                                Seu pedido foi reservado com sucesso. Use o QR Code ou o código "Copia e Cola" abaixo para efetuar o pagamento via PIX e liberar seus itens.
                            </Text>
                        </Section>

                        {/* PIX Payment Area */}
                        <Section className="px-[40px] pb-[30px] bg-dark text-center">
                            <Section className="bg-[#111] border border-white/5 rounded-lg p-6 max-w-[400px] mx-auto">
                                <Text className="text-gold text-[13px] font-bold uppercase tracking-widest m-0 mb-4">
                                    Escaneie o QR Code
                                </Text>

                                {qr_code_base64 && (
                                    <Img
                                        src={`data:image/png;base64,${qr_code_base64}`}
                                        alt="QR Code PIX"
                                        width="180"
                                        height="180"
                                        className="mx-auto rounded-md border border-white/10 p-2 bg-white"
                                    />
                                )}

                                <Text className="text-gray-400 text-[12px] mt-6 mb-2 uppercase tracking-wider">
                                    Código PIX Copia e Cola
                                </Text>
                                <div className="bg-black p-3 rounded border border-white/10 text-left select-all overflow-x-auto">
                                    <code className="text-brand text-[11px] font-mono break-all whitespace-pre-wrap">
                                        {qr_code}
                                    </code>
                                </div>

                                {ticket_url && (
                                    <Section className="mt-6">
                                        <Link
                                            href={ticket_url}
                                            className="bg-brand text-white px-4 py-3 rounded-md font-bold text-[13px] no-underline inline-block w-full text-center"
                                        >
                                            Ver Página de Pagamento
                                        </Link>
                                    </Section>
                                )}
                            </Section>
                        </Section>

                        {/* Total Summary Mini */}
                        <Section className="px-[40px] py-4 bg-dark-muted text-center">
                            <Text className="text-gray-400 m-0 text-[14px]">
                                Valor Total a ser Pago: <strong className="text-gold text-[16px]">{formatPrice(order.total)}</strong>
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="bg-dark p-[40px] text-center border-t border-white/5">
                            <Text className="text-gray-500 text-[12px]">
                                O link expira em breve. Se precisar de suporte, acione os guardiões em <Link href="mailto:suporte@segredosdaserpente.com.br" className="text-brand underline">suporte@segredosdaserpente.com.br</Link>
                            </Text>
                            <Text className="text-gray-600 text-[10px] mt-6">
                                © {new Date().getFullYear()} Segredos da Serpente. Todos os direitos reservados.
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export const pixReminderEmail = (props: PixReminderEmailProps) => (
    <PixReminderEmailComponent {...props} />
)
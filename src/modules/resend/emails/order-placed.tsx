// src/modules/email/templates/order-placed.tsx

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

type OrderPlacedEmailProps = {
    order: OrderDTO & {
        customer: CustomerDTO
    }
    email_banner?: {
        body: string
        title: string
        url: string
    }
}

/**
 * Componente de E-mail de Confirmação de Pedido
 * Estilo: Dark Mystical (Segredos da Serpente)
 */
function OrderPlacedEmailComponent({ order, email_banner }: OrderPlacedEmailProps) {
    const shouldDisplayBanner = email_banner && "title" in email_banner

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
            <Preview>Sua jornada começa agora. Pedido #{formatPrice(order.display_id)} confirmado!</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#10b981", // Emerald
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

                        {/* Header / Logo Section */}
                        <Section className="bg-dark p-[40px] text-center border-b border-[#D4AF37]/30">
                            <Heading className="text-gold text-[28px] font-serif m-0 p-0 uppercase tracking-[4px]">
                                Segredos da Serpente
                            </Heading>
                            <Text className="text-brand text-[12px] tracking-[2px] uppercase mt-2">
                                Conhecimento & Esoterismo
                            </Text>
                        </Section>

                        {/* Hero Message */}
                        <Section className="px-[40px] py-[30px] bg-dark">
                            <Heading className="text-white text-[24px] font-bold text-center">
                                O ritual foi concluído, {order.customer?.first_name || order.shipping_address?.first_name}.
                            </Heading>
                            <Text className="text-gray-400 text-[16px] leading-[24px] text-center mt-4">
                                Recebemos seu pedido e já iniciamos a preparação dos seus itens.
                                Você receberá um novo sinal assim que eles forem enviados.
                            </Text>
                        </Section>

                        {/* Promotional Banner (Dark Mystical Variant) */}
                        {shouldDisplayBanner && (
                            <Section className="px-[40px] mb-8">
                                <Section className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-gold/50 rounded-lg p-6">
                                    <Heading className="text-gold text-xl font-semibold m-0">
                                        {email_banner.title}
                                    </Heading>
                                    <Text className="text-gray-300 mt-2 mb-4">{email_banner.body}</Text>
                                    <Link
                                        href={email_banner.url}
                                        className="bg-brand text-white px-6 py-3 rounded-md font-bold text-[14px] no-underline inline-block"
                                    >
                                        Explorar Agora
                                    </Link>
                                </Section>
                            </Section>
                        )}

                        {/* Order Items */}
                        <Section className="px-[40px] bg-dark">
                            <Text className="text-gold text-[14px] font-bold uppercase tracking-widest mb-4">
                                Seus Itens Selecionados
                            </Text>

                            {order.items?.map((item) => (
                                <Section key={item.id} className="mb-6 border-b border-white/5 pb-4">
                                    <Row>
                                        <Column className="w-[100px] align-top">
                                            <Img
                                                src={item.thumbnail ?? 'https://via.placeholder.com/100x100?text=Item'}
                                                alt={item.product_title ?? ''}
                                                width="100"
                                                height="100"
                                                className="rounded-md border border-white/10"
                                            />
                                        </Column>
                                        <Column className="pl-6 align-top">
                                            <Text className="text-white text-[16px] font-bold m-0">
                                                {item.product_title}
                                            </Text>
                                            <Text className="text-gray-500 text-[14px] m-0 mt-1">
                                                {item.variant_title} • Qtd: {item.quantity}
                                            </Text>
                                            <Text className="text-brand text-[14px] font-bold mt-2">
                                                {formatPrice(item.total)}
                                            </Text>
                                        </Column>
                                    </Row>
                                </Section>
                            ))}
                        </Section>

                        {/* Financial Summary */}
                        <Section className="px-[40px] py-4 bg-dark-muted">
                            <Row className="mb-2">
                                <Column><Text className="text-gray-400 m-0">Subtotal</Text></Column>
                                <Column align="right">
                                    <Text className="text-white m-0">{formatPrice(order.item_total)}</Text>
                                </Column>
                            </Row>

                            {order.shipping_methods?.map((method) => (
                                <Row className="mb-2" key={method.id}>
                                    <Column><Text className="text-gray-400 m-0">Envio ({method.name})</Text></Column>
                                    <Column align="right">
                                        <Text className="text-white m-0">{formatPrice(method.total)}</Text>
                                    </Column>
                                </Row>
                            ))}

                            <Row className="mb-2">
                                <Column><Text className="text-gray-400 m-0">Impostos</Text></Column>
                                <Column align="right">
                                    <Text className="text-white m-0">{formatPrice(order.tax_total || 0)}</Text>
                                </Column>
                            </Row>

                            <Hr className="border-white/10 my-4" />

                            <Row>
                                <Column>
                                    <Text className="text-gold text-[18px] font-bold m-0 uppercase">Total</Text>
                                </Column>
                                <Column align="right">
                                    <Text className="text-gold text-[18px] font-bold m-0">
                                        {formatPrice(order.total)}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Footer */}
                        <Section className="bg-dark p-[40px] text-center border-t border-white/5">
                            <Text className="text-gray-500 text-[12px] leading-[20px]">
                                Dúvidas sobre sua jornada? Entre em contato com nossos guardiões em <Link href="mailto:suporte@segredosdaserpente.com.br" className="text-brand underline">suporte@segredosdaserpente.com.br</Link>
                            </Text>
                            <Text className="text-gray-600 text-[10px] mt-4 uppercase tracking-widest">
                                ID do Pedido: {order.id}
                            </Text>
                            <Text className="text-gray-600 text-[10px] mt-8">
                                © {new Date().getFullYear()} Segredos da Serpente. Todos os direitos reservados.
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
    <OrderPlacedEmailComponent {...props} />
)

// Mock para Preview do React Email
const mockOrder = {
    order: {
        id: "order_preview_123",
        display_id: 1,
        currency_code: "brl",
        total: 150.00,
        item_total: 130.00,
        tax_total: 0,
        customer: {
            first_name: "Adepto",
        },
        items: [
            {
                id: "li_1",
                product_title: "Grimório de Prata",
                variant_title: "Edição de Luxo",
                thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
                total: 130.00,
                quantity: 1,
            }
        ],
        shipping_methods: [
            {
                id: "sm_1",
                name: "Entrega Mística (Sedex)",
                total: 20.00
            }
        ]
    }
}

// @ts-ignore
export default () => <OrderPlacedEmailComponent {...mockOrder} />
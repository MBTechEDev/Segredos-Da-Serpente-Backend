import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components"

type OrderShippedEmailProps = {
    order: {
        display_id: number | string
        email: string
        shipping_address?: {
            first_name?: string
        }
    }
    tracking_numbers: string[]
    tracking_urls: string[]
}

function OrderShippedEmailComponent({ order, tracking_numbers, tracking_urls }: OrderShippedEmailProps) {
    const nome = order?.shipping_address?.first_name || "Adepto"

    // Fallback if no tracking
    const hasTracking = tracking_numbers && tracking_numbers.length > 0;

    return (
        <Html>
            <Head />
            <Preview>O mensageiro partiu. Seu pedido #{String(order?.display_id || "")} está a caminho!</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#10b981", // Emerald
                                gold: "#D4AF37",
                                dark: "#0a0a0a",
                            },
                        },
                    },
                }}
            >
                <Body className="bg-[#050505] my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#1a1a1a] rounded my-[40px] mx-auto max-w-[600px] overflow-hidden">

                        <Section className="bg-dark p-[40px] text-center border-b border-[#D4AF37]/30">
                            <Heading className="text-gold text-[28px] font-serif m-0 p-0 uppercase tracking-[4px]">
                                Segredos da Serpente
                            </Heading>
                            <Text className="text-brand text-[12px] tracking-[2px] uppercase mt-2">
                                Jornada Iniciada
                            </Text>
                        </Section>

                        <Section className="px-[40px] py-[30px] bg-dark">
                            <Heading className="text-white text-[24px] font-bold text-center">
                                Seus Itens Foram Enviados, {nome}.
                            </Heading>
                            <Text className="text-gray-400 text-[16px] leading-[24px] text-center mt-4 mb-8">
                                Os artefatos e grimórios referentes ao pedido <strong>#{order?.display_id}</strong> já deixaram nossos cofres de armazenamento e foram entregues aos mensageiros sob o véu da noite.
                            </Text>

                            {hasTracking ? (
                                <Section className="bg-[#111] border border-white/10 rounded-md p-[20px] text-center mb-8">
                                    <Text className="text-gold text-[14px] uppercase font-bold tracking-widest m-0 mb-4">
                                        Rastros da Remessa
                                    </Text>

                                    {tracking_numbers.map((code, index) => {
                                        const url = tracking_urls && tracking_urls[index];
                                        const isLast = index === tracking_numbers.length - 1;
                                        return (
                                            <Section key={code} className={isLast ? "mb-0" : "mb-4"}>
                                                <Text className="text-white text-[18px] font-mono tracking-[4px] bg-[#000] p-2 inline-block rounded border border-white/5">
                                                    {code}
                                                </Text>
                                                {url && (
                                                    <Text className="mt-4">
                                                        <Link href={url} className="text-brand text-[14px] underline">
                                                            Acompanhar Rota Mística
                                                        </Link>
                                                    </Text>
                                                )}
                                            </Section>
                                        )
                                    })}
                                </Section>
                            ) : (
                                <Section className="bg-[#111] border border-white/10 rounded-md p-[20px] text-center mb-8">
                                    <Text className="text-gray-300 text-[14px] m-0">
                                        Seus itens seguem com os emissários locais e chegarão em breve no portal designado. Você poderá conferir o rastreio diretamente pela sua conta local, se houver um disponível num momento futuro.
                                    </Text>
                                </Section>
                            )}

                            <Section className="text-center mt-[16px] mb-[16px]">
                                <Link
                                    href="http://localhost:3000/conta"
                                    className="text-white font-bold text-[14px] no-underline underline"
                                >
                                    Ver Meus Pedidos
                                </Link>
                            </Section>
                        </Section>

                        <Section className="bg-dark p-[40px] text-center border-t border-white/5">
                            <Text className="text-gray-500 text-[12px] leading-[20px]">
                                Inquieto sobre os mistérios de sua entrega? <Link href="mailto:suporte@segredosdaserpente.com.br" className="text-brand underline">Fale conosco</Link>.
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

export const orderShippedEmail = (props: OrderShippedEmailProps) => (
    <OrderShippedEmailComponent {...props} />
)

const mockOrderShipped = {
    order: {
        display_id: 111,
        email: "adepto@oculto.com",
        shipping_address: {
            first_name: "Adepto"
        }
    },
    tracking_numbers: ["BR123456789XP"],
    tracking_urls: ["https://melhorenvio.com.br/rastreio/BR123456789XP"]
}

// @ts-ignore
export default () => <OrderShippedEmailComponent {...mockOrderShipped} />
